import { OAuth2Client } from "google-auth-library";
import express from 'express';
import axios from 'axios';
import crypto from "crypto";
import log from '../logger.js';
import env from '../env.js';
import database from '../db/database.js';

const router = express.Router();

const REDIRECT_URI = 'http://localhost:5000/api/auth/google/callback';
const SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';

function base64url(input) {
    return Buffer.from(input)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

export async function getCredentials(_req, _res) {
    let r = { key: null, oauth: null, token: null };
    if (env.secrets.yt_apikey) {
        r.key = env.secrets.yt_apikey;
    } else {
        const { token, refresh } = await database.getSession('yt', -1);
        if (!token) {
            if (refresh) {
                log.info('Refreshing token...');
            }
        }
        if (token) {
            r.token = `Bearer ${token}`;
            r.auth = new OAuth2Client(
                env.secrets.yt_clientid,
                env.secrets.yt_clientsecret,
                REDIRECT_URI
            );
            r.auth.setCredentials({
                access_token: token,
                refresh_token: refresh
            });
        }
    }
    return r;
}

router.get("/google", async (req, res) => {
    log.debug('GET /auth/google');
    const codeVerifier = base64url(crypto.randomBytes(32));
    const codeChallenge = base64url(crypto.createHash("sha256").update(codeVerifier).digest());

    // Store state in server session
    req.session.oauthState = crypto.randomBytes(16).toString("hex");
    req.session.codeVerifier = codeVerifier;

    const params = new URLSearchParams({
        client_id: env.secrets.yt_clientid,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: SCOPE,
        access_type: 'offline',
        prompt: "consent",
        state: req.session.oauthState,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
    });

    const authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.redirect(authorizeUrl);
});

async function fetchTokens(code, code_verifier) {
    const params = new URLSearchParams({
        client_id: env.secrets.yt_clientid,
        client_secret: env.secrets.yt_clientsecret,
        redirect_uri: REDIRECT_URI,
        code,
        code_verifier: code_verifier,
        grant_type: "authorization_code",
    });

    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token', params, { headers }
    );
    const tokens = tokenResponse.data;
    if (tokens.scope != SCOPE) {
        throw { status: 400, message: 'scope not granted' };
    } else if (!tokens.access_token) {
        throw { status: 400, message: 'missing access token' };
    } else if (!tokens.refresh_token) {
        throw { status: 400, message: 'missing refresh token' };
    }
    const nowDateS = Math.floor(new Date() / 1000);
    return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: nowDateS + tokens.expires_in,
        refresh_expiry: nowDateS + tokens.refresh_token_expires_in
    };
}

router.get("/google/callback", async (req, res) => {
    log.debug('GET /auth/google/callback');
    try {
        const { code, state, error } = req.query;

        if (error) {
            throw { status: 400, message: `Google error: ${error}` };
        } else if (!code) {
            throw { status: 400, message: 'Missing authorization code' };
        } else if (!state || state !== req.session.oauthState) {
            throw { status: 400, message: 'Invalid state' };
        }

        const tokensInfo = await fetchTokens(code, req.session.codeVerifier);
        // store token in session
        await database.addSession('yt',
            tokensInfo.access_token, tokensInfo.refresh_token,
            tokensInfo.token_expiry, tokensInfo.refresh_expiry);
    } catch (err) {
        res.status(err.status || 500).json({
            error: "PKCE callback failed",
            details: err.response?.data || err.message,
        });
    } finally {
        // clear session
        delete req.session.oauthState;
        delete req.session.codeVerifier;
    }
    // Redirect to frontend
    res.redirect("/");
});

export default router;