import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthResponse, LoginCredentials, SignupData, User, Task, Department, ApprovalTemplate, DashboardStats, ApiResponse, Notification, Comment, Attachment, Approval } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const { accessToken } = response.data;
              
              localStorage.setItem('accessToken', accessToken);
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(refreshToken: string): Promise<AxiosResponse<{ accessToken: string }>> {
    return this.api.post('/auth/refresh', { refreshToken });
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AxiosResponse<AuthResponse>> {
    return this.api.post('/auth/login', credentials);
  }

  async signup(data: SignupData): Promise<AxiosResponse<AuthResponse>> {
    return this.api.post('/auth/signup', data);
  }

  async getProfile(): Promise<AxiosResponse<User>> {
    return this.api.get('/auth/profile');
  }

  // User endpoints
  async getUsers(): Promise<AxiosResponse<User[]>> {
    return this.api.get('/users');
  }

  async getUser(id: number): Promise<AxiosResponse<User>> {
    return this.api.get(`/users/${id}`);
  }

  async createUser(userData: Partial<User>): Promise<AxiosResponse<User>> {
    return this.api.post('/users', userData);
  }

  async updateUser(id: number, userData: Partial<User>): Promise<AxiosResponse<User>> {
    return this.api.put(`/users/${id}`, userData);
  }

  async deleteUser(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/users/${id}`);
  }

  // Department endpoints
  async getDepartments(): Promise<AxiosResponse<Department[]>> {
    return this.api.get('/departments');
  }

  async getDepartment(id: number): Promise<AxiosResponse<Department>> {
    return this.api.get(`/departments/${id}`);
  }

  async createDepartment(departmentData: Partial<Department>): Promise<AxiosResponse<Department>> {
    return this.api.post('/departments', departmentData);
  }

  async updateDepartment(id: number, departmentData: Partial<Department>): Promise<AxiosResponse<Department>> {
    return this.api.put(`/departments/${id}`, departmentData);
  }

  async deleteDepartment(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/departments/${id}`);
  }

  // Task endpoints
  async getTasks(): Promise<AxiosResponse<Task[]>> {
    return this.api.get('/tasks');
  }

  async getTask(id: number): Promise<AxiosResponse<Task>> {
    return this.api.get(`/tasks/${id}`);
  }

  async createTask(taskData: Partial<Task>): Promise<AxiosResponse<Task>> {
    return this.api.post('/tasks', taskData);
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<AxiosResponse<Task>> {
    return this.api.put(`/tasks/${id}`, taskData);
  }

  async deleteTask(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/tasks/${id}`);
  }

  // Approval endpoints
  async getApprovalBucket(): Promise<AxiosResponse<Task[]>> {
    return this.api.get('/approvals/bucket');
  }

  async getTaskApprovers(taskId: number): Promise<AxiosResponse<any[]>> {
    return this.api.get(`/approvals/tasks/${taskId}/approvers`);
  }

  async submitForApproval(taskId: number): Promise<AxiosResponse<Task>> {
    return this.api.post(`/approvals/tasks/${taskId}/submit`);
  }

  async approveTask(taskId: number, approvalData: { status: 'APPROVED' | 'REJECTED'; comments?: string }): Promise<AxiosResponse<Task>> {
    return this.api.post(`/approvals/tasks/${taskId}/approve`, approvalData);
  }

  // Approval Template endpoints
  async getApprovalTemplates(): Promise<AxiosResponse<ApprovalTemplate[]>> {
    return this.api.get('/approval-templates');
  }

  async getApprovalTemplate(id: number): Promise<AxiosResponse<ApprovalTemplate>> {
    return this.api.get(`/approval-templates/${id}`);
  }

  async createApprovalTemplate(templateData: Partial<ApprovalTemplate>): Promise<AxiosResponse<ApprovalTemplate>> {
    return this.api.post('/approval-templates', templateData);
  }

  async updateApprovalTemplate(id: number, templateData: Partial<ApprovalTemplate>): Promise<AxiosResponse<ApprovalTemplate>> {
    return this.api.put(`/approval-templates/${id}`, templateData);
  }

  async deleteApprovalTemplate(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/approval-templates/${id}`);
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<AxiosResponse<DashboardStats>> {
    return this.api.get('/dashboard/stats');
  }

  async getRecentTasks(): Promise<AxiosResponse<Task[]>> {
    return this.api.get('/dashboard/recent-tasks');
  }

  async getPendingApprovals(): Promise<AxiosResponse<Task[]>> {
    return this.api.get('/dashboard/pending-approvals');
  }

  // Profile endpoints
  async updateProfile(data: { name: string; email: string }): Promise<AxiosResponse<User>> {
    return this.api.put('/auth/profile', data);
  }

  async getUserTasks(): Promise<AxiosResponse<Task[]>> {
    return this.api.get('/auth/tasks');
  }

  // Notification endpoints
  async getNotifications(): Promise<AxiosResponse<Notification[]>> {
    return this.api.get('/notifications');
  }

  async markNotificationAsRead(notificationId: string): Promise<AxiosResponse<void>> {
    return this.api.put(`/notifications/${notificationId}/read`);
  }

  async markAllNotificationsAsRead(): Promise<AxiosResponse<void>> {
    return this.api.put('/notifications/read-all');
  }

  // Task comment endpoints
  async getTaskComments(taskId: string): Promise<AxiosResponse<Comment[]>> {
    return this.api.get(`/tasks/${taskId}/comments`);
  }

  async addComment(taskId: string, content: string): Promise<AxiosResponse<Comment>> {
    return this.api.post(`/tasks/${taskId}/comments`, { content });
  }

  // Task attachment endpoints
  async getTaskAttachments(taskId: string): Promise<AxiosResponse<Attachment[]>> {
    return this.api.get(`/tasks/${taskId}/attachments`);
  }

  async uploadAttachment(taskId: string, file: File): Promise<AxiosResponse<Attachment>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async deleteAttachment(attachmentId: string): Promise<AxiosResponse<void>> {
    return this.api.delete(`/attachments/${attachmentId}`);
  }

  // Approval endpoints (extended)
  async getMyApprovals(): Promise<AxiosResponse<Approval[]>> {
    return this.api.get('/approvals/my-approvals');
  }

  async getApprovalHistory(): Promise<AxiosResponse<Approval[]>> {
    return this.api.get('/approvals/history');
  }

  async approveTask(taskId: string, comment: string): Promise<AxiosResponse<Approval>> {
    return this.api.post(`/approvals/tasks/${taskId}/approve`, { comment });
  }

  async rejectTask(taskId: string, comment: string): Promise<AxiosResponse<Approval>> {
    return this.api.post(`/approvals/tasks/${taskId}/reject`, { comment });
  }
}

export const apiService = new ApiService();
export const authAPI = apiService; // Alias for auth operations