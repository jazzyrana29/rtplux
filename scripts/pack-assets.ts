#!/usr/bin/env ts-node

import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { basename, dirname, extname, join, relative } from 'path';
import glob from 'fast-glob';
import sharp from 'sharp';
import FreeTexPacker, { PackerExporterType } from 'free-tex-packer-core';

interface AtlasRule {
  name: string;
  sources: string[];
  multiPage?: boolean;
  maxSize?: number;
}

interface Recipe {
  atlases: AtlasRule[];
  singles?: string[];
  audio?: string[];
}

const SRC_ROOT = join(__dirname, '..', 'assets', 'games');
const OUT_ROOT = join(__dirname, '..', 'public', 'assets', 'games');

function cleanOutput() {
  rmSync(OUT_ROOT, { recursive: true, force: true });
  console.log(`🗑️ Cleared ${OUT_ROOT}`);
}

async function buildGame(game: string, recipe: Recipe) {
  const srcDir = join(SRC_ROOT, game);
  const destDir = join(OUT_ROOT, game);
  mkdirSync(destDir, { recursive: true });
  console.log(`\n🎮 Packing "${game}"…`);

  // 1) Atlases
  for (const rule of recipe.atlases) {
    const matches = await glob(rule.sources, { cwd: srcDir });
    if (matches.length === 0) {
      console.warn(
        `⚠️  [${game}] no files matched for atlas "${rule.name}".\n` +
          `    patterns: ${rule.sources.join(', ')}`
      );
      continue;
    }

    console.log(`📦 [${game}] atlas "${rule.name}" (${matches.length} files)`);
    const files = matches.map((p) => ({
      path: p,
      contents: readFileSync(join(srcDir, p)),
    }));

    const config = {
      textureName: rule.name,
      dataFile: `${rule.name}.json`,
      width: rule.maxSize || 2048,
      height: rule.maxSize || 2048,
      fixedSize: false,
      padding: 2,
      allowRotation: false,
      detectIdentical: true,
      allowTrim: true,
      exporter: 'Phaser3' as PackerExporterType,
      multipack: rule.multiPage || false,
    };

    const exported: Array<{ name: string; buffer: Buffer }> = [];
    await new Promise<void>((resolve, reject) => {
      FreeTexPacker(files, config, (results, err) => {
        if (err) return reject(err);
        exported.push(...results);
        resolve();
      });
    });

    // write out pages + WebP conversions
    for (const file of exported) {
      const outPath = join(destDir, file.name);
      writeFileSync(outPath, file.buffer);
      console.log(`   ✏️  wrote ${relative(process.cwd(), outPath)}`);
      if (file.name.toLowerCase().endsWith('.png')) {
        const webpPath = outPath.replace(/\.png$/i, '.webp');
        await sharp(file.buffer).toFormat('webp').toFile(webpPath);
        console.log(`   🔄  converted → ${basename(webpPath)}`);
      }
    }
  }

  // 2) Stand-alone images → WebP
  for (const pattern of recipe.singles || []) {
    const imgs = await glob(pattern, { cwd: srcDir });
    for (const rel of imgs) {
      const src = join(srcDir, rel);
      const dstDir = join(destDir, dirname(rel));
      mkdirSync(dstDir, { recursive: true });
      const dst = join(dstDir, basename(rel, extname(rel)) + '.webp');
      await sharp(src).toFormat('webp').toFile(dst);
      console.log(`✅ [${game}] single→WebP ${relative(process.cwd(), dst)}`);
    }
  }

  // 3) Audio copy
  for (const pattern of recipe.audio || []) {
    const tracks = await glob(pattern, { cwd: srcDir });
    for (const rel of tracks) {
      const src = join(srcDir, rel);
      const dstDir = join(destDir, dirname(rel));
      mkdirSync(dstDir, { recursive: true });
      const dst = join(dstDir, basename(rel));
      copyFileSync(src, dst);
      console.log(`🔊 [${game}] copied audio ${relative(process.cwd(), dst)}`);
    }
  }
}

(async () => {
  cleanOutput();

  // find every pack.recipe.json under assets/games/<game>/
  const recipes = await glob('*/pack.recipe.json', { cwd: SRC_ROOT });
  if (recipes.length === 0) {
    console.error(`❌ No pack.recipe.json files found in ${SRC_ROOT}`);
    process.exit(1);
  }

  for (const rel of recipes) {
    const game = rel.split('/')[0];
    const recipePath = join(SRC_ROOT, rel);
    console.log(`\n📖 Loading recipe for "${game}" from ${recipePath}`);
    const recipe: Recipe = JSON.parse(readFileSync(recipePath, 'utf8'));
    await buildGame(game, recipe);
  }

  console.log('\n✅ All assets packed & optimized under public/assets/games');
})();
