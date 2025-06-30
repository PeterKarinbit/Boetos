import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface FocusModeContextType {
  active: boolean;
  remaining: number; // seconds
  description: string;
  start: (duration: number, description?: string) => void;
  cancel: () => void;
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

export const FocusModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActive] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [description, setDescription] = useState('Focus Mode: Stay on task!');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!active || remaining <= 0) {
      setActive(false);
      setRemaining(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setActive(false);
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active, remaining]);

  const start = (duration: number, desc?: string) => {
    setRemaining(duration * 60); // duration in minutes
    setActive(true);
    setDescription(desc || 'Focus Mode: Stay on task!');
  };

  const cancel = () => {
    setActive(false);
    setRemaining(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <FocusModeContext.Provider value={{ active, remaining, description, start, cancel }}>
      {children}
    </FocusModeContext.Provider>
  );
};

export const useFocusMode = () => {
  const ctx = useContext(FocusModeContext);
  if (!ctx) throw new Error('useFocusMode must be used within FocusModeProvider');
  return ctx;
}; 