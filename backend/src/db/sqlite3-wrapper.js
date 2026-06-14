import fs from 'node:fs';
import { isSea } from 'node:sea';
import { createRequire } from "module";
import { createDir, normalizeWindowsPath } from '../env.js';
import log from '../logger.js';

export function openSqlite3Database(dbOptions) {
    let db = null;
    if (!isSea()) {
        const nodeRequire = createRequire(import.meta.url);
        const Database = nodeRequire('better-sqlite3');
        db = new Database(dbOptions.filename);
    } else {
        // get bindings from assets
        try {
            const bindingPath = normalizeWindowsPath(dbOptions.bindings);
            // load module & open database
            const { createRequire } = require('node:module');
            const nodeRequire = createRequire(bindingPath);
            const Database = nodeRequire('better-sqlite3');
            createDir(dbOptions.filename);
            db = new Database(dbOptions.filename, { nativeBinding: bindingPath });
            db.pragma('journal_mode = WAL');
        } catch (err) {
            log.error(err);
        }
    }
    // init database
    if (db) {
        const schema = fs.readFileSync(dbOptions.schema, 'utf8');
        db.exec(schema, (err) => {
            if (err) {
                log.error('Failed to initialize DB:', err);
            } else {
                log.info('Database initialized');
            }
        });
    }
    return db;
}

/*
    // write bindings from assets
    const moduleName = 'better_sqlite3.node';
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sql3-'));
    try {
        let bindingPath = path.join(tmpDir, moduleName);
        fs.writeFileSync(bindingPath, Buffer.from(getRawAsset(moduleName)));

        log.info(bindingPath)
        // load module & open database
        const { createRequire } = require('node:module');
        const nodeRequire = createRequire(bindingPath);
        const Database = nodeRequire('better-sqlite3');
        db = new Database(dbFilename, { nativeBinding: bindingPath });
        db.pragma('journal_mode = WAL');
    } catch (err) {
        console.error(err);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
*/