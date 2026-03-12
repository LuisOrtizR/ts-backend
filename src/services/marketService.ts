import axios from 'axios'
import { MarketData, MarketStatus, StockQuote } from '../types'

const BASE_URL = 'https://www.alphavantage.co/query'

interface StockMeta {
  symbol: string
  name:   string
  sector: string
}

const STOCKS: StockMeta[] = [
  { symbol: 'SLB', name: 'SLB (Schlumberger)', sector: 'Oil Services' },
  { symbol: 'HAL', name: 'Halliburton',         sector: 'Oil Services' },
  { symbol: 'XOM', name: 'ExxonMobil',          sector: 'Oil & Gas'    },
  { symbol: 'CVX', name: 'Chevron',             sector: 'Oil & Gas'    },
]

function parseQuote(meta: StockMeta, q: any): StockQuote | null {
  if (!q || !q['05. price']) return null

  const change = parseFloat(q['09. change'])

  return {
    symbol:         meta.symbol,
    name:           meta.name,
    sector:         meta.sector,
    price:          parseFloat(q['05. price']).toFixed(2),
    change:         change.toFixed(2),
    change_percent: q['10. change percent']?.replace('%', '').trim() ?? '0',
    volume:         q['06. volume'],
    previous_close: parseFloat(q['08. previous close']).toFixed(2),
    trend:          change >= 0 ? 'up' : 'down',
    timestamp:      new Date().toISOString(),
  }
}

export async function fetchMarketData(): Promise<MarketData> {
  const API_KEY = process.env.ALPHAVANTAGE_API_KEY

  const results = await Promise.allSettled(
    STOCKS.map((meta) =>
      axios
        .get(BASE_URL, { params: { function: 'GLOBAL_QUOTE', symbol: meta.symbol, apikey: API_KEY } })
        .then((res) => parseQuote(meta, res.data['Global Quote']))
    )
  )

  const failed = results
    .map((r, i) => (r.status === 'rejected' ? STOCKS[i].symbol : null))
    .filter(Boolean)

  if (failed.length > 0) {
    console.warn(`[market] Failed symbols: ${failed.join(', ')}`)
  }

  const stocks: StockQuote[] = results
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value)

  return {
    stocks,
    market_status: getMarketStatus(),
    summary: {
      gainers: stocks.filter((s) => s.trend === 'up').length,
      losers:  stocks.filter((s) => s.trend === 'down').length,
    },
    fetched_at: new Date().toISOString(),
  }
}

export function getMarketStatus(): MarketStatus {
  const now  = new Date()
  const hour = now.getUTCHours()
  const day  = now.getUTCDay()

  if (day === 0 || day === 6)      return { open: false, label: 'Cerrado (fin de semana)' }
  if (hour >= 13 && hour < 20)     return { open: true,  label: 'Mercado abierto (NYSE)'  }
  return { open: false, label: 'Mercado cerrado' }
}

export function getNextOpen(now: Date): string {
  const d = new Date(now)
  d.setUTCHours(13, 30, 0, 0)
  if (d <= now) d.setUTCDate(d.getUTCDate() + 1)
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return d.toISOString()
}