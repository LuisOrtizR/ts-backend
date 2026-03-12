// ─── Weather ──────────────────────────────────────────────
export interface WeatherAlert {
  type: 'temperature' | 'wind' | 'storm' | 'snow'
  msg: string
}

export interface CityWeather {
  city: string
  country: string
  temp: number
  feels_like: number
  humidity: number
  description: string
  icon: string
  wind_speed: number
  alert: WeatherAlert | null
  timestamp: string
}

export interface City {
  name: string
  country: string
  lat: number
  lon: number
}

// ─── Holidays ─────────────────────────────────────────────
export interface Holiday {
  date: string
  localName: string
  name: string
  countryCode: string
  fixed: boolean
  global: boolean
  types: string[]
  source?: 'library' | 'api' | 'url'
}

export interface HolidaysResponse {
  today: Holiday[]
  upcoming: Holiday[]
  non_operational_today: string[]
  summary: {
    total_today: number
    countries_affected: number
  }
  fetched_at: string
}

// ─── Market ───────────────────────────────────────────────
export interface StockQuote {
  symbol: string
  name: string
  sector: string
  price: string
  change: string
  change_percent: string
  volume: string
  previous_close: string
  trend: 'up' | 'down'
  timestamp: string
}

export interface MarketStatus {
  open: boolean
  label: string
  utc_hour?: number
  next_open?: string
}

export interface MarketData {
  stocks: StockQuote[]
  market_status: MarketStatus
  summary: {
    gainers: number
    losers: number
  }
  fetched_at: string
}

// ─── API Responses ────────────────────────────────────────
export interface ApiResponse<T> {
  source: 'cache' | 'live'
  data: T
}
