import { api, parseJsonOrThrow } from '../../../shared/api';
import type { User, UpdateUserRequest, SignupRequest, LoginRequest, LoginResponse } from '../model/types';

export async function updateMe(patch: UpdateUserRequest): Promise<User> {
  const response = await api.patch('/api/users/me', patch);
  return parseJsonOrThrow<User>(response);
}

export async function signup(payload: SignupRequest): Promise<User> {
  const response = await api.post('/api/auth/signup', payload);
  return parseJsonOrThrow<User>(response);
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const response = await api.post('/api/auth/login', payload);
  return parseJsonOrThrow<LoginResponse>(response);
}

export async function logout(refreshToken: string): Promise<void> {
  const response = await api.post('/api/auth/logout', { refreshToken });
  if (!response.ok) {
    await parseJsonOrThrow(response);
  }
}

export async function deleteMe(): Promise<void> {
  const response = await api.delete('/api/users/me');
  if (!response.ok) {
    await parseJsonOrThrow(response);
  }
}
