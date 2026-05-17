/* global __dirname, process */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vite.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    optimizeDeps: {
        include: ['react-force-graph-2d', 'd3-force'],
    },
    server: {
        port: 1420,
        strictPort: true,
        // Prevent Vite from opening a browser window - Tauri manages the webview
        open: false,
    },
    build: {
        // Tauri uses Chromium on macOS/Linux, Safari on iOS
        target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari15',
        minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
        sourcemap: !!process.env.TAURI_ENV_DEBUG,
        outDir: 'dist',
    },
    clearScreen: false,
});
