import { useQuery } from '@tanstack/react-query';
import { listCategories } from './categoryApi';

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });
}
