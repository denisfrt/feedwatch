import env from '../env.js';
import { openSqlite3Database } from './sqlite3-wrapper.js';

//import Database from 'better-sqlite3';
//const db = new Database(':memory:'); // In-memory DB
//const db = new Database(env.database.filename);
const db = openSqlite3Database(env.database, env.database);

async function getHandles(type) {
    const query = db.prepare(`SELECT f_name
                              FROM t_feeds
                              ORDER BY f_order, f_name`).pluck();
    const json = query.all() || '[]';
    return json;
}

async function setHandleOrder(type, handles) {
    const update = db.prepare(`UPDATE t_feeds
                               SET f_order = ?
                               WHERE f_type = ? AND f_name = ?`);
    const updateAll = db.transaction((type, handles) => {
        let order = 1;
        for (const handle of handles) {
            update.run(order, type, handle);
            order += 1;
        }
    });
    updateAll(type, handles)
}

async function getSeen(type, handle) {
    const query = db.prepare(`SELECT f_video_ids
                              FROM t_feeds
                              WHERE f_type = ? AND f_name = ?`).pluck();
    const json = JSON.parse(query.get(type, handle) || '[]');
    return json;
}

async function setHandle(type, handle, seen) {
    const insert = db.prepare(`INSERT OR IGNORE
                               INTO t_feeds(f_type, f_name)
                               VALUES(?, ?)`);
    const update = db.prepare(`UPDATE t_feeds
                               SET f_video_ids = ?
                               WHERE f_type = ? AND f_name = ?`);
    const trx = db.transaction((type, handle, seen) => {
        insert.run(type, handle);
        if (seen) {
            update.run(seen, type, handle);
        }
    });
    trx(type, handle, seen);
}

async function delHandle(type, handle) {
    const remove = db.prepare(`DELETE
                               FROM t_feeds
                               WHERE f_type = ? AND f_name = ?`);
    remove.run(type, handle);
}

const api = {
    getHandles: (type) => getHandles(type),
    setHandleOrder: (type, handles) => setHandleOrder(type, handles),
    getSeen: (type, handle) => getSeen(type, handle),
    setHandle: (type, handle, seen) => setHandle(type, handle, seen),
    delHandle: (type, handle) => delHandle(type, handle)
};

export default api;
