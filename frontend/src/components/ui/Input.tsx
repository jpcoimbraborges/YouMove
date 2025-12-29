'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helper, className = '', ...props }, ref) => {
        return (
            <div className="input-group">
                {label && <label className="input-label">{label}</label>}
                <input
                    ref={ref}
                    className={`input ${error ? 'input-error' : ''} ${className}`}
                    {...props}
                />
                {error && <span className="input-error-text">{error}</span>}
                {helper && !error && <span className="input-helper">{helper}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
