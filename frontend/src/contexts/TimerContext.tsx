import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { updateBoetosTaskState, getBoetosTaskHistory } from '../services/api';
import { useUser } from './UserContext';

interface BoetosTask {
  id?: string;
  title: string;
  duration: number; // in minutes
  start: Date;
  category: string;
}

interface TimerContextType {
  activeTask: BoetosTask | null;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  cancelCountdown: number;
  startTimer: (task: BoetosTask) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  requestCancel: () => void;
  confirmCancel: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return ctx;
}

function TimerProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();
  const [activeTask, setActiveTask] = useState<BoetosTask | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cancelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic
  useEffect(() => {
    if (isRunning && !isPaused && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((s) => s - 1);
      }, 1000);
    } else if (remainingSeconds === 0 && isRunning) {
      setIsRunning(false);
      setActiveTask(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused, remainingSeconds]);

  // Cancel countdown logic
  useEffect(() => {
    if (cancelCountdown > 0) {
      cancelIntervalRef.current = setInterval(() => {
        setCancelCountdown((c) => c - 1);
      }, 1000);
    } else if (cancelCountdown === 0 && isRunning) {
      setIsRunning(false);
      setActiveTask(null);
      setRemainingSeconds(0);
      setIsPaused(false);
      if (cancelIntervalRef.current) clearInterval(cancelIntervalRef.current);
    }
    return () => {
      if (cancelIntervalRef.current) clearInterval(cancelIntervalRef.current);
    };
  }, [cancelCountdown, isRunning]);

  // Fetch task history when user is authenticated
  useEffect(() => {
    if (!user || isLoading) return;
    
    const fetchHistory = async () => {
      try {
        const history = await getBoetosTaskHistory();
        const lastTask = history.find((t: any) => t.boetos_task_state === 'active' || t.boetos_task_state === 'paused');
        if (lastTask) {
          setActiveTask({
            id: lastTask.id,
            title: lastTask.title,
            duration: (new Date(lastTask.end_time).getTime() - new Date(lastTask.start_time).getTime()) / 60000,
            start: new Date(lastTask.start_time),
            category: lastTask.event_type || 'Task',
          });
          setRemainingSeconds(
            lastTask.timer_state?.remainingSeconds ||
            Math.max(0, Math.floor((new Date(lastTask.end_time).getTime() - Date.now()) / 1000))
          );
          setIsRunning(lastTask.boetos_task_state === 'active');
          setIsPaused(lastTask.boetos_task_state === 'paused');
        }
      } catch (err: any) { 
        if (err?.response?.status !== 401 && err?.message !== 'Token expired' && err?.message !== 'Token refresh failed') {
          console.error('Failed to fetch Boetos task history:', err);
        }
      }
    };

    fetchHistory();
  }, [user, isLoading]);

  const startTimer = async (task: BoetosTask) => {
    setActiveTask(task);
    setRemainingSeconds(task.duration * 60);
    setIsRunning(true);
    setIsPaused(false);
    setCancelCountdown(0);
    if (task.id) {
      await updateBoetosTaskState(task.id, {
        boetos_task_state: 'active',
        timer_state: { remainingSeconds: task.duration * 60, lastStarted: new Date() },
      });
    }
  };

  const pauseTimer = async () => {
    setIsPaused(true);
    if (activeTask?.id) {
      await updateBoetosTaskState(activeTask.id, {
        boetos_task_state: 'paused',
        timer_state: { remainingSeconds },
      });
    }
  };

  const resumeTimer = async () => {
    setIsPaused(false);
    if (activeTask?.id) {
      await updateBoetosTaskState(activeTask.id, {
        boetos_task_state: 'active',
        timer_state: { remainingSeconds, lastStarted: new Date() },
      });
    }
  };

  const requestCancel = () => {
    setCancelCountdown(5);
  };

  const confirmCancel = async () => {
    setCancelCountdown(0);
    setIsRunning(false);
    setActiveTask(null);
    setRemainingSeconds(0);
    setIsPaused(false);
    if (activeTask?.id) {
      await updateBoetosTaskState(activeTask.id, {
        boetos_task_state: 'cancelled',
        timer_state: { remainingSeconds: 0 },
      });
    }
  };

  const value = {
    activeTask,
    remainingSeconds,
    isRunning,
    isPaused,
    cancelCountdown,
    startTimer,
    pauseTimer,
    resumeTimer,
    requestCancel,
    confirmCancel,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export { useTimer, TimerProvider }; 