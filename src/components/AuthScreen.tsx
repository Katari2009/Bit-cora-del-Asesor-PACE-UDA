import { useState, useEffect } from 'react';
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { CalendarDays, LogIn, AlertTriangle, ExternalLink } from 'lucide-react';

interface AuthScreenProps {
  setAccessToken: (token: string | null) => void;
}

export function AuthScreen({ setAccessToken }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inAppBrowser, setInAppBrowser] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (ua && (ua.includes('FBAN') || ua.includes('FBAV') || ua.includes('Instagram') || ua.includes('WhatsApp') || ua.includes('Line'))) {
      setInAppBrowser(true);
    }
  }, []);

  const handleLogin = async (useRedirect = false) => {
    setLoading(true);
    setError(null);
    try {
      if (useRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return; // La página se redirigirá
      }

      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem('google_access_token', credential.accessToken);
        setAccessToken(credential.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Dominio no autorizado. Debes agregar este dominio en la consola de Firebase > Authentication > Configuración > Dominios autorizados.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes o usa el botón de "Intentar método alternativo".');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Se cerró la ventana de inicio de sesión antes de terminar.');
      } else if (err.code === 'auth/cross-origin-cookies-blocked' || err.message?.includes('cross-origin')) {
        setError('Tu navegador está bloqueando las cookies de terceros. Por favor, usa Chrome/Safari normal o desactiva "Prevenir rastreo entre sitios".');
      } else {
        setError('Error al iniciar sesión. Por favor intenta de nuevo. (' + (err.message || 'Error desconocido') + ')');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-indigo-600">
      {/* Top half - Hero area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-2xl relative z-10 border border-white/20">
          <CalendarDays size={48} className="text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center tracking-tight relative z-10">
          Bienvenido a tu<br />Bitácora PACE
        </h1>
        <p className="text-indigo-100 text-center max-w-sm relative z-10 text-lg">
          La mejor forma de organizar tus asesorías, horarios y eventos en un solo lugar.
        </p>
      </div>
      
      {/* Bottom half - Auth card */}
      <div className="bg-white rounded-t-[3rem] p-8 md:p-12 shadow-2xl flex flex-col items-center relative z-20">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-8"></div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Comenzar</h2>
        <p className="text-slate-500 mb-8 text-center max-w-sm">
          Inicia sesión para sincronizar tu Google Calendar y acceder a tus herramientas.
        </p>

        {inAppBrowser && (
          <div className="mb-6 w-full max-w-md p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={18} className="text-amber-600" />
              Navegador integrado detectado
            </div>
            <p>
              Parece que abriste este enlace desde una red social. El inicio de sesión suele fallar aquí.
            </p>
            <p className="font-medium mt-1">
              Por favor, toca el menú de opciones y selecciona "Abrir en el navegador" (Safari o Chrome).
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 w-full max-w-md flex flex-col gap-3">
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100">
              {error}
            </div>
            <button 
              onClick={() => handleLogin(true)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline flex items-center justify-center gap-1"
            >
              Intentar método alternativo (Redirección) <ExternalLink size={14} />
            </button>
          </div>
        )}

        <button
          onClick={() => handleLogin(false)}
          disabled={loading}
          className="w-full max-w-md flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-4 px-6 rounded-full transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <LogIn size={22} />
          )}
          <span className="text-lg">Iniciar sesión</span>
        </button>
        
        <p className="mt-6 text-xs text-slate-400 text-center max-w-xs">
          Al iniciar sesión, aceptas conectar tu cuenta de Google Calendar para sincronizar tus eventos.
        </p>
      </div>
    </div>
  );
}
