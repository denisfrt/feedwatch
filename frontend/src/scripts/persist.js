import { api } from './api';
import { dbLogger } from './logger';

const common = {
    rawHandle: (handle) => {
        return handle.toLowerCase();
    },
    seenKey: (handle) => {
        return `ytseen-${common.rawHandle(handle)}`;
    },
};

const local = {
    ...common,
    getSeen: (handle) => {
        if (handle) {
            const seenStorageItem = persist.seenKey(handle);
            const saved = localStorage.getItem(seenStorageItem);
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    },
    setSeen: (handle, videos) => {
        if (handle) {
            const seenStorageItem = persist.seenKey(handle);
            localStorage.setItem(seenStorageItem, videos);
        }
    },
    getHandles: () => {
        const saved = localStorage.getItem('ythandles');
        if (saved !== null) {
            const jsonValue = JSON.parse(saved);
            if (Array.isArray(jsonValue)) {
                return jsonValue;
            }
        }
        return [];
    },
    setHandleOrder: async function (handles) {
        if (handles && Array.isArray(handles)) {
            localStorage.setItem('ythandles', JSON.stringify(handles));
        }
    },
    setHandle: (handle, videos) => {
        dbLogger.debug('local.setHandle: ' + handle + ' v=' + videos);
        if (handle) {
            persist.setSeen(handle, videos || []);
            const rawHandle = persist.rawHandle(handle);
            let handles = persist.getHandles();
            if (!handles.find((h) => persist.rawHandle(h) === rawHandle)) {
                handles.push(handle);
                localStorage.setItem('ythandles', JSON.stringify(handles));
            }
        }
    },
    delHandle: (handle) => {
        dbLogger.debug('local.delHandle: ' + handle);
        if (handle) {
            // remove seen videos for handle
            localStorage.removeItem(persist.seenKey(handle));
            // remove handle from ythandles
            const rawHandle = persist.rawHandle(handle);
            let handles = persist.getHandles();
            handles = handles.filter((h) => persist.rawHandle(h) !== rawHandle);
            localStorage.setItem('ythandles', JSON.stringify(handles));
        }
    }
}

const db = {
    ...common,
    getSeen: async function (handle) {
        dbLogger.debug('db.getSeen:' + handle);
        if (handle) {
            const saved = await api.get(`/api/db/seen?type=yt&handle=${handle}`);
            return Array.isArray(saved) ? saved : [];
        }
        return [];
    },
    setSeen: async function (handle, video_ids) {
        persist.setHandle(handle, video_ids);
    },
    getHandles: async function () {
        const saved = await api.get('/api/db/handle?type=yt');
        return Array.isArray(saved) ? saved : [];
    },
    setHandleOrder: async function (handles) {
        dbLogger.debug('db.setHandleOrder: handles=' + handles);
        if (handles) {
            await api.post('api/db/handle/order', { type: 'yt', order: handles });
        }
    },
    setHandle: async function (handle, video_ids) {
        dbLogger.debug('db.setHandle: ' + handle + ' v=' + video_ids);
        if (handle) {
            await api.post('/api/db/handle', { type: 'yt', handle, video_ids })
        }
    },
    delHandle: async function (handle) {
        dbLogger.debug('db.delHandle: ' + handle);
        if (handle) {
            await api.del(`/api/db/handle?type=yt&handle=${handle}`)
        }
    }
}

const PERSIST_MODE = import.meta.env.VITE_PERSIST_MODE || 'local';
dbLogger.info('persist mode: ' + PERSIST_MODE);
export const persist = (PERSIST_MODE === 'db' ? db : local);