import { useState, useEffect } from 'react';
import { 
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, 
  CloudRain, CloudSnow, CloudLightning, MapPin, Loader2, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface DailyForecast {
  time: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
}

interface WeatherData {
  temperature: number;
  weatherCode: number;
  city: string;
  daily: DailyForecast[];
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

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

        // Fetch weather including daily forecast
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const weatherData = await weatherRes.json();

        const dailyForecasts: DailyForecast[] = weatherData.daily.time.map((time: string, index: number) => ({
          time,
          weatherCode: weatherData.daily.weathercode[index],
          tempMax: Math.round(weatherData.daily.temperature_2m_max[index]),
          tempMin: Math.round(weatherData.daily.temperature_2m_min[index]),
        }));

        setWeather({
          temperature: Math.round(weatherData.current_weather.temperature),
          weatherCode: weatherData.current_weather.weathercode,
          city,
          daily: dailyForecasts
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

  const getWeatherIcon = (code: number, size = 32) => {
    if (code === 0) return <Sun className="text-amber-500" size={size} />;
    if (code === 1 || code === 2) return <CloudSun className="text-amber-500" size={size} />;
    if (code === 3) return <Cloud className="text-slate-400" size={size} />;
    if (code === 45 || code === 48) return <CloudFog className="text-slate-400" size={size} />;
    if ([51, 53, 55, 56, 57].includes(code)) return <CloudDrizzle className="text-blue-400" size={size} />;
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain className="text-blue-500" size={size} />;
    if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow className="text-sky-300" size={size} />;
    if ([95, 96, 99].includes(code)) return <CloudLightning className="text-purple-500" size={size} />;
    return <Sun className="text-amber-500" size={size} />;
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
    <motion.div 
      layout
      onClick={() => setIsExpanded(!isExpanded)}
      className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] shadow-xl shadow-indigo-200/50 p-6 text-white relative overflow-hidden cursor-pointer"
    >
      {/* Decorative background circles */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>
      
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
        
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
            {getWeatherIcon(weather.weatherCode)}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-white/70"
          >
            <ChevronDown size={20} />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative z-10 border-t border-white/20 pt-4"
          >
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-indigo-100 mb-2">Pronóstico 7 días</h4>
              {weather.daily.map((day, index) => {
                const date = parseISO(day.time);
                const isToday = index === 0;
                
                return (
                  <div key={day.time} className="flex items-center justify-between text-sm">
                    <span className="w-20 font-medium text-indigo-50 capitalize">
                      {isToday ? 'Hoy' : format(date, 'EEEE', { locale: es })}
                    </span>
                    <div className="flex items-center justify-center flex-1 gap-2">
                      {getWeatherIcon(day.weatherCode, 18)}
                      <span className="text-indigo-100 text-xs hidden sm:inline-block w-24 truncate">
                        {getWeatherDescription(day.weatherCode)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 w-24 justify-end font-medium">
                      <span className="text-white">{day.tempMax}°</span>
                      <span className="text-indigo-200">{day.tempMin}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
