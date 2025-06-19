#!/usr/bin/env ts-node

// File: scripts/pack-assets.ts

import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { basename, extname, join, relative } from 'path';
import sharp from 'sharp';

import FreeTexPacker, { PackerExporterType } from 'free-tex-packer-core';

// Source and output roots
const SRC_ROOT = join(__dirname, '..', 'assets', 'games');
const OUT_ROOT = join(__dirname, '..', 'public', 'assets', 'games');

/**
 * Clean the entire output folder
 */
function cleanOutput() {
  rmSync(OUT_ROOT, { recursive: true, force: true });
  console.log(`🗑️ Cleared ${OUT_ROOT}`);
}

/**
 * Recursively pack or convert each game folder
 */
async function processDir(srcDir: string) {
  const relPath = relative(SRC_ROOT, srcDir);
  const destDir = join(OUT_ROOT, relPath);

  const entries = readdirSync(srcDir, { withFileTypes: true });
  const pngFiles = entries
    .filter((e) => e.isFile() && extname(e.name).toLowerCase() === '.png')
    .map((e) => e.name);
  const subDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  if (pngFiles.length > 1) {
    console.log(`📦 Packing atlas '${relPath}' with ${pngFiles.length} PNGs`);
    mkdirSync(destDir, { recursive: true });

    // Prepare buffers for the packer
    const files = pngFiles.map((name) => ({
      path: name,
      contents: readFileSync(join(srcDir, name)),
    }));
    const atlasBase = basename(relPath) || 'root';
    const config = {
      textureName: atlasBase,
      dataFile: `${atlasBase}.json`,
      width: 2048,
      height: 2048,
      fixedSize: false,
      padding: 2,
      allowRotation: false,
      detectIdentical: true,
      allowTrim: true,
      exporter: 'Phaser3' as PackerExporterType,
    };

    const exported: Array<{ name: string; buffer: Buffer }> = [];
    await new Promise<void>((resolve, reject) => {
      FreeTexPacker(files, config, (results: any, err: Error | undefined) => {
        if (err) return reject(err);
        exported.push(...results);
        resolve();
      });
    });

    // Write out pages and convert each to WebP
    for (const file of exported) {
      const outPath = join(destDir, file.name);
      writeFileSync(outPath, file.buffer);
      console.log(`✏️ Wrote ${relative(process.cwd(), outPath)}`);
      if (/\.png$/i.test(file.name)) {
        const webpName = file.name.replace(/\.png$/i, '.webp');
        const webpPath = join(destDir, webpName);
        await sharp(file.buffer).toFormat('webp').toFile(webpPath);
        console.log(`🔄 Converted ${file.name} → ${webpName}`);
      }
    }
  } else if (pngFiles.length === 1) {
    // Single PNG: convert directly
    const name = pngFiles[0];
    console.log(`🔄 Converting single '${relPath}/${name}'`);
    mkdirSync(destDir, { recursive: true });
    const buffer = readFileSync(join(srcDir, name));
    const webpPath = join(destDir, `${basename(name, '.png')}.webp`);
    await sharp(buffer).toFormat('webp').toFile(webpPath);
    console.log(`✅ Converted to ${relative(process.cwd(), webpPath)}`);
  }

  // Recurse
  for (const sub of subDirs) {
    await processDir(join(srcDir, sub));
  }
}

// Entry point
(async () => {
  cleanOutput();
  await processDir(SRC_ROOT);
  console.log('✅ All assets packed & optimized under public/assets/games');
})();
