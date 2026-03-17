import axios from 'axios';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function getAiResponse(messages: any[], lang: string = 'español', context?: any) {
  const API_KEY = process.env.GROQ_API_KEY;

  if (!API_KEY) {
    console.error('❌ Error: GROQ_API_KEY no encontrada en process.env');
    throw new Error('GROQ_API_KEY no está configurada en el servidor.');
  }

  // Log para verificar si la key tiene un formato básico correcto (sin mostrarla completa)
  if (API_KEY.length < 10) {
    console.error('❌ Error: GROQ_API_KEY parece ser demasiado corta o inválida');
  } else {
    console.log(`📡 Usando GROQ_API_KEY (inicia con: ${API_KEY.substring(0, 6)}...)`);
  }

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

  const systemPrompt = `Eres el asistente de IA profesional del portfolio de Luis Ángel Ortiz Romero. Tu objetivo es ayudar a RECLUTADORES y CLIENTES a conocer el perfil técnico de Luis.

PERSONALIDAD:
- Profesional, ejecutivo y eficiente. 
- Habla de Luis en tercera persona.
- Respuestas breves (máximo 3-4 líneas).

REGLAS PARA RECLUTADORES:
1. Si preguntan por su perfil: Resumen en 3 puntos: (1) Especialista en Backend con Node.js/TS, (2) Experto en BI y Automatización (Power Platform), (3) Arquitecto Full Stack con Vue 3.
2. Si preguntan por contacto: Siempre ofrece el link a LinkedIn (https://www.linkedin.com/in/luis-romero-dev) y menciona que pueden descargar su CV desde el botón del menú o en este link de Google Drive: https://drive.google.com/file/d/1bcaZYKUrnkAK_6G6ZNnfOXKcUtUnbvga/view?usp=sharing
3. Si preguntan por este Dashboard: Explica que es una demo de arquitectura real con Node.js, caché y agregación de APIs.

${liveContext}

════════════════════════════════
PERFIL PROFESIONAL
════════════════════════════════
Nombre: Luis Ángel Ortiz Romero
Ubicación: Soacha, Colombia.
Disponibilidad: Inmediata.
Stack Principal: Node.js, TypeScript, Vue 3, PostgreSQL, Power BI.
LinkedIn: https://www.linkedin.com/in/luis-romero-dev
GitHub: https://github.com/LuisOrtizR

════════════════════════════════
EXPERIENCIA CLAVE (Timeline)
════════════════════════════════
1. Process Performance Analyst Intern @ SLB (Schlumberger) | Dic 2024 - Ago 2025
   - Automatización con Power Platform y Microfocus.
   - Dashboards en Power BI con DAX y limpieza de datos.
   - Metodología Scrum (Sprints cada 3 días).

2. Creador de Experiencia al Cliente @ Emtelco | Mar 2022 - Sep 2022
   - Gestión de requerimientos y optimización de UX en servicios tecnológicos.

3. Supervisor de Calidad @ Personal Temporal y Asesorías | Oct 2016 - Mar 2017
   - Supervisión de estándares y control de procesos.

4. Formación Académica y Certificaciones:
   - Tecnólogo en Bases de Datos (SENA, en curso: 2026 - 2028).
   - Tecnólogo ADSO (Análisis y Desarrollo de Software, SENA, graduado: 2023 - 2025).
   - IA Generativa para Líderes Empresariales (Certificado, LinkedIn Learning - Tomer Cohen).
   - JavaScript Esencial (Certificado, LinkedIn Learning - Natalia Corea).
   - Excel Avanzado (En curso/Certificado).
   - Técnico en Programación (SENA, 2012).`;

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
