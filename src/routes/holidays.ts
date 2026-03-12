import { Router, Request, Response } from 'express'
import cache from '../services/cache'
import { fetchTodayHolidays, fetchHolidaysByMonth } from '../services/holidaysService'
import { Holiday, HolidaysResponse, ApiResponse } from '../types'

const router = Router()

router.get('/today', async (_req: Request, res: Response) => {
  try {
    const cached = cache.get<HolidaysResponse>('holidays:today')
    if (cached) {
      return res.json({ source: 'cache', data: cached } as ApiResponse<HolidaysResponse>)
    }

    const data = await fetchTodayHolidays()
    
    // Validamos que tengamos datos antes de cachear
    if (data.upcoming.length > 0 || data.today.length > 0) {
      cache.set('holidays:today', data, 3600)
    }

    res.json({ source: 'live', data } as ApiResponse<HolidaysResponse>)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

router.get('/month', async (req: Request, res: Response) => {
  try {
    const year  = parseInt(req.query.year  as string) || new Date().getFullYear()
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1

    if (month < 1 || month > 12) {
      return res.status(400).json({ error: 'month must be between 1 and 12' })
    }

    const cacheKey = `holidays:${year}-${month}`

    const cached = cache.get<Holiday[]>(cacheKey)
    if (cached) {
      return res.json({ source: 'cache', data: cached } as ApiResponse<Holiday[]>)
    }

    const data = await fetchHolidaysByMonth(year, month)
    cache.set(cacheKey, data, 86400)

    res.json({ source: 'live', data } as ApiResponse<Holiday[]>)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

export default router