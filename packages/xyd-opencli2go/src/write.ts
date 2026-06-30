/** Write a generated file map to disk (the only fs-touching entry point). */
export async function writeProject(files: Record<string, string>, outDir: string): Promise<void> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(outDir, rel);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content, 'utf8');
  }
}
