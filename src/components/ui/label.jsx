import React from 'react';

export function Label({ htmlFor, children, className = '', required = false }) {
  return (
    <label 
      htmlFor={htmlFor} 
      className={`block text-sm font-semibold text-gray-700 mb-1 ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}