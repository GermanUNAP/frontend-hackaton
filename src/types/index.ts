export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  user?: User;
  message?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error';
  show: boolean;
}