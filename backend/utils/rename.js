import { execSync } from 'child_process';
import fs from 'fs';

const exename = "dist/express-backend";
const ext = process.platform === 'win32' ? '.exe' : '';

const targetTriple = execSync('rustc --print host-tuple').toString().trim();
if (!targetTriple) {
    console.error('Failed to determine platform target triple');
}

fs.renameSync(
    `${exename}`,
    `${exename}-${targetTriple}${ext}`
);
