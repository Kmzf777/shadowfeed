
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '../src/components/renderer');

function walk(dir, callback) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
            walk(filepath, callback);
        } else if (stats.isFile() && /\.(tsx?|ts)$/.test(file)) {
            callback(filepath);
        }
    });
}

walk(DIR, (filepath) => {
    let content = fs.readFileSync(filepath, 'utf-8');
    let original = content;

    // Replace types import
    // patterns: header import type { ... } from '../../types/slide.types';
    // or simple import ... from '../../types...'
    content = content.replace(/from\s+['"](\.\.\/)*types\/slide\.types['"]/g, "from '@/types/renderer/slide.types'");

    // Replace utils import
    // pattern: ../../utils/colors
    content = content.replace(/from\s+['"](\.\.\/)*utils\/(.*?)['"]/g, "from '@/lib/renderer/$2'");

    // Replace components import if any went too far back?
    // Usually components refer to each other relatively, so likely fine.

    if (content !== original) {
        console.log(`Updating ${filepath}`);
        fs.writeFileSync(filepath, content);
    }
});
