import sharp from 'sharp';
import { stat } from 'fs/promises';
import { join } from 'path';

const publicDir = './public';
const targetImages = [
 
];

async function optimizeImage(filePath, filename) {
  const outputWebP = filePath.replace(/\.png$/, '.webp');
  
  console.log(`\n📸 Optimizing: ${filename}`);
  
  try {
    const stats = await stat(filePath);
    const originalSizeKB = (stats.size / 1024).toFixed(2);
    console.log(`   Original size: ${originalSizeKB} KB`);
    
    // Convert to WebP with high quality
    await sharp(filePath)
      .webp({ quality: 85, effort: 6 })
      .toFile(outputWebP);
    
    const webpStats = await stat(outputWebP);
    const webpSizeKB = (webpStats.size / 1024).toFixed(2);
    const savings = ((1 - webpStats.size / stats.size) * 100).toFixed(1);
    
    console.log(`   ✅ WebP created: ${webpSizeKB} KB (${savings}% smaller)`);
    
    // Also optimize the PNG (keep as fallback)
    const outputPng = filePath.replace('.png', '-optimized.png');
    await sharp(filePath)
      .png({ quality: 85, compressionLevel: 9, effort: 10 })
      .toFile(outputPng);
    
    const pngStats = await stat(outputPng);
    const pngSizeKB = (pngStats.size / 1024).toFixed(2);
    const pngSavings = ((1 - pngStats.size / stats.size) * 100).toFixed(1);
    
    console.log(`   ✅ PNG optimized: ${pngSizeKB} KB (${pngSavings}% smaller)`);
    
  } catch (error) {
    console.error(`   ❌ Error optimizing ${filename}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting image optimization...\n');
  console.log('Target images:', targetImages.join(', '));
  
  for (const filename of targetImages) {
    const filePath = join(publicDir, filename);
    try {
      await optimizeImage(filePath, filename);
    } catch (error) {
      console.error(`❌ Failed to process ${filename}:`, error.message);
    }
  }
  
  console.log('\n✨ Image optimization complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Review the optimized files');
  console.log('   2. Replace original files with -optimized versions if satisfied');
  console.log('   3. Update image references to use .webp with PNG fallback');
}

main().catch(console.error);

