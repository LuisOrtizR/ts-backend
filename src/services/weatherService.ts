import axios from 'axios'
import { City, CityWeather, WeatherAlert } from '../types'

export const CITIES: City[] = [
  { name: 'Houston',   country: 'US', lat: 29.7604,  lon: -95.3698 },
  { name: 'Bogotá',    country: 'CO', lat: 4.7110,   lon: -74.0721 },
  { name: 'London',    country: 'GB', lat: 51.5074,  lon: -0.1278  },
  { name: 'Dubai',     country: 'AE', lat: 25.2048,  lon: 55.2708  },
  { name: 'Singapore', country: 'SG', lat: 1.3521,   lon: 103.8198 },
  { name: 'São Paulo', country: 'BR', lat: -23.5505, lon: -46.6333 },
]

function buildAlert(data: any): WeatherAlert | null {
  const temp: number = data.main.temp
  const wind: number = data.wind.speed
  const id: number   = data.weather[0].id

  if (temp > 42 || temp < -10) return { type: 'temperature', msg: 'Temperatura extrema' }
  if (wind > 15)               return { type: 'wind',        msg: 'Vientos fuertes'     }
  if (id >= 200 && id < 300)   return { type: 'storm',       msg: 'Tormenta eléctrica'  }
  if (id >= 600 && id < 700)   return { type: 'snow',        msg: 'Nevada intensa'      }
  return null
}

function mapToCityWeather(city: City, data: any): CityWeather {
  return {
    city:        city.name,
    country:     city.country,
    temp:        Math.round(data.main.temp),
    feels_like:  Math.round(data.main.feels_like),
    humidity:    data.main.humidity,
    description: data.weather[0].description,
    icon:        data.weather[0].icon,
    wind_speed:  data.wind.speed,
    alert:       buildAlert(data),
    timestamp:   new Date().toISOString(),
  }
}

export async function fetchWeatherAll(): Promise<CityWeather[]> {
  const API_KEY = process.env.OPENWEATHER_API_KEY

  if (!API_KEY || API_KEY === 'tu_key_aqui') {
    console.error('[weather] Error: OPENWEATHER_API_KEY no configurada en el .env')
    return []
  }

  const results = await Promise.allSettled(
    CITIES.map((city) =>
      axios
        .get('https://api.openweathermap.org/data/2.5/weather', {
          params: { lat: city.lat, lon: city.lon, appid: API_KEY, units: 'metric', lang: 'es' },
        })
        .then((res) => mapToCityWeather(city, res.data))
    )
  )

  const failed = results
    .map((r, i) => (r.status === 'rejected' ? CITIES[i].name : null))
    .filter(Boolean)

  if (failed.length > 0) {
    console.warn(`[weather] Failed cities: ${failed.join(', ')}`)
  }

  return results
    .filter((r): r is PromiseFulfilledResult<CityWeather> => r.status === 'fulfilled')
    .map((r) => r.value)
}