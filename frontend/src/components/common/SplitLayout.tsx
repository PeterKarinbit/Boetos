import React from 'react';

interface SplitLayoutProps {
  children: React.ReactNode;
}

const SplitLayout: React.FC<SplitLayoutProps> = ({ children }) => (
  <div className="min-h-screen w-full flex flex-col md:flex-row bg-gradient-to-br from-[#1A0A00] via-[#2C1100] to-[#1F0D00]">
    {/* Left: Illustration + tagline */}
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#1A0A00]">
      <div className="w-72 h-72 bg-[#2C1100] rounded-3xl shadow-lg flex items-center justify-center mb-8">
        {/* Placeholder for illustration/image */}
        <span className="text-6xl text-[#FFB347]">🧠</span>
      </div>
      <div className="text-[#FFB347] text-lg font-semibold text-center">
        Empowered by AI. Designed for your clarity.
      </div>
    </div>
    {/* Right: Content */}
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">{children}</div>
    </div>
  </div>
);

export default SplitLayout; 