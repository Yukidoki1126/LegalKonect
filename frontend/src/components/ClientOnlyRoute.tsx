import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ClientOnlyRouteProps {
  children: React.ReactNode;
}

const ClientOnlyRoute: React.FC<ClientOnlyRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const checkUserType = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // If user is a lawyer, redirect to lawyer dashboard immediately
        if (response.data.lawyer) {
          navigate('/lawyer/dashboard', { replace: true });
        } else {
          // User is a client, allow rendering
          setIsClient(true);
          setIsChecking(false);
        }
      } catch (err) {
        console.error('Error checking user type:', err);
        setIsChecking(false);
      }
    };

    checkUserType();
  }, [navigate]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Only render children if user is confirmed to be a client
  return isClient ? <>{children}</> : null;
};

export default ClientOnlyRoute;