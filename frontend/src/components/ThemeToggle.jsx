import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <>
            <style>{`
                .switch {
                    display: block;
                    --width-of-switch: 3.5em;
                    --height-of-switch: 2em;
                    --size-of-icon: 1.4em;
                    --slider-offset: 0.3em;
                    position: relative;
                    width: var(--width-of-switch);
                    height: var(--height-of-switch);
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #f4f4f5;
                    transition: .4s;
                    border-radius: 30px;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: var(--size-of-icon, 1.4em);
                    width: var(--size-of-icon, 1.4em);
                    border-radius: 20px;
                    left: var(--slider-offset, 0.3em);
                    top: 50%;
                    transform: translateY(-50%);
                    background: #2563eb;
                    transition: .4s;
                }
                .switch input:checked + .slider {
                    background-color: #303136;
                }
                .switch input:checked + .slider:before {
                    left: calc(100% - (var(--size-of-icon, 1.4em) + var(--slider-offset, 0.3em)));
                    background: #303136;
                    box-shadow: inset -3px -2px 5px -2px #e8202a, inset -10px -4px 0 0 #e8202a;
                }
            `}</style>

            <label
                className={`switch ${className}`}
                title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
            >
                <input
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={toggleTheme}
                />
                <span className="slider"></span>
            </label>
        </>
    );
};

export default ThemeToggle;