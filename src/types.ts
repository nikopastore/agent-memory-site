export type Visibility = 'public' | 'private' | 'team';
export type Sensitivity = 'none' | 'personal' | 'credential' | 'financial' | 'medical';
export type BuildMode = 'private' | 'public' | 'redacted';
export interface MemoryMeta { title?: string; date?: string; tags?: string[]; type?: string; status?: string; visibility?: Visibility; sensitivity?: Sensitivity; related?: string[]; updated?: string; [key: string]: unknown; }
export interface Note { id: string; sourcePath: string; relPath: string; slug: string; category: string; title: string; body: string; html: string; text: string; meta: MemoryMeta; links: string[]; backlinks: string[]; }
export interface Chunk { chunk_id: string; doc_id: string; title: string; heading_path: string[]; type: string; text: string; html: string; source_path: string; canonical_url: string; updated?: string; tags: string[]; tokens: number; }
