import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory, updateCategory, deleteCategory } from '../../../entities/category';
import { getEnv } from '../../../shared/config';
import type { CreateCategoryRequest, UpdateCategoryRequest } from '../../../entities/category';

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) => createCategory(payload),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (getEnv().isDev) console.log('[category-manage] 카테고리 생성 성공:', category.id);
    },
    onError: (error) => {
      if (getEnv().isDev) console.log('[category-manage] 카테고리 생성 실패:', error);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryRequest }) => updateCategory(id, payload),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (getEnv().isDev) console.log('[category-manage] 카테고리 수정 성공:', category.id);
    },
    onError: (error) => {
      if (getEnv().isDev) console.log('[category-manage] 카테고리 수정 실패:', error);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] }); // BR-5/SC-02: 삭제된 카테고리의 할일은 서버에서 기본 카테고리로 이관됨
      if (getEnv().isDev) console.log('[category-manage] 카테고리 삭제 성공:', id);
    },
    onError: (error) => {
      if (getEnv().isDev) console.log('[category-manage] 카테고리 삭제 실패:', error);
    },
  });
}
