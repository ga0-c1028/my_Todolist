import { api, parseJsonOrThrow } from '../../../shared/api';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../model/types';

export async function listCategories(): Promise<Category[]> {
  const response = await api.get('/api/categories');
  return parseJsonOrThrow<Category[]>(response);
}

export async function createCategory(payload: CreateCategoryRequest): Promise<Category> {
  const response = await api.post('/api/categories', payload);
  return parseJsonOrThrow<Category>(response);
}

export async function updateCategory(id: string, payload: UpdateCategoryRequest): Promise<Category> {
  const response = await api.patch(`/api/categories/${id}`, payload);
  return parseJsonOrThrow<Category>(response);
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await api.delete(`/api/categories/${id}`);
  if (!response.ok) {
    await parseJsonOrThrow(response);
  }
}
