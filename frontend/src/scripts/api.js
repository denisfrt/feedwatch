// src/scripts/api.js
import { apiLogger } from './logger';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const config = {
        ...options,
        headers,
        credentials: 'include' // send cookies for session*/
    };

    apiLogger.debug('fetch: ' + url);
    const res = await fetch(url, config);

    if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Request failed: ${res.status} ${res.statusText}${errorText ? ' - ' + errorText : ''}`);
    }

    // Handle empty responses
    const text = await res.text();
    if (!text) return null;

    const json = JSON.parse(text);
    apiLogger.debug('fetch ' + url + ' response: ' + JSON.stringify(json));
    return json;
}

export function getAuthUrl(isLogin) {
    const suffix = isLogin ? 'login' : 'logout';
    return `${BASE_URL}/api/auth/google/${suffix}`;
}

export async function isAlive(maxAttempts = 15, delayMs = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const res = await request('/api/health', { method: 'GET' });;
            if (res.status === 'ok') {
                return {
                    alive: true,
                    configured: res.configured,
                    connectable: res.connectable,
                    connected: res.connected
                };
            }
        } catch {
            // ignore
        }
        await new Promise(r => setTimeout(r, delayMs));
    }
    throw new Error('backend was not alive');
}

// Convenience methods
export const api = {
    get: (endpoint, options = {}) =>
        request(endpoint, { ...options, method: 'GET' }),

    post: (endpoint, body, options = {}) =>
        request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),

    put: (endpoint, body, options = {}) =>
        request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),

    patch: (endpoint, body, options = {}) =>
        request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

    del: (endpoint, options = {}) =>
        request(endpoint, { ...options, method: 'DELETE' })
};