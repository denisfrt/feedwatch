import express from 'express';
import routerYT from './yt.js';
import routerDB from './db.js';

const router = express.Router();

router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

router.use('/yt', routerYT);
router.use('/db', routerDB);

export default router;
