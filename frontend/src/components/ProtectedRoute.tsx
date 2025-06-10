import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { Spinner } from './Spinner'; // Assuming you have a Spinner component

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useUser();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <Spinner />;
  }

  // If user is not authenticated, check localStorage for user
  let effectiveUser = user;
  if (!effectiveUser) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      effectiveUser = JSON.parse(storedUser);
    }
  }

  // If user is still not authenticated, redirect to login
  if (!effectiveUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated, render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;