/**
 * API Endpoints for all entities
 * Typed API functions for each endpoint
 */

import api from './client';
import type {
  Suite,
  Task,
  Employee,
  Note,
  Notification,
  AuthResponse,
  LoginCredentials,
  NoteComment,
} from '../types/entities';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (credentials: LoginCredentials): Promise<AuthResponse> =>
    api.post<AuthResponse>('/auth/login', credentials),

  logout: (): Promise<void> =>
    api.post('/auth/logout'),

  refreshToken: (): Promise<{ token: string; refreshToken?: string }> =>
    api.post('/auth/refresh'),

  getCurrentUser: (): Promise<Employee> =>
    api.get<Employee>('/auth/me'),
};

// ─────────────────────────────────────────────────────────────────────────────
// SUITES ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export interface SuitesQueryParams {
  status?: string[];
  floor?: number[];
  type?: string[];
  search?: string;
}

export const suitesApi = {
  getAll: async (params?: SuitesQueryParams): Promise<Suite[]> => {
    const response = await api.get<{ data: Suite[]; meta: any }>('/suites', params);
    return response.data;
  },

  getById: (id: string): Promise<Suite> =>
    api.get<Suite>(`/suites/${id}`),

  create: (data: Partial<Suite>): Promise<Suite> =>
    api.post<Suite>('/suites', data),

  update: (id: string, data: Partial<Suite>): Promise<Suite> =>
    api.patch<Suite>(`/suites/${id}`, data),

  updateStatus: (id: string, status: string): Promise<Suite> =>
    api.patch<Suite>(`/suites/${id}/status`, { status }),

  delete: (id: string): Promise<void> =>
    api.delete(`/suites/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// TASKS ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export interface TasksQueryParams {
  status?: string[];
  type?: string[];
  priority?: string[];
  assignedTo?: string;
  suiteId?: string;
  startDate?: string;
  endDate?: string;
}

export const tasksApi = {
  getAll: async (params?: TasksQueryParams): Promise<Task[]> => {
    const response = await api.get<{ data: Task[]; meta: any }>('/tasks', params);
    return response.data;
  },

  getById: (id: string): Promise<Task> =>
    api.get<Task>(`/tasks/${id}`),

  getBySuite: async (suiteId: string): Promise<Task[]> => {
    const response = await api.get<{ data: Task[]; meta: any }>('/tasks', { suiteId });
    return response.data;
  },

  getByEmployee: async (employeeId: string): Promise<Task[]> => {
    const response = await api.get<{ data: Task[]; meta: any }>('/tasks', { assignedTo: employeeId });
    return response.data;
  },

  create: (data: Partial<Task>): Promise<Task> =>
    api.post<Task>('/tasks', data),

  update: (id: string, data: Partial<Task>): Promise<Task> =>
    api.patch<Task>(`/tasks/${id}`, data),

  updateStatus: (id: string, status: string): Promise<Task> =>
    api.patch<Task>(`/tasks/${id}/status`, { status }),

  assign: (id: string, employeeId: string): Promise<Task> =>
    api.patch<Task>(`/tasks/${id}/assign`, { assignedToId: employeeId }),

  delete: (id: string): Promise<void> =>
    api.delete(`/tasks/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEES ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export interface EmployeesQueryParams {
  status?: string[];
  role?: string[];
  department?: string[];
  isOnDuty?: boolean;
}

export const employeesApi = {
  getAll: async (params?: EmployeesQueryParams): Promise<Employee[]> => {
    const response = await api.get<{ data: Employee[]; meta: any }>('/employees', params);
    return response.data;
  },

  getById: (id: string): Promise<Employee> =>
    api.get<Employee>(`/employees/${id}`),

  getOnDuty: async (): Promise<Employee[]> => {
    const response = await api.get<{ data: Employee[]; meta: any }>('/employees', { isOnDuty: true });
    return response.data;
  },

  create: (data: Partial<Employee>): Promise<Employee> =>
    api.post<Employee>('/employees', data),

  update: (id: string, data: Partial<Employee>): Promise<Employee> =>
    api.patch<Employee>(`/employees/${id}`, data),

  delete: (id: string): Promise<void> =>
    api.delete(`/employees/${id}`),

  clockIn: (id: string): Promise<Employee> =>
    api.post<Employee>(`/employees/${id}/clock-in`),

  clockOut: (id: string): Promise<Employee> =>
    api.post<Employee>(`/employees/${id}/clock-out`),
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTES ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export interface NotesQueryParams {
  type?: string[];
  priority?: string[];
  relatedSuiteId?: string;
  relatedTaskId?: string;
  visibility?: string;
  archived?: boolean;
  pinned?: boolean;
}

export const notesApi = {
  getAll: async (params?: NotesQueryParams): Promise<Note[]> => {
    const response = await api.get<{ data: Note[]; meta: any }>('/notes', params);
    return response.data;
  },

  getById: (id: string): Promise<Note> =>
    api.get<Note>(`/notes/${id}`),

  getBySuite: async (suiteId: string): Promise<Note[]> => {
    const response = await api.get<{ data: Note[]; meta: any }>('/notes', { relatedSuiteId: suiteId });
    return response.data;
  },

  getByTask: async (taskId: string): Promise<Note[]> => {
    const response = await api.get<{ data: Note[]; meta: any }>('/notes', { relatedTaskId: taskId });
    return response.data;
  },

  create: (data: Partial<Note>): Promise<Note> =>
    api.post<Note>('/notes', data),

  update: (id: string, data: Partial<Note>): Promise<Note> =>
    api.patch<Note>(`/notes/${id}`, data),

  delete: (id: string): Promise<void> =>
    api.delete(`/notes/${id}`),

  togglePin: (id: string): Promise<Note> =>
    api.patch<Note>(`/notes/${id}/pin`),

  archive: (id: string): Promise<Note> =>
    api.patch<Note>(`/notes/${id}/archive`),

  addComment: (id: string, text: string): Promise<NoteComment> =>
    api.post<NoteComment>(`/notes/${id}/comments`, { text }),

  markAsRead: (id: string): Promise<void> =>
    api.post(`/notes/${id}/read`),
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export const notificationsApi = {
  getAll: (): Promise<Notification[]> =>
    api.get<Notification[]>('/notifications'),

  getUnread: (): Promise<Notification[]> =>
    api.get<Notification[]>('/notifications', { read: false }),

  markAsRead: (id: string): Promise<Notification> =>
    api.patch<Notification>(`/notifications/${id}/read`),

  markAllAsRead: (): Promise<void> =>
    api.post('/notifications/read-all'),

  delete: (id: string): Promise<void> =>
    api.delete(`/notifications/${id}`),

  create: (data: Partial<Notification>): Promise<Notification> =>
    api.post<Notification>('/notifications', data),
};

