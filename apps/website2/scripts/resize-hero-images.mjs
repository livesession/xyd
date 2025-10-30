import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join } from 'path';

const publicDir = './public';
const targetImages = [
  'hero--bg1.webp',
  'hero--bg2.webp',
  'hero--bg3.webp',
  'hero--bg4.webp',
];

// Target size is 656x656 (displayed size) but we'll create 2x for retina
const targetSize = 656 * 2; // 1312px for 2x displays

async function resizeImage(filename) {
  const inputPath = join(publicDir, filename);
  const outputPath = inputPath; // Overwrite original
  const backupPath = `${inputPath}.backup`;
  
  console.log(`\n📸 Resizing: ${filename}`);
  
  try {
    // Get original size
    const metadata = await sharp(inputPath).metadata();
    const originalSizeKB = ((await sharp(inputPath).toBuffer()).length / 1024).toFixed(2);
    
    console.log(`   Original: ${metadata.width}x${metadata.height} - ${originalSizeKB} KB`);
    
    // Create backup
    await sharp(inputPath).toFile(backupPath);
    console.log(`   ✅ Backup created: ${backupPath}`);
    
    // Resize to target (maintain aspect ratio, fit within bounds)
    await sharp(inputPath)
      .resize(targetSize, targetSize, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85, effort: 6 })
      .toFile(outputPath + '.tmp');
    
    // Replace original with resized
    await sharp(outputPath + '.tmp').toFile(outputPath);
    
    const newMetadata = await sharp(outputPath).metadata();
    const newSizeKB = ((await sharp(outputPath).toBuffer()).length / 1024).toFixed(2);
    const savings = ((1 - newSizeKB / originalSizeKB) * 100).toFixed(1);
    
    console.log(`   ✅ Resized: ${newMetadata.width}x${newMetadata.height} - ${newSizeKB} KB (${savings}% smaller)`);
    
    // Clean up temp file
    const fs = await import('fs/promises');
    try {
      await fs.unlink(outputPath + '.tmp');
    } catch (e) {
      // Ignore if temp file doesn't exist
    }
    
  } catch (error) {
    console.error(`   ❌ Error resizing ${filename}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting image resize...\n');
  console.log(`Target size: ${targetSize}x${targetSize} (2x for retina displays)`);
  console.log(`Displayed at: 656x656 (1x)\n`);
  
  for (const filename of targetImages) {
    await resizeImage(filename);
  }
  
  console.log('\n✨ Image resize complete!');
  console.log('\n📝 Summary:');
  console.log('   - Images resized to optimal dimensions');
  console.log('   - Originals backed up with .backup extension');
  console.log('   - If satisfied, delete .backup files');
  console.log('   - If not satisfied, restore from backups');
}

main().catch(console.error);

