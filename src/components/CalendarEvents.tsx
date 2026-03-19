import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, ExternalLink, Loader2, Plus } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink: string;
}

interface CalendarEventsProps {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

export function CalendarEvents({ accessToken, setAccessToken }: CalendarEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    const fetchEvents = async () => {
      try {
        const timeMin = new Date().toISOString();
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 30); // Fetch next 30 days
        
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax.toISOString()}&orderBy=startTime&singleEvents=true&maxResults=50`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          console.error(`Google Calendar API Error: ${response.status} ${response.statusText}`);
          const errorData = await response.json().catch(() => null);
          console.error('Error details:', errorData);
          
          if (response.status === 403) {
            throw new Error('API_NOT_ENABLED_OR_FORBIDDEN');
          } else if (response.status === 401) {
            throw new Error('TOKEN_EXPIRED');
          }
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        setEvents(data.items || []);
      } catch (err: any) {
        console.error('Error fetching calendar events:', err);
        if (err.message === 'API_NOT_ENABLED_OR_FORBIDDEN') {
          setError('Error 403: El API de Google Calendar no está habilitado o faltan permisos. 1) Habilita "Google Calendar API" en Google Cloud Console. 2) Al iniciar sesión, asegúrate de marcar las casillas de permisos.');
        } else if (err.message === 'TOKEN_EXPIRED') {
          setError('Tu sesión de Google ha expirado o el token es inválido. Por favor, vuelve a conectar tu calendario.');
          localStorage.removeItem('google_access_token');
        } else {
          setError('No se pudieron cargar los eventos del calendario. Verifica tu conexión.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [accessToken]);

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.date) {
      return 'Todo el día';
    }
    
    const start = new Date(event.start.dateTime!);
    const end = new Date(event.end.dateTime!);
    
    let dayStr = '';
    if (isToday(start)) dayStr = 'Hoy';
    else if (isTomorrow(start)) dayStr = 'Mañana';
    else dayStr = format(start, 'EEEE d', { locale: es });
    
    return `${dayStr}, ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  };

  const colors = [
    { bg: 'bg-teal-50', border: 'border-teal-400', text: 'text-teal-800' },
    { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-800' },
    { bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-800' },
    { bg: 'bg-pink-50', border: 'border-pink-400', text: 'text-pink-800' },
  ];

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border-0 overflow-hidden flex flex-col h-full">
      <div className="p-6 md:p-8 pb-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900">Meetings</h2>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href="https://calendar.google.com/calendar/r/eventedit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-colors shadow-md shadow-indigo-200"
            title="Nuevo evento"
          >
            <Plus size={20} />
          </a>
        </div>
      </div>

      <div className="px-6 md:px-8 pb-4 flex justify-between items-center">
        <p className="text-slate-500 font-medium">Próximos 30 días</p>
        <a 
          href="https://calendar.google.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
        >
          Ver todo <ExternalLink size={14} />
        </a>
      </div>

      <div className="p-6 md:p-8 pt-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12 text-indigo-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 flex flex-col items-start gap-3">
            <p>{error}</p>
            <button
              onClick={() => {
                localStorage.removeItem('google_access_token');
                import('firebase/auth').then(({ signInWithPopup, GoogleAuthProvider }) => {
                  import('../lib/firebase').then(({ auth, googleProvider }) => {
                    signInWithPopup(auth, googleProvider).then((result) => {
                      const credential = GoogleAuthProvider.credentialFromResult(result);
                      if (credential?.accessToken) {
                        localStorage.setItem('google_access_token', credential.accessToken);
                        setAccessToken(credential.accessToken);
                      }
                    }).catch(console.error);
                  });
                });
              }}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors text-xs"
            >
              Reconectar Calendario
            </button>
          </div>
        ) : !accessToken ? (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon size={32} />
            </div>
            <p className="text-slate-600 font-medium mb-4">
              Conecta tu calendario para ver tus eventos
            </p>
            <button
              onClick={() => {
                // Force a re-login to get the access token
                import('firebase/auth').then(({ signInWithPopup, GoogleAuthProvider }) => {
                  import('../lib/firebase').then(({ auth, googleProvider }) => {
                    signInWithPopup(auth, googleProvider).then((result) => {
                      const credential = GoogleAuthProvider.credentialFromResult(result);
                      if (credential?.accessToken) {
                        localStorage.setItem('google_access_token', credential.accessToken);
                        setAccessToken(credential.accessToken);
                      }
                    }).catch(console.error);
                  });
                });
              }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-md shadow-indigo-200"
            >
              Conectar Google Calendar
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon size={40} />
            </div>
            <p className="text-slate-500 font-medium">No hay eventos próximos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => {
              const color = colors[index % colors.length];
              return (
                <a 
                  key={event.id} 
                  href={event.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block p-5 rounded-2xl border-l-4 ${color.border} ${color.bg} hover:shadow-md transition-all group`}
                >
                  <h3 className={`font-bold ${color.text} mb-2 text-lg`}>
                    {event.summary || '(Sin título)'}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="opacity-70" />
                      <span className="capitalize">{formatEventTime(event)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="opacity-70 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
