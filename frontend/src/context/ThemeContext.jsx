import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Default to dark mode (which is our base theme)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('app-theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        return true;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.remove('light-mode');
            localStorage.setItem('app-theme', 'dark');
        } else {
            document.body.classList.add('light-mode');
            localStorage.setItem('app-theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
