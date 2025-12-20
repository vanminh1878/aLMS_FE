import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getToken } from '../lib/auth';

const ProtectedRoute = () => {
    // Support multiple possible storage keys used across the app
    const token = getToken() || localStorage.getItem('jwtToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
    const isLoggedIn = !!token;

    return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;