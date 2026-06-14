// server/index.js
import env from './env.js';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import routerDFT from './routes/default.js';

const app = express();
app.use(cors());
//app.use(express.static('../client/dist'));
app.use(express.json());
app.use(session({
    secret: env.secrets.session,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,        // Prevents XSS access to cookie
        secure: env.mode === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

app.use('/api', routerDFT);

app.listen(env.port, () => console.info(`Server running on ${env.port}`));
