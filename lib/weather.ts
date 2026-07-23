const DAR_LAT = -6.7924;
const DAR_LON = 39.2083;

export type RainRisk = { pop: number; description: string };

/**
 * Returns a map of "YYYY-MM-DD" (Africa/Dar_es_Salaam) -> worst rain
 * probability during the early-morning window (3am-9am), covering
 * whatever OpenWeatherMap's free 5-day/3-hour forecast returns. Dates
 * further out than ~5 days simply won't have an entry — callers
 * should treat a missing key as "no forecast available yet", not "no
 * rain risk".
 */
export async function getDarEsSalaamMorningRain(): Promise<Map<string, RainRisk>> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) return new Map();

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${DAR_LAT}&lon=${DAR_LON}&appid=${apiKey}&units=metric`,
      { next: { revalidate: 3600 } } // 1 hour cache — no need to hit this on every request
    );
    if (!res.ok) return new Map();

    const data = await res.json();
    const map = new Map<string, RainRisk>();

    for (const entry of data.list ?? []) {
      const dt = new Date(entry.dt * 1000);
      const dateKey = dt.toLocaleDateString("en-CA", { timeZone: "Africa/Dar_es_Salaam" });
      const hour = Number(
        dt.toLocaleString("en-US", {
          timeZone: "Africa/Dar_es_Salaam",
          hour: "2-digit",
          hour12: false,
        })
      );
      if (hour < 3 || hour > 9) continue; // only care about the early-morning window

      const pop: number = entry.pop ?? 0; // 0-1 probability of precipitation
      const description: string = entry.weather?.[0]?.description ?? "rain";

      const existing = map.get(dateKey);
      if (!existing || pop > existing.pop) {
        map.set(dateKey, { pop, description });
      }
    }

    return map;
  } catch {
    return new Map();
  }
}
