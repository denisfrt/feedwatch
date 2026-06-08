// make sure .env.production exists
import fs from 'node:fs';
import path from 'node:path';

const example = path.resolve('.env.example');
const target = path.resolve('.env.production');

if (!fs.existsSync(target) && fs.existsSync(example)) {
    fs.copyFileSync(example, target);
    console.log('Created .env.production from .env.example');
}