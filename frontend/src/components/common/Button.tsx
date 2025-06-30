import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, ...props }) => (
  <button
    className="w-full py-3 bg-gradient-to-r from-[#FF6A00] to-[#FFB347] text-black font-semibold rounded-xl hover:shadow-[0_0_20px_#FF6A00AA] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#FFB347]/60 disabled:opacity-50 disabled:cursor-not-allowed"
    {...props}
  >
    {children}
  </button>
);

export default Button; 