import fs from 'fs';
import path from 'path';

/**
 * Creates a Rollup plugin to copy presets directory from src to dist
 * @param options - Plugin options
 * @param options.srcDir - Source directory (default: 'src/presets')
 * @param options.distDir - Destination directory (default: 'dist/presets')
 * @param options.packageRoot - Package root directory (default: process.cwd())
 * @returns Rollup plugin
 */
export function copyPresetsPlugin(options: {
    srcDir?: string;
    distDir?: string;
    packageRoot?: string;
} = {}) {
    const {
        srcDir = 'src/presets',
        distDir = 'dist/presets',
        packageRoot = process.cwd()
    } = options;

    return {
        name: 'copy-presets',
        writeBundle() {
            const srcPresetsPath = path.join(packageRoot, srcDir);
            const distPresetsPath = path.join(packageRoot, distDir);
            
            try {
                // Check if src/presets exists
                if (!fs.existsSync(srcPresetsPath)) {
                    console.log(`${srcDir} directory does not exist, skipping copy`);
                    return;
                }
                
                // Copy presets directory recursively
                function copyDir(src: string, dest: string) {
                    if (!fs.existsSync(dest)) {
                        fs.mkdirSync(dest, { recursive: true });
                    }
                    
                    const items = fs.readdirSync(src);
                    for (const item of items) {
                        const srcPath = path.join(src, item);
                        const destPath = path.join(dest, item);
                        
                        const stat = fs.statSync(srcPath);
                        if (stat.isDirectory()) {
                            copyDir(srcPath, destPath);
                        } else {
                            fs.copyFileSync(srcPath, destPath);
                        }
                    }
                }
                
                copyDir(srcPresetsPath, distPresetsPath);
                console.log(`✅ Successfully copied ${srcDir} to ${distDir}`);
            } catch (error) {
                console.error(`❌ Error copying presets:`, error);
            }
        }
    };
}

/**
 * Creates a tsup plugin to copy presets directory
 * @param options - Plugin options
 * @param options.srcDir - Source directory (default: 'src/presets')
 * @param options.distDir - Destination directory (default: 'dist/presets')
 * @param options.packageRoot - Package root directory (default: process.cwd())
 * @returns tsup plugin function
 */
export function tsupCopyPresetsPlugin(options: {
    srcDir?: string;
    distDir?: string;
    packageRoot?: string;
} = {}) {
    const {
        srcDir = 'src/presets',
        distDir = 'dist/presets',
        packageRoot = process.cwd()
    } = options;

    return () => ({
        name: 'copy-presets',
        closeBundle() {
            const srcPresetsPath = path.join(packageRoot, srcDir);
            const distPresetsPath = path.join(packageRoot, distDir);
            
            try {
                // Check if src/presets exists
                if (!fs.existsSync(srcPresetsPath)) {
                    console.log(`${srcDir} directory does not exist, skipping copy`);
                    return;
                }
                
                // Copy presets directory recursively
                function copyDir(src: string, dest: string) {
                    if (!fs.existsSync(dest)) {
                        fs.mkdirSync(dest, { recursive: true });
                    }
                    
                    const items = fs.readdirSync(src);
                    for (const item of items) {
                        const srcPath = path.join(src, item);
                        const destPath = path.join(dest, item);
                        
                        const stat = fs.statSync(srcPath);
                        if (stat.isDirectory()) {
                            copyDir(srcPath, destPath);
                        } else {
                            fs.copyFileSync(srcPath, destPath);
                        }
                    }
                }
                
                copyDir(srcPresetsPath, distPresetsPath);
                console.log(`✅ Successfully copied ${srcDir} to ${distDir}`);
            } catch (error) {
                console.error(`❌ Error copying presets:`, error);
            }
        }
    });
} 