import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppState } from '@/services/appState.jsx';

/**
 * OAuthCallback: Handles GitHub OAuth callback redirect.
 * 
 * Backend has already handled code exchange and set session cookie.
 * This component hydrates user from new session and redirects to dashboard.
 * 
 * @component
 * @returns {JSX.Element} Loading state or error message
 */
export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { dispatch } = useAppState();

  useEffect(() => {
    /**
     * Handle OAuth callback - backend already exchanged code for session.
     * Now we hydrate the user and redirect to dashboard.
     */
    async function handleCallback() {
      const error = searchParams.get('error');
      const authSuccess = searchParams.get('auth') === 'success';

      if (error) {
        console.error('GitHub OAuth error:', error);
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }

      try {
        if (authSuccess) {
          // Fetch current user from session (backend set cookie)
          // Note: /api requests are proxied to localhost:8000 by Vite
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              // Update app state with authenticated user
              dispatch({
                type: 'USER_LOGIN',
                payload: { user: data.user },
              });
              // Small delay to ensure state updates before navigation
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
        }

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/dashboard');
      }
    }

    handleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-center">
        <p className="text-blue-300 text-lg">Completing authentication...</p>
        <div className="mt-4 inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
