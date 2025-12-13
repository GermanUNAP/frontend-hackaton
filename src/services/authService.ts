import axios from 'axios';
import { LoginData, RegisterData, AuthResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
  return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
  return response.data;
};