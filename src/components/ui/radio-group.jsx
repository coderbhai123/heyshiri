import React from 'react';

export function RadioGroup({ children, value, onValueChange, className = '' }) {
  const handleChange = (e) => {
    onValueChange(e.target.value);
  };

  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        selectedValue: value,
        onChange: handleChange,
        name: 'radio-group'
      });
    }
    return child;
  });

  return (
    <div className={`space-y-2 ${className}`}>
      {enhancedChildren}
    </div>
  );
}

export function RadioGroupItem({ value, id, selectedValue, onChange }) {
  return (
    <div className="flex items-center">
      <input
        type="radio"
        id={id}
        value={value}
        checked={selectedValue === value}
        onChange={onChange}
        className="h-4 w-4 text-pink-600 border-gray-300 focus:ring-2 focus:ring-pink-500 cursor-pointer"
      />
    </div>
  );
}