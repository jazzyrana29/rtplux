#!/usr/bin/env ts-node

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

// Define source of raw assets and target for optimized output
const SRC_ROOT = join(__dirname, '..', 'assets', 'games');
const OUT_ROOT = join(__dirname, '..', 'public', 'assets', 'games');

// Clean the entire output folder before packing
function cleanOutput() {
  rmSync(OUT_ROOT, { recursive: true, force: true });
  console.log(`🗑️  Cleared output folder ${OUT_ROOT}`);
}

/**
 * Recursively process every directory under SRC_ROOT:
 * - If a directory contains multiple PNGs: pack into an atlas (.png + .json) and generate .webp
 * - If it contains a single PNG: convert it directly to .webp
 * Output preserves relative structure under OUT_ROOT.
 */
async function processDir(srcDir: string) {
  // Compute where to write outputs
  const relPath = relative(SRC_ROOT, srcDir);
  const destDir = join(OUT_ROOT, relPath);

  // Read directory entries
  const entries = readdirSync(srcDir, { withFileTypes: true });
  const pngFiles = entries
    .filter((e) => e.isFile() && extname(e.name).toLowerCase() === '.png')
    .map((e) => e.name);
  const subDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  // Only process directories that actually exist in src
  if (pngFiles.length > 1) {
    // Multi-file atlas case
    console.log(`📦 Packing atlas for '${relPath}' (${pngFiles.length} PNGs)`);
    // Ensure destDir
    mkdirSync(destDir, { recursive: true });

    // Prepare buffers for packer
    const files = pngFiles.map((name) => ({
      path: name,
      contents: readFileSync(join(srcDir, name)),
    }));
    const atlasName = basename(relPath) || 'root';
    const config = {
      textureName: atlasName,
      dataFile: `${atlasName}.json`,
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
      FreeTexPacker(
        files,
        config,
        (
          results: Array<{ name: string; buffer: Buffer }>,
          error: Error | undefined
        ) => {
          if (error) return reject(error);
          exported.push(...results);
          resolve();
        }
      );
    });

    // Write atlas outputs and convert each PNG to WebP
    for (const file of exported) {
      const outPath = join(destDir, file.name);
      writeFileSync(outPath, file.buffer);
      console.log(`✏️  Wrote ${relative(process.cwd(), outPath)}`);
      if (file.name.toLowerCase().endsWith('.png')) {
        const webpName = file.name.replace(/\.png$/i, '.webp');
        const webpPath = join(destDir, webpName);
        await sharp(file.buffer).toFormat('webp').toFile(webpPath);
        console.log(`🔄 Converted ${file.name} → ${webpName}`);
      }
    }
  } else if (pngFiles.length === 1) {
    // Single-image case: convert only
    const name = pngFiles[0];
    console.log(
      `🔄 Converting single ${relative(SRC_ROOT, join(srcDir, name))} → WebP`
    );
    mkdirSync(destDir, { recursive: true });
    const buffer = readFileSync(join(srcDir, name));
    const webpName = `${basename(name, '.png')}.webp`;
    const webpPath = join(destDir, webpName);
    await sharp(buffer).toFormat('webp').toFile(webpPath);
    console.log(`✅ Converted to ${relative(process.cwd(), webpPath)}`);
  }

  // Recurse into subdirectories
  for (const sub of subDirs) {
    await processDir(join(srcDir, sub));
  }
}

// Entry point
(async () => {
  cleanOutput();
  // Start recursion at SRC_ROOT
  await processDir(SRC_ROOT);
  console.log(
    '✅ All nested assets have been packed and optimized under public/assets/games'
  );
})();
