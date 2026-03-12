import cron from 'node-cron'
import cache from './cache'
import { fetchWeatherAll, CITIES } from './weatherService'
import { fetchTodayHolidays } from './holidaysService'
import { fetchMarketData } from './marketService'

async function refreshWeather(): Promise<void> {
  const data = await fetchWeatherAll()
  if (data.length === CITIES.length) {
    cache.set('weather:all', data)
  }
}

async function refreshHolidays(): Promise<void> {
  const data = await fetchTodayHolidays()
  cache.set('holidays:today', data, 3600)
}

async function refreshMarket(): Promise<void> {
  const data = await fetchMarketData()
  cache.set('market:all', data, 1800)
}

function schedule(expression: string, label: string, task: () => Promise<void>): void {
  cron.schedule(expression, async () => {
    try {
      await task()
      console.log(`[cron] ${label} refreshed`)
    } catch (err) {
      console.error(`[cron] ${label} failed:`, err)
    }
  })
}

export function startScheduler(): void {
  schedule('*/30 * * * *',   'weather',  refreshWeather)
  schedule('0 0 * * *',      'holidays', refreshHolidays)
  schedule('0 9-18 * * 1-5', 'market',   refreshMarket)

  console.log('[cron] Scheduler started')
}