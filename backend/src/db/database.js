import env from '../env.js';
import { openSqlite3Database } from './sqlite3-wrapper.js';

//import Database from 'better-sqlite3';
//const db = new Database(':memory:'); // In-memory DB
//const db = new Database(env.database.filename);
const db = openSqlite3Database(env.database, env.database);

async function getHandles(type) {
    const query = db.prepare(`SELECT f_name
                              FROM t_feeds
                              WHERE f_type = ?
                              ORDER BY f_order, f_name`).pluck();
    const json = query.all(type) || '[]';
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

async function addSession(type, token, refresh, t_expiry, r_expiry) {
    // maintain only one session for now
    await clearSession(type, true);
    // insert session info
    const insert = db.prepare(`INSERT OR IGNORE
                               INTO t_sessions(f_type, f_token, f_refresh, f_token_expiry, f_refresh_expiry)
                               VALUES(?, ?, ?, ?, ?)`);
    const r = insert.run(type, token, refresh, t_expiry, r_expiry);
    return r.lastInsertRowid;
}

async function getSession(type, id) {
    let json;
    if (id === -1) {
        const query = db.prepare(`SELECT f_token, f_refresh, f_token_expiry, f_refresh_expiry
                                  FROM t_sessions
                                  WHERE f_type = ?`);
        json = query.get(type);
    } else {
        const query = db.prepare(`SELECT f_token, f_refresh, f_token_expiry, f_refresh_expiry
                              FROM t_sessions
                              WHERE f_type = ? AND k_id = ?`);
        json = query.get(type, id);
    }
    const nowDate = new Date();
    let r = { token: null, refresh: null };
    if (json?.f_token_expiry) {
        const tokenExpiryDate = new Date(json.f_token_expiry * 1000 - 30000);
        if (nowDate < tokenExpiryDate) {
            r.token = json.f_token;
        }
    }
    if (json?.f_refresh_expiry) {
        const refreshExpiryDate = new Date(json.f_refresh_expiry * 1000);
        if (nowDate < refreshExpiryDate) {
            r.refresh = json.f_refresh;
        }
    }
    return r;
}

async function clearSession(type, all) {
    if (all) {
        const remove = db.prepare(`DELETE
                                   FROM t_sessions
                                   WHERE f_type = ?`);
        remove.run(type);
    } else {
        const remove = db.prepare(`DELETE
                                   FROM t_sessions
                                   WHERE f_type = ?
                                     AND f_token_expiry <= CURRENT_TIMESTAMP
                                     AND f_refresh_expiry <= CURRENT_TIMESTAMP`);
        remove.run(type);
    }
}

const api = {
    getHandles: (type) => getHandles(type),
    setHandleOrder: (type, handles) => setHandleOrder(type, handles),
    getSeen: (type, handle) => getSeen(type, handle),
    setHandle: (type, handle, seen) => setHandle(type, handle, seen),
    delHandle: (type, handle) => delHandle(type, handle),
    addSession: (type, token, refresh, t_expiry, r_expiry) => addSession(type, token, refresh, t_expiry, r_expiry),
    getSession: (type, id) => getSession(type, id),
    clearSession: (type, all) => clearSession(type, all)
};

export default api;
