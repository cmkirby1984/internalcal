'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { WebSocketManager, ConnectionState, WebSocketMessage } from './websocket-manager';
import {
  useAuthStore,
  useSuitesStore,
  useTasksStore,
  useEmployeesStore,
  useNotesStore,
  useUIStore,
  useSyncStore,
} from '@/lib/store';

interface WebSocketContextValue {
  connectionState: ConnectionState;
  isConnected: boolean;
  subscribeSuite: (suiteId: string) => void;
  unsubscribeSuite: (suiteId: string) => void;
  subscribeTask: (taskId: string) => void;
  unsubscribeTask: (taskId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');

  // Auth state
  const { isAuthenticated, token, currentUser } = useAuthStore();

  // Store actions for updating local state
  const updateSuiteLocal = useSuitesStore((state) => state.updateSuiteLocal);
  const addSuite = useSuitesStore((state) => state.addSuite);
  const updateTaskLocal = useTasksStore((state) => state.updateTaskLocal);
  const addTask = useTasksStore((state) => state.addTask);
  const updateTaskGroupings = useTasksStore((state) => state.updateTaskGroupings);
  const updateEmployeeLocal = useEmployeesStore((state) => state.updateEmployeeLocal);
  const updateEmployeeGroupings = useEmployeesStore((state) => state.updateEmployeeGroupings);
  const addNote = useNotesStore((state) => state.addNote);
  const updateNoteGroupings = useNotesStore((state) => state.updateNoteGroupings);
  const showToast = useUIStore((state) => state.showToast);
  const setOnline = useSyncStore((state) => state.setOnline);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect if not authenticated
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnect();
        wsManagerRef.current = null;
      }
      return;
    }

    // Initialize WebSocket connection
    wsManagerRef.current = new WebSocketManager(token);

    // Set up event handlers
    const wsManager = wsManagerRef.current;

    // Connection state changes
    wsManager.on('connectionStateChange', (state) => {
      setConnectionState(state as ConnectionState);
    });

    wsManager.on('connected', () => {
      setOnline(true);
      showToast({
        type: 'SUCCESS',
        message: 'Connected to real-time updates',
        duration: 2000,
      });
    });

    wsManager.on('disconnected', () => {
      setOnline(false);
    });

    wsManager.on('reconnect_failed', () => {
      showToast({
        type: 'ERROR',
        message: 'Unable to connect to real-time updates. Some features may be delayed.',
        duration: 5000,
      });
    });

    // Suite events
    wsManager.on('suite_created', (data: unknown) => {
      const message = data as WebSocketMessage;
      if (message.updatedBy !== currentUser?.id) {
        const suite = message.data.suite as Record<string, unknown>;
        addSuite(suite as any);
      }
    });

    wsManager.on('suite_updated', (data: unknown) => {
      const message = data as WebSocketMessage;
      if (message.updatedBy !== currentUser?.id) {
        const { suiteId, changes } = message.data;
        updateSuiteLocal(suiteId as string, changes as any);
      }
    });

    // Task events
    wsManager.on('task_created', (data: unknown) => {
      const message = data as WebSocketMessage;
      if (message.updatedBy !== currentUser?.id) {
        const task = message.data.task as Record<string, unknown>;
        addTask(task as any);
        updateTaskGroupings();
      }
    });

    wsManager.on('task_updated', (data: unknown) => {
      const message = data as WebSocketMessage;
      if (message.updatedBy !== currentUser?.id) {
        const { taskId, changes } = message.data;
        updateTaskLocal(taskId as string, changes as any);
        updateTaskGroupings();
      }
    });

    wsManager.on('task_assigned', (data: unknown) => {
      const message = data as { data: { taskId: string; taskTitle: string } };
      showToast({
        type: 'INFO',
        message: `New task assigned: ${message.data.taskTitle}`,
        duration: 5000,
      });
    });

    wsManager.on('task_completed', (data: unknown) => {
      const message = data as WebSocketMessage;
      const { taskId } = message.data;
      updateTaskLocal(taskId as string, { status: 'COMPLETED' } as any);
      updateTaskGroupings();
    });

    wsManager.on('emergency_task', (data: unknown) => {
      const message = data as WebSocketMessage;
      const task = message.data.task as { title: string; suiteNumber?: string };
      showToast({
        type: 'ERROR',
        message: `🚨 EMERGENCY: ${task.title}${task.suiteNumber ? ` - Suite ${task.suiteNumber}` : ''}`,
        duration: 10000,
      });
    });

    // Note events
    wsManager.on('note_created', (data: unknown) => {
      const message = data as WebSocketMessage;
      if (message.updatedBy !== currentUser?.id) {
        const note = message.data.note as Record<string, unknown>;
        addNote(note as any);
        updateNoteGroupings();
      }
    });

    // Employee events
    wsManager.on('employee_status_changed', (data: unknown) => {
      const message = data as WebSocketMessage;
      const { employeeId, changes } = message.data;
      updateEmployeeLocal(employeeId as string, changes as any);
      updateEmployeeGroupings();
    });

    // Connect
    wsManager.connect();

    // Cleanup on unmount
    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnect();
        wsManagerRef.current = null;
      }
    };
  }, [
    isAuthenticated,
    token,
    currentUser?.id,
    addSuite,
    updateSuiteLocal,
    addTask,
    updateTaskLocal,
    updateTaskGroupings,
    addNote,
    updateNoteGroupings,
    updateEmployeeLocal,
    updateEmployeeGroupings,
    showToast,
    setOnline,
  ]);

  // Update token when it changes
  useEffect(() => {
    if (wsManagerRef.current && token) {
      wsManagerRef.current.updateToken(token);
    }
  }, [token]);

  const contextValue: WebSocketContextValue = {
    connectionState,
    isConnected: connectionState === 'CONNECTED',
    subscribeSuite: (suiteId: string) => wsManagerRef.current?.subscribeSuite(suiteId),
    unsubscribeSuite: (suiteId: string) => wsManagerRef.current?.unsubscribeSuite(suiteId),
    subscribeTask: (taskId: string) => wsManagerRef.current?.subscribeTask(taskId),
    unsubscribeTask: (taskId: string) => wsManagerRef.current?.unsubscribeTask(taskId),
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

