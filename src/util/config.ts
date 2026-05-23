import fs from 'node:fs';
import path from 'node:path';

export interface AgentMemoryConfig {
  title: string;
  source: string;
  out: string;
  defaultMode: 'private' | 'public' | 'redacted';
  publicExcludesSensitivity: string[];
  categories: string[];
  baseUrl?: string;
  description?: string;
  contact?: string;
  redact?: string[];
}

const DEFAULTS: AgentMemoryConfig = {
  title: 'Agent Memory Site',
  source: './memory',
  out: './site',
  defaultMode: 'private',
  publicExcludesSensitivity: ['personal', 'credential', 'financial', 'medical'],
  categories: ['projects', 'people', 'decisions', 'facts', 'daily', 'handoffs', 'procedures'],
};

export function loadConfig(cwd: string = process.cwd()): AgentMemoryConfig {
  const candidates = [
    path.join(cwd, 'agent-memory.config.json'),
    path.join(cwd, '.agent-memory.json'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const raw = fs.readFileSync(c, 'utf8');
        const parsed = JSON.parse(raw);
        return { ...DEFAULTS, ...parsed };
      } catch {
        // ignore malformed config; fall back to defaults
      }
    }
  }
  return DEFAULTS;
}
