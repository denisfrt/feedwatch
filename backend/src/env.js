import dotenv from 'dotenv';

function abort(msg) {
    console.error(msg);
    throw Error(msg);
}

function getRes(dir) {
    const cwd = process.env.NODE_RESDIR || '.'
    return dir ? `${cwd}/${dir}` : undefined;
}

function getData(dir) {
    const cwd = process.env.NODE_APPDATADIR || '.'
    return dir ? `${cwd}/${dir}` : undefined;
}

if (process.env.NODE_ENVFILE) {
    const envFile = getRes(process.env.NODE_ENVFILE);
    console.info('loading env: ' + envFile);
    dotenv.config({ path: [envFile], quiet: true });
}

const env = {
    mode: process.env.NODE_ENV || abort('missing env mode'),
    port: process.env.PORT || 5000,
    log_level: process.env.LOG_LEVEL || 'error',
    database: {
        bindings: getRes('node_modules/better-sqlite3/build/Release/better_sqlite3.node'),
        filename: getData(process.env.DB_FILENAME) || abort('missing env/db filename'),
        schema: getRes(process.env.DB_SCHEMA_FILENAME) || abort('missing env/db schema'),
    },
    secrets: {
        session: process.env.SESSION_SECRET || abort('missing env/session key'),
        yt_key: process.env.YOUTUBE_API_KEY || abort('missing env/yt key')
    },
};

const { secrets, ...debugEnv } = env;
console.info('env: ' + JSON.stringify(debugEnv, null, 2));
export default env;