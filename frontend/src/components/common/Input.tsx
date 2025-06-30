import React, { InputHTMLAttributes, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, type = 'text', ...props }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-[#FFB347] mb-1">{label}</label>}
      <div className="relative">
        <input
          className="w-full px-4 py-3 bg-[#2C1100] text-[#FFF7F0] border border-[#FF6A00]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/60 transition placeholder-[#FFB347]/60"
          type={isPassword && !show ? 'password' : 'text'}
          {...props}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFB347] text-xs focus:outline-none">
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && <div className="text-xs text-[#FF6A00] mt-1">{error}</div>}
    </div>
  );
};

export default Input; 