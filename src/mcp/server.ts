import fs from 'node:fs';
import path from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

interface ChunkRecord {
  chunk_id: string;
  doc_id: string;
  title: string;
  heading_path: string[];
  type: string;
  text: string;
  html?: string;
  source_path: string;
  canonical_url: string;
  updated?: string;
  tags?: string[];
  keywords?: string[];
  tokens?: number;
  content_hash?: string;
  visibility?: string;
  sensitivity?: string;
}

interface ManifestNote {
  id: string;
  title: string;
  path: string;
  category: string;
  source?: string;
  updated?: string;
  content_hash?: string;
}

interface Manifest {
  generator: string;
  version: string;
  generated_at: string;
  mode: string;
  title: string;
  count: number;
  chunks: number;
  notes: ManifestNote[];
}

interface SiteBundle {
  root: string;
  chunks: ChunkRecord[];
  manifest: Manifest;
}

function loadBundle(siteDir: string): SiteBundle {
  const root = path.resolve(siteDir);
  if (!fs.existsSync(root)) {
    throw new Error(`MCP --site directory not found: ${root}`);
  }
  const manifestPath = path.join(root, 'manifest.json');
  const chunksPath = path.join(root, 'chunks.jsonl');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing manifest.json in ${root}. Did you run \`agent-memory build\` first?`);
  }
  if (!fs.existsSync(chunksPath)) {
    throw new Error(`Missing chunks.jsonl in ${root}. Did you run \`agent-memory build\` first?`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Manifest;
  const chunks: ChunkRecord[] = [];
  for (const line of fs.readFileSync(chunksPath, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      chunks.push(JSON.parse(line) as ChunkRecord);
    } catch {
      // skip malformed lines
    }
  }
  return { root, chunks, manifest };
}

interface ScoreOpts {
  query: string;
  type?: string;
  tag?: string;
  limit?: number;
}

function scoreChunks(bundle: SiteBundle, opts: ScoreOpts): ChunkRecord[] {
  const query = (opts.query || '').trim().toLowerCase();
  const terms = query ? query.split(/\s+/).filter(Boolean) : [];
  const tagLower = opts.tag ? opts.tag.toLowerCase() : null;
  const typeLower = opts.type ? opts.type.toLowerCase() : null;

  const ranked = bundle.chunks
    .filter((c) => (typeLower ? String(c.type || '').toLowerCase() === typeLower : true))
    .filter((c) => (tagLower ? (c.tags || []).some((t) => String(t).toLowerCase() === tagLower) : true))
    .map((c) => {
      let s = 0;
      const hay = (
        (c.title || '') +
        ' ' +
        (c.heading_path || []).join(' ') +
        ' ' +
        (c.tags || []).join(' ') +
        ' ' +
        (c.text || '')
      ).toLowerCase();
      for (const t of terms) {
        if (!t) continue;
        if ((c.title || '').toLowerCase().includes(t)) s += 10;
        if ((c.tags || []).some((x) => String(x).toLowerCase().includes(t))) s += 5;
        const idx = hay.indexOf(t);
        if (idx >= 0) s += 1 + Math.max(0, 5 - Math.floor(idx / 100));
      }
      return { chunk: c, score: s };
    })
    .filter((x) => (terms.length ? x.score > 0 : true))
    .sort((a, b) => b.score - a.score);

  const limit = Math.max(1, Math.min(50, opts.limit || 10));
  return ranked.slice(0, limit).map((r) => r.chunk);
}

interface ServeMcpOptions {
  siteDir: string;
  name?: string;
  version?: string;
}

export async function runMcpServer(opts: ServeMcpOptions): Promise<void> {
  const bundle = loadBundle(opts.siteDir);
  const server = new Server(
    { name: opts.name || 'agent-memory-site', version: opts.version || '0.0.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'search_memory',
        description: 'Full-text + tag/type filter over the compiled memory bundle. Returns ranked chunks with provenance.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Free-text query.' },
            type: { type: 'string', description: 'Optional doc type filter (e.g. project, decision).' },
            tag: { type: 'string', description: 'Optional tag filter.' },
            limit: { type: 'number', description: 'Max results (1-50). Default 10.' },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_note',
        description: 'Fetch a note by id (slug) or by canonical path. Returns its chunks concatenated.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Note slug/id.' },
          },
          required: ['id'],
        },
      },
      {
        name: 'list_recent',
        description: 'List the most recently updated notes.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max results (1-50). Default 20.' },
            type: { type: 'string', description: 'Optional doc type filter.' },
          },
        },
      },
      {
        name: 'list_categories',
        description: 'Return the categories present in the memory bundle with note counts.',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const a = (args || {}) as Record<string, unknown>;
    if (name === 'search_memory') {
      const query = String(a.query || '');
      const type = typeof a.type === 'string' ? a.type : undefined;
      const tag = typeof a.tag === 'string' ? a.tag : undefined;
      const limit = typeof a.limit === 'number' ? a.limit : 10;
      const hits = scoreChunks(bundle, { query, type, tag, limit });
      const lines = hits.map(
        (c) =>
          `## ${c.title} — ${c.heading_path.slice(1).join(' › ') || 'intro'}\n` +
          `\`${c.chunk_id}\` (${c.canonical_url})\n\n${c.text}`,
      );
      return {
        content: [{ type: 'text', text: lines.length ? lines.join('\n\n---\n\n') : `No results for "${query}".` }],
      };
    }
    if (name === 'get_note') {
      const id = String(a.id || '').trim();
      const noteChunks = bundle.chunks.filter((c) => c.doc_id === id);
      if (!noteChunks.length) {
        return { content: [{ type: 'text', text: `Note not found: ${id}` }], isError: true };
      }
      const note = bundle.manifest.notes.find((n) => n.id === id);
      const header = note
        ? `# ${note.title}\n_${note.category} · ${note.path}${note.updated ? ` · updated ${note.updated}` : ''}_\n\n`
        : `# ${noteChunks[0].title}\n\n`;
      const body = noteChunks.map((c) => c.text).join('\n\n');
      return { content: [{ type: 'text', text: header + body }] };
    }
    if (name === 'list_recent') {
      const limit = typeof a.limit === 'number' ? a.limit : 20;
      const type = typeof a.type === 'string' ? a.type.toLowerCase() : undefined;
      const list = bundle.manifest.notes
        .filter((n) => (type ? String(n.category).toLowerCase() === type : true))
        .slice()
        .sort((x, y) => (y.updated || '').localeCompare(x.updated || ''))
        .slice(0, Math.max(1, Math.min(50, limit)))
        .map((n) => `- **${n.title}** (\`${n.id}\`) — ${n.category}${n.updated ? ` · ${n.updated}` : ''}`)
        .join('\n');
      return { content: [{ type: 'text', text: list || 'No notes.' }] };
    }
    if (name === 'list_categories') {
      const counts = new Map<string, number>();
      for (const n of bundle.manifest.notes) counts.set(n.category, (counts.get(n.category) || 0) + 1);
      const lines = [...counts.entries()].map(([c, n]) => `- ${c}: ${n}`);
      return { content: [{ type: 'text', text: lines.join('\n') || 'No categories.' }] };
    }
    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
