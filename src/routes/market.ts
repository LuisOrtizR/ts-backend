import { Router, Request, Response } from 'express'
import cache from '../services/cache'
import { fetchMarketData, getMarketStatus, getNextOpen } from '../services/marketService'
import { MarketData, ApiResponse } from '../types'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const cached = cache.get<MarketData>('market:all')
    if (cached) {
      return res.json({ source: 'cache', data: cached } as ApiResponse<MarketData>)
    }

    const data = await fetchMarketData()
    cache.set('market:all', data, 1800)

    res.json({ source: 'live', data } as ApiResponse<MarketData>)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

router.get('/status', (_req: Request, res: Response) => {
  const now    = new Date()
  const status = getMarketStatus()
  res.json({ ...status, utc_hour: now.getUTCHours(), next_open: getNextOpen(now) })
})

export default router