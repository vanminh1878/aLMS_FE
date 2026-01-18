import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getToken } from '../lib/auth';

const ProtectedRoute = () => {
    // Support multiple possible storage keys used across the app
    const token = getToken() || localStorage.getItem('jwtToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
    const isLoggedIn = !!token;
    // Additional roleName check for specific pages
    const roleName = localStorage.getItem('roleName');
    const path = window.location.pathname || '';

    // If the current path matches any of these keywords, require a roleName in localStorage
    const restrictedKeywords = [
        'statistic', // Dashboard
        'timetable', // Thời khóa biểu
        'notebook', // Sổ liên lạc
        'teaching-management', // Quản lí giảng dạy
        'behaviour', // Hành vi học tập
        'account-management' // Quản lí tài khoản
    ];

    const requiresRole = restrictedKeywords.some((kw) => path.includes(kw));

    if (!isLoggedIn) return <Navigate to="/login" replace />;

    if (requiresRole && !roleName) {
        // If user is logged in but no roleName, block access
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;