/**
 * Generate favicon.ico from SVG
 * 
 * This script converts the SVG favicon to ICO format with multiple sizes
 * for better browser compatibility.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import toIco from 'to-ico';

const sizes = [16, 32, 48]; // Standard favicon sizes

async function generateFavicon() {
  const svgPath = join(process.cwd(), 'public', 'favicon.svg');
  const icoPath = join(process.cwd(), 'public', 'favicon.ico');

  console.log('Reading SVG file...');
  const svgBuffer = readFileSync(svgPath);

  console.log('Generating PNG images at different sizes...');
  const pngBuffers = await Promise.all(
    sizes.map(async (size) => {
      const png = await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();
      return png;
    })
  );

  console.log('Converting to ICO format...');
  const icoBuffer = await toIco(pngBuffers, {
    sizes: sizes
  });

  console.log('Writing favicon.ico...');
  writeFileSync(icoPath, icoBuffer);

  console.log(`✅ Successfully generated ${icoPath}`);
}

generateFavicon().catch((error) => {
  console.error('Error generating favicon:', error);
  process.exit(1);
});

