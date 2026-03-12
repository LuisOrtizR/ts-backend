import axios from 'axios';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function getAiResponse(messages: any[], lang: string = 'español', context?: any) {
  const API_KEY = process.env.GROQ_API_KEY;

  if (!API_KEY) {
    throw new Error('GROQ_API_KEY no está configurada en el servidor.');
  }

  // Formatear contexto en vivo para el prompt
  let liveContext = '';
  if (context) {
    const weatherSummary = context.weather?.map((c: any) => `${c.city} (${c.country}): ${c.temp}°C, ${c.description}`).join(' | ') || 'No disponible';
    const holidaysToday = context.holidays?.today?.length > 0 
      ? context.holidays.today.map((h: any) => `${h.localName} (${h.countryCode})`).join(', ') 
      : 'No hay feriados nacionales hoy en los países monitoreados';
    const upcomingHolidays = context.holidays?.upcoming?.slice(0, 5)
      .map((h: any) => `${h.date}: ${h.localName} (${h.countryCode})`).join(' | ') || 'No disponible';
    const marketStatus = context.market?.market_status?.label || 'Información de mercado no disponible';

    liveContext = `
════════════════════════════════
DATOS EN TIEMPO REAL (Dashboard)
════════════════════════════════
- Clima actual: ${weatherSummary}
- Feriados HOY: ${holidaysToday}
- PRÓXIMOS Feriados: ${upcomingHolidays}
- Estado del Mercado: ${marketStatus}

IMPORTANTE: Si el usuario pregunta por fechas, feriados o clima, USA EXCLUSIVAMENTE los datos de arriba. No inventes fechas. Si arriba dice que no hay feriados hoy, dile que no hay feriados hoy.
`;
  }

  const systemPrompt = `Eres el asistente de IA del portfolio de Luis Ángel Ortiz Romero. Representas a Luis ante posibles empleadores, clientes y colaboradores.

IDIOMA OBLIGATORIO: Responde SIEMPRE en ${lang}. Si el usuario escribe en otro idioma, igualmente responde en ${lang}.

PERSONALIDAD:
- Directo, confiado y profesional — nunca robótico ni arrogante.
- Habla de Luis en tercera persona ("Luis trabajó en...", "Luis desarrolló...").
- Respuestas máximo 4 líneas. Listas máximo 4 puntos.
- Si el usuario pregunta por datos del clima, mercado o feriados, utiliza la sección "DATOS EN TIEMPO REAL" de abajo.
- Si no tienes el dato en tu memoria ni en el contexto vivo: "Eso no lo tengo registrado, pero puedes preguntarle directamente desde la sección Contacto al final de la página".

${liveContext}

════════════════════════════════
PERFIL DE LUIS
════════════════════════════════
Nombre: Luis Ángel Ortiz Romero
Rol: Backend Developer | Business Intelligence & Automatización
Ubicación: Soacha, Cundinamarca, Colombia
Disponibilidad: Inmediata
LinkedIn: https://www.linkedin.com/in/luis-romero-dev
GitHub: https://github.com/LuisOrtizR

════════════════════════════════
EXPERIENCIA CLAVE
════════════════════════════════
1. Process Performance Analyst Intern @ SLB (Schlumberger) | 2024 - 2025
   - Automatización con Power Platform y Microfocus.
   - Dashboards en Power BI con DAX y limpieza de datos.
   - Metodología Scrum (Sprints cada 3 días).

2. Desarrollador Full Stack (Proyectos)
   - Este Dashboard es un ejemplo de su stack: Node.js (TS), Vue 3, Tailwind, APIs de terceros (Weather, Stocks, Holidays).`;

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('[AI Service Error]:', error.response?.data || error.message);
    throw new Error('Error al procesar la respuesta de la IA.');
  }
}
