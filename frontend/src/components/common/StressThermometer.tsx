import React from 'react';

interface StressThermometerProps {
  level: number;
}

const StressThermometer: React.FC<StressThermometerProps> = ({ level }) => {
  const getColor = (level: number) => {
    if (level < 30) return 'bg-green-500';
    if (level < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="relative w-8 h-32 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className={`absolute bottom-0 w-full transition-all duration-1000 ${getColor(level)}`}
        style={{ height: `${level}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference">
        {level}
      </div>
    </div>
  );
};

export default StressThermometer; 