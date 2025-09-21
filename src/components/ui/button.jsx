import React from 'react';

export function Button({ 
  children, 
  onClick, 
  className = '', 
  variant = 'default', 
  disabled = false,
  size = 'default'
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-semibold transition transform focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer';
  
  const variants = {
    default: 'bg-pink-500 text-white hover:bg-pink-600 focus:ring-pink-500 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    destructive: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    default: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:scale-105';

  const buttonClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`;

  return (
    <button
      className={buttonClasses}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}