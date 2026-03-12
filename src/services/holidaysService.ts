import axios from 'axios'
import Holidays from 'date-holidays'
import { Holiday, HolidaysResponse } from '../types'

const COUNTRIES: string[] = [
  // Américas (19)
  'US', 'MX', 'CO', 'BR', 'AR', 'CA', 'CL', 'PE', 'VE', 'EC', 
  'PA', 'CR', 'DO', 'GT', 'PR', 'UY', 'PY', 'BO', 'SV',
  // Europa (22)
  'GB', 'DE', 'FR', 'ES', 'NL', 'IT', 'PT', 'BE', 'CH', 'AT', 
  'SE', 'NO', 'FI', 'DK', 'PL', 'GR', 'CZ', 'HU', 'IE', 'RO', 
  'RU', 'UA', 'TR',
  // Asia & Medio Oriente (17)
  'SG', 'IN', 'CN', 'JP', 'KR', 'TH', 'VN', 'PH', 'MY', 'ID', 
  'AE', 'SA', 'IL', 'PK', 'BD', 'TW', 'HK',
  // Oceanía (2)
  'AU', 'NZ',
  // África (6)
  'NG', 'ZA', 'EG', 'KE', 'MA', 'GH'
]

function mapCalendarificToHoliday(item: any, countryCode: string): Holiday {
  return {
    date: item.date.iso.split('T')[0],
    localName: item.name,
    name: item.name,
    countryCode: countryCode,
    fixed: item.type.includes('National holiday'),
    global: true,
    types: item.type,
    source: 'api'
  }
}

/**
 * date-holidays library - Mapping function
 */
function mapLibraryToHoliday(item: any, countryCode: string): Holiday {
  return {
    date: item.date.split(' ')[0],
    localName: item.name,
    name: item.name,
    countryCode: countryCode,
    fixed: item.type === 'public',
    global: true,
    types: [item.type],
    source: 'library'
  }
}

/**
 * Fetch holidays using a combination of Library (fast), API (Calendarific) and URL (Nager.Date)
 */
async function fetchHolidaysForYear(year: number): Promise<Holiday[]> {
  const API_KEY = process.env.CALENDARIFIC_API_KEY
  const isCalendarific = API_KEY && API_KEY !== 'tu_key_aqui'

  // 1. Initial source: Library (date-holidays) - Local and very fast
  const holidaysFromLibrary: Holiday[] = []
  const countriesToFetchRemotely: string[] = []

  COUNTRIES.forEach(country => {
    try {
      const hd = new Holidays(country)
      const libraryHolidays = hd.getHolidays(year)
      if (libraryHolidays && libraryHolidays.length > 0) {
        holidaysFromLibrary.push(...libraryHolidays.map(h => mapLibraryToHoliday(h, country)))
      } else {
        countriesToFetchRemotely.push(country)
      }
    } catch {
      countriesToFetchRemotely.push(country)
    }
  })

  // 2. Secondary source: Remote APIs (Calendarific or Nager.Date) for missing or more detailed data
  const results = await Promise.allSettled(
    countriesToFetchRemotely.map((country) => {
      if (isCalendarific) {
        return axios
          .get(`https://calendarific.com/api/v2/holidays`, {
            params: { api_key: API_KEY, country: country, year: year, type: 'national' }
          })
          .then((res) => {
            const holidays = res.data.response.holidays || []
            return holidays.map((h: any) => mapCalendarificToHoliday(h, country))
          })
      } else {
        return axios
          .get<Holiday[]>(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`)
          .then((res) => res.data.map((h) => ({ ...h, countryCode: country, source: 'url' })))
      }
    })
  )

  const remoteHolidays = results
    .filter((r): r is PromiseFulfilledResult<Holiday[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value)

  // Merge results, removing duplicates (if any)
  const allHolidays = [...holidaysFromLibrary, ...remoteHolidays]
  
  // Use a map to deduplicate by date + name + country
  const uniqueHolidays = new Map<string, Holiday>()
  allHolidays.forEach(h => {
    const key = `${h.date}-${h.name}-${h.countryCode}`
    if (!uniqueHolidays.has(key)) {
      uniqueHolidays.set(key, h)
    }
  })

  return Array.from(uniqueHolidays.values())
}

export async function fetchTodayHolidays(): Promise<HolidaysResponse> {
  const today = new Date().toISOString().split('T')[0]
  const year  = new Date().getFullYear()

  const allHolidays = await fetchHolidaysForYear(year)

  const todayHolidays = allHolidays.filter((h) => h.date === today)
  const upcoming      = allHolidays
    .filter((h) => h.date > today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 20)

  const affectedCountries = new Set(todayHolidays.map((h) => h.countryCode))

  return {
    today:                 todayHolidays,
    upcoming,
    non_operational_today: [...affectedCountries],
    summary: {
      total_today:        todayHolidays.length,
      countries_affected: affectedCountries.size,
    },
    fetched_at: new Date().toISOString(),
  }
}

export async function fetchHolidaysByMonth(year: number, month: number): Promise<Holiday[]> {
  const paddedMonth = String(month).padStart(2, '0')
  const prefix      = `${year}-${paddedMonth}`

  const allHolidays = await fetchHolidaysForYear(year)

  return allHolidays
    .filter((h) => h.date.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date))
}