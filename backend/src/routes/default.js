import express from 'express';
import routerYT from './yt.js';
import routerDB from './db.js';
import routerAUTH from './auth.js';
import env from '../env.js';
import database from '../db/database.js';

const router = express.Router();

router.get('/health', async (req, res) => {
    const { token, refresh } = await database.getSession('yt', -1);
    res.json({
        status: 'ok',
        connectable: Boolean(env.secrets.yt_clientid && env.secrets.yt_clientsecret && !env.secrets.yt_apikey),
        connected: Boolean(token || refresh || env.secrets.yt_apikey)
    });
});

router.use('/yt', routerYT);
router.use('/db', routerDB);
router.use('/auth', routerAUTH)

export default router;
