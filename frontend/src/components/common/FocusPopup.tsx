import React from 'react';
import Draggable from 'react-draggable';
import { useFocusMode } from '../../contexts/FocusModeContext';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const FocusPopup: React.FC = () => {
  const { remaining, description, cancel } = useFocusMode();

  return (
    <Draggable>
      <div className="fixed top-24 left-24 z-50 bg-white shadow-2xl rounded-2xl border border-purple-300 p-6 min-w-[260px] max-w-xs cursor-move flex flex-col items-center">
        <div className="text-purple-700 font-bold text-lg mb-2">Focus Mode</div>
        <div className="text-3xl font-mono text-purple-600 mb-2">{formatTime(remaining)}</div>
        <div className="text-slate-700 text-center mb-4 text-sm">{description}</div>
        <button
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition"
          onClick={cancel}
        >Cancel</button>
      </div>
    </Draggable>
  );
};

export default FocusPopup; 