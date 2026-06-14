import express from 'express';
import routerYT from './yt.js';
import routerDB from './db.js';
import routerAUTH from './auth.js';

const router = express.Router();

router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

router.use('/yt', routerYT);
router.use('/db', routerDB);
router.use('/auth', routerAUTH)

export default router;
