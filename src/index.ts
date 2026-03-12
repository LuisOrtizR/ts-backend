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

app.use(cors())
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
