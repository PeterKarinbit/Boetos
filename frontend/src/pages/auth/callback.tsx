import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback
    const handleCallback = () => {
      // Get the access token from the URL fragment
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');

      if (accessToken) {
        // Store the token
        localStorage.setItem('googleAccessToken', accessToken);
        
        // Redirect back to the calendar page
        navigate('/calendar');
      } else {
        // Handle error
        console.error('No access token received');
        navigate('/calendar?error=auth_failed');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default AuthCallback;
