import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Configure axios instance
    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    });

    // Add token to requests
    api.interceptors.request.use((config) => {
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    useEffect(() => {
        if (token) {
            // Create a temporary api instance to avoid circular dependency or closure issues if we used 'api' directly before it was fully set
            // actually api is stable here. 
            // Let's just fetch user
            api.get('/users/me')
                .then(response => {
                    setUser(response.data);
                })
                .catch(() => {
                    logout();
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await api.post('/auth/token', formData);
            const accessToken = response.data.access_token;
            localStorage.setItem('token', accessToken);
            setToken(accessToken);
            return true;
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const register = async (username, password) => {
        try {
            await api.post('/auth/register', { username, password });
            return await login(username, password);
        } catch (error) {
            console.error("Registration failed", error);
            throw error;
        }
    }

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading, api }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
