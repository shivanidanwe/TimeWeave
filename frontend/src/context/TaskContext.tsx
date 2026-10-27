import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Task } from '../types';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  activeTimerTaskId: string | null;
  timerSeconds: number;
  isTaskModalOpen: boolean;
  selectedTaskDetail: Task | null;
  fetchTasks: (filters?: Record<string, string>) => Promise<void>;
  createTask: (data: any) => Promise<Task>;
  updateTask: (id: string, data: any) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string, actual_minutes?: number) => Promise<void>;
  startTimer: (id: string) => Promise<void>;
  stopTimer: (id: string) => Promise<void>;
  recordInterruption: (id: string, reason: string, duration_minutes: number) => Promise<void>;
  openTaskModal: () => void;
  closeTaskModal: () => void;
  openTaskDetail: (task: Task) => void;
  closeTaskDetail: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);

  const timerRef = useRef<any>(null);

  const fetchTasks = async (filters: Record<string, string> = {}) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await api.getTasks(filters);
      setTasks(data.tasks);

      // Check if any task currently has an active timer
      const active = data.tasks.find((t: Task) => t.is_active_timer === 1 || t.is_active_timer === true);
      if (active) {
        setActiveTimerTaskId(active.id);
        if (active.timer_started_at) {
          const elapsed = Math.floor((Date.now() - new Date(active.timer_started_at).getTime()) / 1000);
          setTimerSeconds(Math.max(0, elapsed));
        }
      } else {
        setActiveTimerTaskId(null);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    } else {
      setTasks([]);
      setActiveTimerTaskId(null);
    }
  }, [isAuthenticated]);

  // Live timer interval
  useEffect(() => {
    if (activeTimerTaskId) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimerSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTimerTaskId]);

  const createTask = async (data: any) => {
    const res = await api.createTask(data);
    await fetchTasks();
    return res.task;
  };

  const updateTask = async (id: string, data: any) => {
    await api.updateTask(id, data);
    await fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await api.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedTaskDetail?.id === id) {
      setSelectedTaskDetail(null);
    }
  };

  const completeTask = async (id: string, actual_minutes?: number) => {
    if (activeTimerTaskId === id) {
      await stopTimer(id);
    }
    await api.completeTask(id, actual_minutes);
    await fetchTasks();
  };

  const startTimer = async (id: string) => {
    await api.startTimer(id);
    setActiveTimerTaskId(id);
    setTimerSeconds(0);
    await fetchTasks();
  };

  const stopTimer = async (id: string) => {
    await api.stopTimer(id);
    setActiveTimerTaskId(null);
    setTimerSeconds(0);
    await fetchTasks();
  };

  const recordInterruption = async (id: string, reason: string, duration_minutes: number) => {
    await api.recordInterruption(id, { reason, duration_minutes });
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        activeTimerTaskId,
        timerSeconds,
        isTaskModalOpen,
        selectedTaskDetail,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        completeTask,
        startTimer,
        stopTimer,
        recordInterruption,
        openTaskModal: () => setIsTaskModalOpen(true),
        closeTaskModal: () => setIsTaskModalOpen(false),
        openTaskDetail: (t: Task) => setSelectedTaskDetail(t),
        closeTaskDetail: () => setSelectedTaskDetail(null)
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within a TaskProvider');
  return context;
};
