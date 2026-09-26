import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
import type { UserConfig } from 'vite';
import { webSocketServer } from './src/lib/server/wsDevServer.js';

const config: UserConfig = {
  plugins: [sveltekit(), webSocketServer],
  resolve: {
    alias: {
      $components: path.resolve('src/components'),
      $static: path.resolve('static'),
      $assets: path.resolve('src/assets'),
      '$lib/server': path.resolve('src/lib/server')
    },
    preserveSymlinks: true
  },
  server: {
    fs: { allow: ['..'] },
    allowedHosts: ['.loca.lt', '.ngrok-free.app'],
    hmr: false, // Wyłączamy "odświeżanie na żywo" - to ono powoduje błędy 502
    watch: {
      usePolling: true // Zmusza serwer do stabilniejszego sprawdzania plików
    }
  }
};

export default config;