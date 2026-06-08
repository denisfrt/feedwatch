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
if (env.mode !== 'production') {
    app.use(session({
        secret: env.secrets.session,
        resave: false,
        saveUninitialized: false
    }));
}
app.use('/api', routerDFT);

app.listen(env.port, () => console.info(`Server running on ${env.port}`));
