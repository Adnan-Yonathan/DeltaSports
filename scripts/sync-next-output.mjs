import { cp, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

async function main() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(scriptDir, '..');
  const src = resolve(repoRoot, 'web', 'out');
  const dest = resolve(repoRoot, '.next');

  try {
    await stat(src);
  } catch (error) {
    console.error(`Expected Next.js export output at "${src}" but it was not found.`);
    throw error;
  }

  await rm(dest, { recursive: true, force: true });
  await cp(src, dest, { recursive: true });
  console.log(`Copied Next.js build output from ${src} to ${dest}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
