import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handlePublicRead } from './src/lib/public-api.js'

// Serves /api/* in `npm run dev` with the same handler as the Cloudflare Pages Function.
const publicApi = mode => ({
  name: 'public-api',
  configureServer(server) {
    const env = loadEnv(mode, process.cwd(), '')
    server.middlewares.use('/api', async (req, res) => {
      try {
        const response = await handlePublicRead(req.url.slice(1).split('?')[0], env)
        const body = await response.text()
        res.statusCode = response.status
        response.headers.forEach((value, name) => res.setHeader(name, value))
        res.end(body)
      } catch {
        res.statusCode = 502
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'The catalog could not be loaded.' }))
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), publicApi(mode)],
}))
