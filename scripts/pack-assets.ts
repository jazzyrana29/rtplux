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

const FreeTexPacker: any = require('free-tex-packer-core');

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
 * Merge page JSON files into a single atlas manifest
 * Ensures meta.image points to .webp pages
 */
function combineAtlasJSON(destDir: string, atlasBase: string) {
  // Find page JSONs: atlasBase-N.json
  const pageJsons = readdirSync(destDir).filter(
    (f) => f.startsWith(`${atlasBase}-`) && f.endsWith('.json')
  );
  if (pageJsons.length === 0) return;

  const combined: any = {
    frames: {},
    meta: { image: [], size: null, scale: 1 },
  };
  let baseMeta: any = null;

  // Merge frames and capture base meta
  for (const file of pageJsons) {
    const data = JSON.parse(readFileSync(join(destDir, file), 'utf8'));
    Object.assign(combined.frames, data.frames);
    if (!baseMeta && data.meta) baseMeta = data.meta;
  }
  // Populate size/scale from baseMeta
  if (baseMeta) {
    combined.meta.size = baseMeta.size;
    combined.meta.scale = baseMeta.scale;
  }
  // Gather webp pages: atlasBase-N.webp
  const webpPages = readdirSync(destDir).filter(
    (f) => f.startsWith(`${atlasBase}-`) && f.toLowerCase().endsWith('.webp')
  );
  combined.meta.image = webpPages;

  // Write combined manifest
  const outManifest = join(destDir, `${atlasBase}.json`);
  writeFileSync(outManifest, JSON.stringify(combined, null, 2), 'utf8');
  console.log(`📑 Merged JSON → ${relative(process.cwd(), outManifest)}`);
}

/**
 * Recursively pack or convert a directory
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
    console.log(`📦 Packing atlas '${relPath}' (${pngFiles.length} PNGs)`);
    mkdirSync(destDir, { recursive: true });

    // Pack pages
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
      exporter: 'Phaser3' as any,
    };
    const exported: Array<{ name: string; buffer: Buffer }> = [];
    await new Promise<void>((resolve, reject) => {
      FreeTexPacker(files, config, (results: any, err: Error) => {
        if (err) return reject(err);
        exported.push(...results);
        resolve();
      });
    });

    // Write and convert pages
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

    // Combine JSON pages into a single manifest
    combineAtlasJSON(destDir, atlasBase);
  } else if (pngFiles.length === 1) {
    // Single-image case
    const name = pngFiles[0];
    console.log(`🔄 Converting single '${relPath}/${name}'`);
    mkdirSync(destDir, { recursive: true });
    const buf = readFileSync(join(srcDir, name));
    const webpName = `${basename(name, '.png')}.webp`;
    const webpPath = join(destDir, webpName);
    await sharp(buf).toFormat('webp').toFile(webpPath);
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
  await processDir(SRC_ROOT);
  console.log('✅ All assets packed & optimized under public/assets/games');
})();
