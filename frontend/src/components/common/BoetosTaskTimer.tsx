import React, { useEffect, useState } from 'react';
import { useTimer } from '../../contexts/TimerContext';
import { Rocket, Pause, Play, XCircle } from 'lucide-react';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const BoetosTaskTimer: React.FC = () => {
  const {
    activeTask,
    remainingSeconds,
    isRunning,
    isPaused,
    cancelCountdown,
    pauseTimer,
    resumeTimer,
    requestCancel,
    confirmCancel,
  } = useTimer();
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (isRunning && remainingSeconds === 0 && activeTask) {
      setCompleted(true);
      setTimeout(() => setCompleted(false), 4000);
    }
  }, [isRunning, remainingSeconds, activeTask]);

  if (!activeTask && !completed) return null;

  const percent = activeTask ? 100 - (remainingSeconds / (activeTask.duration * 60)) * 100 : 100;

  return (
    <div className="fixed bottom-8 left-8 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 flex flex-col items-center border-2 border-blue-500/30 min-w-[260px]">
        {completed ? (
          <div className="flex flex-col items-center animate-bounceIn">
            <Rocket className="h-10 w-10 text-green-500 animate-bounce mb-2" />
            <div className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">Task Complete!</div>
            <div className="text-slate-700 dark:text-slate-200 text-sm">Great job on your focus session 🚀</div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="h-6 w-6 text-blue-500 animate-pulse" />
              <span className="font-semibold text-blue-700 dark:text-blue-300">Boetos Focus Timer</span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mb-1">{activeTask?.title}</div>
            <div className="text-sm text-slate-500 dark:text-slate-300 mb-2">{activeTask?.category}</div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-300 mb-2">{formatTime(remainingSeconds)}</div>
            {cancelCountdown > 0 ? (
              <div className="flex flex-col items-center mt-2">
                <div className="text-red-500 font-semibold mb-1">Cancelling in {cancelCountdown}...</div>
                <button
                  className="px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-semibold transition-all mt-1"
                  onClick={confirmCancel}
                >
                  Undo Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-3 mt-2">
                {isPaused ? (
                  <button
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all flex items-center gap-1"
                    onClick={resumeTimer}
                  >
                    <Play className="h-4 w-4" /> Resume
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-all flex items-center gap-1"
                    onClick={pauseTimer}
                  >
                    <Pause className="h-4 w-4" /> Pause
                  </button>
                )}
                <button
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all flex items-center gap-1"
                  onClick={requestCancel}
                >
                  <XCircle className="h-4 w-4" /> Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounceIn {
          animation: bounceIn 0.8s;
        }
      `}</style>
    </div>
  );
};

export default BoetosTaskTimer; 