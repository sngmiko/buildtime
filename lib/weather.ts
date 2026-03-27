export async function fetchWeather(lat: number, lng: number): Promise<{ weather: string; temperature: number; wind: string } | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,weather_code&timezone=Europe/Berlin`,
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) return null
    const data = await res.json()

    const codes: Record<number, string> = {
      0: 'Klar', 1: 'Überwiegend klar', 2: 'Teilweise bewölkt', 3: 'Bewölkt',
      45: 'Nebel', 48: 'Reifnebel', 51: 'Leichter Nieselregen', 53: 'Nieselregen',
      55: 'Starker Nieselregen', 61: 'Leichter Regen', 63: 'Regen', 65: 'Starker Regen',
      71: 'Leichter Schneefall', 73: 'Schneefall', 75: 'Starker Schneefall',
      80: 'Regenschauer', 81: 'Starke Regenschauer', 85: 'Schneeschauer',
      95: 'Gewitter', 96: 'Gewitter mit Hagel',
    }

    return {
      weather: codes[data.current.weather_code] || 'Unbekannt',
      temperature: Math.round(data.current.temperature_2m),
      wind: `${Math.round(data.current.wind_speed_10m)} km/h`,
    }
  } catch {
    return null
  }
}
