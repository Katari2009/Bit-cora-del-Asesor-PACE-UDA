import { useState, useEffect } from 'react';
import { signInWithRedirect, signInWithPopup, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { CalendarDays, LogIn } from 'lucide-react';

interface AuthScreenProps {
  setAccessToken: (token: string | null) => void;
}

export function AuthScreen({ setAccessToken }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for redirect result on mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            sessionStorage.setItem('google_access_token', credential.accessToken);
            setAccessToken(credential.accessToken);
          }
        }
      } catch (err: any) {
        console.error('Redirect result error:', err);
        if (err.code === 'auth/unauthorized-domain') {
          setError('Dominio no autorizado. Debes agregar este dominio en Firebase > Authentication > Configuración > Dominios autorizados.');
        } else {
          setError('Error al procesar el inicio de sesión. Por favor intenta de nuevo.');
        }
      }
    };
    handleRedirectResult();
  }, [setAccessToken]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try redirect first, fallback to popup
      await signInWithRedirect(auth, googleProvider);
      // The page will redirect to Google and back
    } catch (err: any) {
      console.error('Redirect login error:', err);
      // Fallback to popup if redirect fails
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          sessionStorage.setItem('google_access_token', credential.accessToken);
          setAccessToken(credential.accessToken);
        }
      } catch (popupErr: any) {
        console.error('Popup login error:', popupErr);
        if (popupErr.code === 'auth/unauthorized-domain') {
          setError('Dominio no autorizado. Debes agregar este dominio en Firebase > Authentication > Configuración > Dominios autorizados.');
        } else if (popupErr.code === 'auth/popup-blocked') {
          setError('El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.');
        } else if (popupErr.code === 'auth/popup-closed-by-user') {
          setError('Se cerró la ventana de inicio de sesión antes de terminar.');
        } else {
          setError('Error al iniciar sesión. Por favor intenta de nuevo. (' + (popupErr.message || 'Error desconocido') + ')');
        }
      } finally {
        setLoading(false);
      }
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

        {error && (
          <div className="mb-6 w-full max-w-md p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full max-w-md flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-4 px-6 rounded-full transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <LogIn size={22} />
          )}
          <span className="text-lg">Get Started</span>
        </button>

        <p className="mt-6 text-xs text-slate-400 text-center max-w-xs">
          Al iniciar sesión, aceptas conectar tu cuenta de Google Calendar para sincronizar tus eventos.
        </p>
      </div>
    </div>
  );
}
