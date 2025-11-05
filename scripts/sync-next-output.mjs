import { cp, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

async function main() {
  const src = resolve('web', '.next');
  const dest = resolve('.next');

  try {
    await stat(src);
  } catch (error) {
    console.error(`Expected Next.js build output at "${src}" but it was not found.`);
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
