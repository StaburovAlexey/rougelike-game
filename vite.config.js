import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/rougelike-game/' : '/',
  server: {
    // host: '127.0.0.1',
    port: 4173,
  },
}))
