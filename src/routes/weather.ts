import { Router, Request, Response } from 'express'
import cache from '../services/cache'
import { fetchWeatherAll, CITIES } from '../services/weatherService'
import { CityWeather, ApiResponse } from '../types'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const cached = cache.get<CityWeather[]>('weather:all')
    if (cached) {
      return res.json({ source: 'cache', data: cached } as ApiResponse<CityWeather[]>)
    }

    const data = await fetchWeatherAll()

    if (data.length === CITIES.length) {
      cache.set('weather:all', data)
    }

    res.json({ source: 'live', data } as ApiResponse<CityWeather[]>)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

router.get('/alerts', async (_req: Request, res: Response) => {
  try {
    let data = cache.get<CityWeather[]>('weather:all')
    if (!data) {
      data = await fetchWeatherAll()
      if (data.length === CITIES.length) {
        cache.set('weather:all', data)
      }
    }

    const alerts = data.filter((city) => city.alert !== null)
    res.json({ total: alerts.length, alerts })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

router.get('/debug', async (_req: Request, res: Response) => {
  cache.del('weather:all')
  const data = await fetchWeatherAll()
  res.json({ total: data.length, expected: CITIES.length, cities: data.map((c) => c.city) })
})

export default router