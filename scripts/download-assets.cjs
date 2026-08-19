const fs = require('fs');
const https = require('https');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const fontsDir = path.join(publicDir, 'fonts');
const iconsDir = path.join(publicDir, 'tech-icons');

fs.mkdirSync(fontsDir, { recursive: true });
fs.mkdirSync(iconsDir, { recursive: true });

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
};

const fonts = [
  { url: 'https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJuktqQ4E.woff2', name: 'outfit-latin-ext.woff2' },
  { url: 'https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJtEtq.woff2', name: 'outfit-latin.woff2' },
  { url: 'https://fonts.gstatic.com/s/playwriteitmoderna/v11/mFTbWaYCwKPK5cx6W8jy2kwDnSUe9q45vQQi5HMFnSdEx2F5Wih8vA.woff2', name: 'playwrite-latin.woff2' }
];

const icons = [
  'html','css','js','ts','react','nextjs','nodejs','express',
  'postgres','prisma','tailwind','figma','git','github','vscode',
  'vercel','postman','vite'
];

async function main() {
  console.log('Downloading fonts...');
  for (const font of fonts) {
    const dest = path.join(fontsDir, font.name);
    await download(font.url, dest);
    console.log(`Downloaded ${font.name}`);
  }

  console.log('Downloading icons...');
  for (const icon of icons) {
    const dest = path.join(iconsDir, `${icon}.svg`);
    await download(`https://skillicons.dev/icons?i=${icon}`, dest);
    console.log(`Downloaded ${icon}.svg`);
  }
}

main().catch(console.error);
