const API_BASE_URL = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('timeweave_token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      // Token expired or invalid
      localStorage.removeItem('timeweave_token');
      localStorage.removeItem('timeweave_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data as T;
  }

  // Auth
  async register(body: any) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(body) });
  }

  async login(body: any) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(body: any) {
    return this.request('/auth/profile', { method: 'PATCH', body: JSON.stringify(body) });
  }

  async changePassword(body: any) {
    return this.request('/auth/change-password', { method: 'POST', body: JSON.stringify(body) });
  }

  async deleteAccount() {
    return this.request('/auth/account', { method: 'DELETE' });
  }

  // Tasks
  async getTasks(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/tasks${query ? '?' + query : ''}`);
  }

  async getTaskById(id: string) {
    return this.request(`/tasks/${id}`);
  }

  async createTask(body: any) {
    return this.request('/tasks', { method: 'POST', body: JSON.stringify(body) });
  }

  async updateTask(id: string, body: any) {
    return this.request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }

  async deleteTask(id: string) {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  async completeTask(id: string, actual_duration_minutes?: number) {
    return this.request(`/tasks/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ actual_duration_minutes })
    });
  }

  async startTimer(id: string) {
    return this.request(`/tasks/${id}/start-timer`, { method: 'POST' });
  }

  async stopTimer(id: string) {
    return this.request(`/tasks/${id}/stop-timer`, { method: 'POST' });
  }

  async recordInterruption(id: string, body: any) {
    return this.request(`/tasks/${id}/interruptions`, { method: 'POST', body: JSON.stringify(body) });
  }

  // Schedules
  async generateSchedule(target_date?: string, preferences_override?: any, task_ids?: string[]) {
    return this.request('/schedules/generate', {
      method: 'POST',
      body: JSON.stringify({ target_date, preferences_override, task_ids })
    });
  }

  async acceptSchedule(schedule_version_id: string) {
    return this.request(`/schedules/${schedule_version_id}/accept`, { method: 'POST' });
  }

  async getActiveSchedule(target_date?: string) {
    const q = target_date ? `?target_date=${target_date}` : '';
    return this.request(`/schedules/active${q}`);
  }

  async updateScheduleBlock(blockId: string, body: any) {
    return this.request(`/schedules/blocks/${blockId}`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  // Focus
  async getFocusSessions() {
    return this.request('/focus/sessions');
  }

  async createFocusSession(body: any) {
    return this.request('/focus/sessions', { method: 'POST', body: JSON.stringify(body) });
  }

  async updateFocusSession(id: string, body: any) {
    return this.request(`/focus/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }

  // Analytics
  async getOverviewAnalytics() {
    return this.request('/analytics/overview');
  }

  async getWorkloadAnalytics() {
    return this.request('/analytics/workload');
  }

  // History
  async getHistory(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/history${query ? '?' + query : ''}`);
  }

  // Notifications
  async getNotifications(filter?: string) {
    const q = filter ? `?filter=${filter}` : '';
    return this.request(`/notifications${q}`);
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async clearNotifications() {
    return this.request('/notifications', { method: 'DELETE' });
  }

  // Preferences
  async getPreferences() {
    return this.request('/preferences');
  }

  async updatePreferences(body: any) {
    return this.request('/preferences', { method: 'PUT', body: JSON.stringify(body) });
  }

  // Chat
  async sendChatMessage(message: string, conversation_history?: any[]) {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_history })
    });
  }
}

export const api = new ApiClient();
