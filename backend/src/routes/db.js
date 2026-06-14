import express from 'express';
import database from '../db/database.js';
import log from '../logger.js';

const router = express.Router();

router.get('/handle', async (req, res) => {
    log.debug(`GET /db/handle?type=${req.query.type}`);
    try {
        if (!req.query?.type) {
            throw { status: 403, message: 'missing type param' };
        }
        const data = await database.getHandles(req.query.type);
        res.json(data);
    } catch (err) {
        res.status(err.status || 500).json({
            error: "Handle fetch failed.",
            details: err.message
        });
    }
});

router.post('/handle/order', async (req, res) => {
    log.debug(`POST /db/handle/order body=${JSON.stringify(req.body)}`);
    try {
        if (!req.body?.type) {
            throw { status: 403, message: 'missing type param' };
        }
        if (!req.body?.order || !Array.isArray(req.body?.order)) {
            throw { status: 403, message: 'missing order param' };
        }
        await database.setHandleOrder(req.body.type,
            req.body.order,
        );
        res.json('{ status: "OK" }');
    } catch (err) {
        res.status(err.status || 500).json({
            error: "Handle update failed.",
            details: err.message
        });
    }
});

router.get('/seen', async (req, res) => {
    log.debug(`GET /db/seen?type=${req.query?.type}&handle=${req.query?.handle}`);
    try {
        if (!req.query?.type) {
            throw { status: 403, message: 'missing type param' };
        }
        if (!req.query?.handle) {
            throw { status: 403, message: 'missing handle param' };
        }
        const data = await database.getSeen(req.query.type, req.query.handle);
        res.json(data);
    } catch (err) {
        res.status(err.status || 500).json({
            error: "Seen fetch failed.",
            details: err.message
        });
    }
});

router.post('/handle', async (req, res) => {
    log.debug(`POST /db/handle body=${JSON.stringify(req.body)}`);
    try {
        if (!req.body?.type) {
            throw { status: 403, message: 'missing type param' };
        }
        if (!req.body?.handle) {
            throw { status: 403, message: 'missing handle param' };
        }
        await database.setHandle(req.body.type,
            req.body.handle,
            req.body.video_ids
        );
        res.json('{ status: "OK" }');
    } catch (err) {
        res.status(err.status || 500).json({
            error: "Handle update failed.",
            details: err.message
        });
    }
});

router.delete('/handle', async (req, res) => {
    log.debug(`DEL /db/handle?type=${req.query?.type}&handle=${req.query?.handle}`);
    try {
        if (!req.query?.type) {
            throw { status: 403, message: 'missing type param' };
        }
        if (!req.query?.handle) {
            throw { status: 403, message: 'missing handle param' };
        }
        await database.delHandle(req.query.type, req.query.handle);
        res.json('{ status: "OK" }');
    } catch (err) {
        res.status(err.status || 500).json({
            error: "Handle delete failed.",
            details: err.message
        });
    }
});

router.get('/session', async (req, res) => {
    const json = await database.getSession('yt', -1);
    res.json(json);
});

export default router;
