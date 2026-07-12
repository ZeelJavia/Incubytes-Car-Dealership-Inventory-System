import api from './client';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
  };
}

export const loginUser = async (data: LoginInput): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const registerUser = async (data: RegisterInput): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};
