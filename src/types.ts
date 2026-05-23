export type Visibility = 'public' | 'private' | 'team';
export type Sensitivity = 'none' | 'personal' | 'credential' | 'financial' | 'medical';
export type BuildMode = 'private' | 'public' | 'redacted';

export interface MemoryMeta {
  title?: string;
  date?: string;
  created_at?: string;
  updated?: string;
  tags?: string[];
  keywords?: string[];
  type?: string;
  status?: string;
  visibility?: Visibility;
  sensitivity?: Sensitivity;
  related?: string[];
  supersedes?: string[];
  superseded_by?: string;
  /** User-supplied per-note deny-list of literal strings to redact. */
  redact?: string[];
  [key: string]: unknown;
}

export interface Note {
  id: string;
  sourcePath: string;
  /** Always forward-slash separated, relative to source root. */
  relPath: string;
  slug: string;
  category: string;
  title: string;
  body: string;
  /** Rendered HTML with wiki-link sentinels — resolved at build time. */
  html: string;
  text: string;
  meta: MemoryMeta;
  /** Wiki-link target slugs (extracted from body). */
  links: string[];
  backlinks: string[];
  content_hash: string;
  created_at?: string;
  updated_at?: string;
}

export interface Chunk {
  chunk_id: string;
  doc_id: string;
  title: string;
  heading_path: string[];
  type: string;
  text: string;
  html: string;
  source_path: string;
  canonical_url: string;
  updated?: string;
  created_at?: string;
  tags: string[];
  keywords?: string[];
  tokens: number;
  content_hash: string;
  visibility?: Visibility;
  sensitivity?: Sensitivity;
  supersedes?: string[];
  superseded_by?: string;
}

export interface BuildOptions {
  mode: BuildMode;
  strictRedact?: boolean;
  baseUrl?: string;
  title?: string;
  description?: string;
}
