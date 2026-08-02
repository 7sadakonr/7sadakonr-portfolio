import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const conversions = [
  {
    src: 'src/assets/img/logo-7m.png',
    dest: ['src/assets/img/logo-7m.webp', 'public/logo-7m.webp'],
    nearLossless: true,
    quality: 92
  },
  {
    src: 'src/assets/img/portfolio_real_new.png',
    dest: ['src/assets/img/portfolio_real_new.webp'],
    quality: 88,
    effort: 6
  },
  {
    src: 'src/assets/img/todo_list_real.png',
    dest: ['src/assets/img/todo_list_real.webp'],
    quality: 88,
    effort: 6
  },
  {
    src: 'src/assets/img/zendix_real.png',
    dest: ['src/assets/img/zendix_real.webp'],
    quality: 88,
    effort: 6
  }
];

async function run() {
  console.log('--- Converting images to WebP ---');
  for (const item of conversions) {
    if (!fs.existsSync(item.src)) {
      console.warn(`File not found: ${item.src}`);
      continue;
    }
    const origStat = fs.statSync(item.src);
    console.log(`\nProcessing: ${item.src} (${(origStat.size / 1024).toFixed(1)} KB)`);
    
    for (const outPath of item.dest) {
      const dir = path.dirname(outPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const sharpInstance = sharp(item.src);
      if (item.nearLossless) {
        await sharpInstance.webp({ quality: item.quality, nearLossless: true, effort: 6 }).toFile(outPath);
      } else {
        await sharpInstance.webp({ quality: item.quality, effort: 6, smartSubsample: true }).toFile(outPath);
      }

      const newStat = fs.statSync(outPath);
      const savedPercent = (((origStat.size - newStat.size) / origStat.size) * 100).toFixed(1);
      console.log(` -> ${outPath}: ${(newStat.size / 1024).toFixed(1)} KB (Saved ${savedPercent}%)`);
    }
  }
  console.log('\n--- WebP conversion completed successfully ---');
}

run().catch(err => {
  console.error('Error during conversion:', err);
  process.exit(1);
});
