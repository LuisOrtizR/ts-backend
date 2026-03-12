import { Router, Request, Response } from 'express';
import { getAiResponse } from '../services/aiService';
import cache from '../services/cache';
import { fetchWeatherAll } from '../services/weatherService';
import { fetchTodayHolidays } from '../services/holidaysService';
import { fetchMarketData } from '../services/marketService';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { messages, lang } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Faltan mensajes en la petición.' });
  }

  // Intentar obtener datos del caché, si no existen, forzar una petición rápida
  let weather = cache.get('weather:all');
  if (!weather) {
    weather = await fetchWeatherAll().catch(() => null);
    if (weather) cache.set('weather:all', weather, 1800);
  }

  let holidays = cache.get('holidays:today');
  if (!holidays) {
    holidays = await fetchTodayHolidays().catch(() => null);
    if (holidays) cache.set('holidays:today', holidays, 3600);
  }

  let market = cache.get('market:all');
  if (!market) {
    market = await fetchMarketData().catch(() => null);
    if (market) cache.set('market:all', market, 1800);
  }

  const context = { weather, holidays, market };

  try {
    const aiResponse = await getAiResponse(messages, lang, context);
    res.json({ data: aiResponse });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ error: message });
  }
});

export default router;
