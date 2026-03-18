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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Attempt to get the redirect result to capture the Google OAuth token
          const result = await getRedirectResult(auth);
          if (result) {
            // @ts-ignore - GoogleAuthProvider credential exists on result
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
              setAccessToken(credential.accessToken);
              // Store in session storage to persist across reloads
              sessionStorage.setItem('google_access_token', credential.accessToken);
            }
          } else {
            // If no redirect result, check session storage
            const storedToken = sessionStorage.getItem('google_access_token');
            if (storedToken) {
              setAccessToken(storedToken);
            }
          }
        } catch (error) {
          console.error("Error getting redirect result:", error);
        }
      } else {
        setAccessToken(null);
        sessionStorage.removeItem('google_access_token');
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
      {user ? <Dashboard accessToken={accessToken} /> : <AuthScreen />}
    </ErrorBoundary>
  );
}

