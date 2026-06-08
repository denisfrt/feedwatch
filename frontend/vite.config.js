import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: host || false,
        port: 3000,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                //rewrite: (path) => path.replace(/^\/api/, '')
            }
        },
    },
    build: {
        sourcemap: true,
        minify: true
    },
    css: {
        devSourcemap: true
    }
})
