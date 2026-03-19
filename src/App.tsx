import { useState, useEffect } from 'react';
import { onAuthStateChanged, getRedirectResult, User, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './lib/firebase';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Manejar el resultado del redirect de Google Auth
    getRedirectResult(auth).then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          localStorage.setItem('google_access_token', credential.accessToken);
          setAccessToken(credential.accessToken);
        }
      }
    }).catch((error) => {
      console.error("Redirect error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        setAuthError('Dominio no autorizado. Debes agregar este dominio en la consola de Firebase > Authentication > Configuración > Dominios autorizados.');
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const storedToken = localStorage.getItem('google_access_token');
        if (storedToken) {
          setAccessToken(storedToken);
        }
      } else {
        setAccessToken(null);
        localStorage.removeItem('google_access_token');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {authError && (
        <div className="fixed top-0 left-0 w-full p-4 bg-red-600 text-white text-center z-50 shadow-md">
          {authError}
        </div>
      )}
      {user ? <Dashboard accessToken={accessToken} setAccessToken={setAccessToken} /> : <AuthScreen setAccessToken={setAccessToken} />}
    </ErrorBoundary>
  );
}

