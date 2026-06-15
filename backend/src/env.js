import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

function abort(msg) {
    console.error(msg);
    throw Error(msg);
}

export function createDir(filePath) {
    const dir = path.dirname(filePath);
    fs.mkdir(dir, { recursive: true }, (err) => {
        if (err) {
            console.error('Error creating directory:', err);
        }
    });
}

export function copyFile(fromFilename, toFilename) {
    createDir(toFilename);
    fs.copyFileSync(fromFilename, toFilename);
}

export function normalizeWindowsPath(pathStr) {
    // Only apply on Windows
    if (process.platform !== 'win32') {
        return pathStr;
    }
    // \\?\UNC\host\share\path -> \\host\share\path
    if (pathStr.startsWith('\\\\?\\UNC\\')) {
        return pathStr.slice(8).replace(/^\\/, '');
    }
    // \\?\C:\path -> C:\path
    if (pathStr.startsWith('\\\\?\\')) {
        return pathStr.slice(4);
    }
    return pathStr;
}

function getRes(dir, useDefault = true) {
    const cwd = process.env.NODE_RESDIR || (useDefault ? '.' : undefined);
    return dir ? `${cwd}/${dir}` : undefined;
}

function getData(dir, useDefault = true) {
    const cwd = process.env.NODE_APPDATADIR || (useDefault ? '.' : undefined);
    return dir ? `${cwd}/${dir}` : undefined;
}

function getConfig(dir, useDefault = true) {
    const cwd = process.env.NODE_APPCONFIGDIR || (useDefault ? '.' : undefined);
    return cwd && dir ? `${cwd}/${dir}` : undefined;
}

const srcExampleFile = getRes('.env.example');
const dstExampleFile = getConfig('.env.example');
copyFile(srcExampleFile, dstExampleFile);

if (process.env.NODE_ENVFILE) {
    let envFile = getRes(process.env.NODE_ENVFILE);
    if (fs.existsSync(envFile)) {
        console.info('loading env: ' + envFile);
        dotenv.config({ path: [envFile], quiet: true });
    } else {
        envFile = getConfig(process.env.NODE_ENVFILE);
        if (fs.existsSync(envFile)) {
            console.info('loading env: ' + envFile);
            dotenv.config({ path: [envFile], quiet: true });
        } else {
            const err = `missing ${process.env.NODE_ENVFILE}, ` +
                `make sure to create it in ${process.env.NODE_APPCONFIGDIR} ` +
                `(example in ${dstExampleFile})`;
            abort(err);
        }
    }
}

const env = {
    mode: process.env.NODE_ENV || abort('missing env mode'),
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    frontend_url: process.env.FRONTEND_URL || abort('missing env frontend_url'),
    log_level: process.env.LOG_LEVEL || 'error',
    database: {
        bindings: getRes('node_modules/better-sqlite3/build/Release/better_sqlite3.node'),
        filename: getData(process.env.DB_FILENAME) || abort('missing env/db filename'),
        schema: getRes(process.env.DB_SCHEMA_FILENAME) || abort('missing env/db schema'),
    },
    secrets: {
        session: process.env.SESSION_SECRET || abort('missing env/session key'),
        yt_apikey: process.env.YOUTUBE_API_KEY,
        yt_clientid: process.env.YOUTUBE_CLIENT_ID,
        yt_clientsecret: process.env.YOUTUBE_CLIENT_SECRET,
    },
};

if (!env.secrets.yt_apikey) {
    if (!env.secrets.yt_clientid || !env.secrets.yt_clientsecret) {
        abort('missing youtube credentials');
    }
}

const debugEnv = { ...env };
delete debugEnv.secrets;
console.info('env: ' + JSON.stringify(debugEnv, null, 2));
export default env;