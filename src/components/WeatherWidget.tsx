import { useState, useEffect } from 'react';
import { 
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, 
  CloudRain, CloudSnow, CloudLightning, MapPin, Loader2 
} from 'lucide-react';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  city: string;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada');
      setLoading(false);
      return;
    }

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        // Fetch city name
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`);
        const geoData = await geoRes.json();
        const city = geoData.city || geoData.locality || 'Tu ubicación';

        // Fetch weather
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = await weatherRes.json();

        setWeather({
          temperature: Math.round(weatherData.current_weather.temperature),
          weatherCode: weatherData.current_weather.weathercode,
          city
        });
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Error al obtener el clima');
      } finally {
        setLoading(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Permiso de ubicación denegado');
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="text-amber-500" size={32} />;
    if (code === 1 || code === 2) return <CloudSun className="text-amber-500" size={32} />;
    if (code === 3) return <Cloud className="text-slate-400" size={32} />;
    if (code === 45 || code === 48) return <CloudFog className="text-slate-400" size={32} />;
    if ([51, 53, 55, 56, 57].includes(code)) return <CloudDrizzle className="text-blue-400" size={32} />;
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain className="text-blue-500" size={32} />;
    if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow className="text-sky-300" size={32} />;
    if ([95, 96, 99].includes(code)) return <CloudLightning className="text-purple-500" size={32} />;
    return <Sun className="text-amber-500" size={32} />;
  };

  const getWeatherDescription = (code: number) => {
    if (code === 0) return 'Despejado';
    if (code === 1 || code === 2) return 'Parcialmente nublado';
    if (code === 3) return 'Nublado';
    if (code === 45 || code === 48) return 'Niebla';
    if ([51, 53, 55, 56, 57].includes(code)) return 'Llovizna';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Lluvia';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Nieve';
    if ([95, 96, 99].includes(code)) return 'Tormenta';
    return 'Despejado';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 p-6 flex items-center justify-center h-32">
        <Loader2 className="animate-spin text-indigo-400" size={24} />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 p-6 flex flex-col items-center justify-center h-32 text-slate-500 text-sm text-center">
        <MapPin className="mb-2 opacity-50" size={20} />
        {error || 'No se pudo cargar el clima'}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] shadow-xl shadow-indigo-200/50 p-6 text-white relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-indigo-100 mb-1">
            <MapPin size={14} />
            <span className="text-sm font-medium tracking-wide">{weather.city}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tighter">{weather.temperature}°</span>
            <span className="text-lg font-medium text-indigo-100">{getWeatherDescription(weather.weatherCode)}</span>
          </div>
        </div>
        
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
          {getWeatherIcon(weather.weatherCode)}
        </div>
      </div>
    </div>
  );
}
