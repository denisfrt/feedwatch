// server/index.js
import env from './env.js';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import routerDFT from './routes/default.js';
import { getSessionDatabase } from './db/sqlite3-wrapper.js';

const app = express();
app.use(cors({ credentials: true, origin: env.frontend_url }));
//app.use(express.static('../client/dist'));
app.use(express.json());
app.use(session({
    secret: env.secrets.session,
    resave: false,
    saveUninitialized: false,
    store: getSessionDatabase(env.database),
    //    cookie: {
    //        httpOnly: true,        // Prevents XSS access to cookie
    //        secure: false, //env.mode === 'production',
    //        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    //        sameSite: 'lax'
    //    }
}));

app.use('/api', routerDFT);

app.listen(env.port, env.host,
    () => console.info(`Server running on ${env.host}:${env.port}`));
