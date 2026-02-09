import React from 'react';

const Select = ({ label, id, options = [], className = '', error, ...props }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`px-3 py-2 border rounded bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
           error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
       {error && <span className="mt-1 text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default Select;
