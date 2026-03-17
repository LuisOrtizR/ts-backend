import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { startScheduler } from './services/scheduler'
import weatherRoutes  from './routes/weather'
import holidaysRoutes from './routes/holidays'
import marketRoutes   from './routes/market'
import chatRoutes     from './routes/chat'

const app  = express()
const PORT = process.env.PORT ?? 3000

// Configurar CORS dinámico para permitir localhost y el dominio de producción
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'https://luis-ortiz-portfolio.vercel.app',
  process.env.FRONTEND_URL 
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    // Normalizar el origen eliminando la barra final si existe
    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    
    if (allowedOrigins.some(allowed => allowed && (allowed === normalizedOrigin || allowed === origin))) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}))

app.use(express.json())

app.use('/api/weather',  weatherRoutes)
app.use('/api/holidays', holidaysRoutes)
app.use('/api/market',   marketRoutes)
app.use('/api/chat',     chatRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

startScheduler()

app.listen(PORT, () => {
  console.log(`✅ Server running → http://localhost:${PORT}`)
})
