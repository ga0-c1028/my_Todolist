import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { TodoForm } from './TodoForm';
import type { Category } from '../../../entities/category';

vi.mock('../../../entities/category', () => ({
  useCategoriesQuery: vi.fn(),
}));

import { useCategoriesQuery } from '../../../entities/category';

const fakeCategories: Category[] = [
  { id: 'c1', userId: 'u1', name: '업무', isDefault: false },
  { id: 'c2', userId: 'u1', name: '개인', isDefault: true },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function renderForm(props: Partial<Parameters<typeof TodoForm>[0]> & { mode?: 'create' | 'edit' } = {}) {
  const onSubmit = vi.fn();
  const Wrapper = createWrapper();
  render(
    <TodoForm mode={props.mode ?? 'create'} onSubmit={onSubmit} {...props} />,
    { wrapper: Wrapper },
  );
  return { onSubmit };
}

describe('TodoForm', () => {
  beforeEach(() => {
    vi.mocked(useCategoriesQuery).mockReturnValue({
      data: fakeCategories,
    } as ReturnType<typeof useCategoriesQuery>);
  });

  it('renders title/description/category/date-picker fields, and hides the completed checkbox in create mode', () => {
    renderForm({ mode: 'create' });

    expect(screen.getByLabelText('제목')).toBeInTheDocument();
    expect(screen.getByLabelText('설명 (선택)')).toBeInTheDocument();
    expect(screen.getByLabelText('카테고리')).toBeInTheDocument();
    expect(screen.getByText(/시작일자/)).toBeInTheDocument();
    expect(screen.getByText(/종료일자/)).toBeInTheDocument();
    expect(screen.queryByLabelText('완료')).not.toBeInTheDocument();
  });

  it('shows the completed checkbox in edit mode', () => {
    renderForm({ mode: 'edit' });

    expect(screen.getByLabelText('완료')).toBeInTheDocument();
  });

  it('pre-fills inputs from initialValues', () => {
    renderForm({
      mode: 'edit',
      initialValues: {
        title: '기존 제목',
        description: '기존 설명',
        categoryId: 'c1',
        startDate: '2026-01-01',
        endDate: '2026-01-05',
        isCompleted: true,
      },
    });

    expect(screen.getByLabelText('제목')).toHaveValue('기존 제목');
    expect(screen.getByLabelText('설명 (선택)')).toHaveValue('기존 설명');
    expect(screen.getByLabelText('카테고리')).toHaveValue('c1');
    expect(screen.getByLabelText('완료')).toBeChecked();
    expect(screen.getByText(/시작일자 2026-01-01/)).toBeInTheDocument();
    expect(screen.getByText(/종료일자 2026-01-05/)).toBeInTheDocument();
  });

  it('does not call onSubmit and shows a validation error when title is empty', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('제목은 1자 이상 100자 이하로 입력해주세요.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit and shows a validation error when no dates are selected', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText('제목'), '할일 제목');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(
      await screen.findByText('시작일자와 종료일자를 모두 선택해주세요.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit and shows a validation error when end date is before start date', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      initialValues: { startDate: '2026-01-10', endDate: '2026-01-05' },
    });

    await user.type(screen.getByLabelText('제목'), '할일 제목');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(
      await screen.findByText('종료일자는 시작일자보다 빠를 수 없습니다.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with the expected values when everything is valid', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText('제목'), '할일 제목');
    await user.type(screen.getByLabelText('설명 (선택)'), '할일 설명');

    await user.click(screen.getByText(/시작일자/));
    await user.click(screen.getByText('5'));
    await user.click(screen.getByText('10'));

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const values = onSubmit.mock.calls[0][0];
    expect(values.title).toBe('할일 제목');
    expect(values.description).toBe('할일 설명');
    expect(values.categoryId).toBe('');
    expect(values.startDate).toEqual(expect.any(String));
    expect(values.endDate).toEqual(expect.any(String));
    expect(values.isCompleted).toBe(false);
  });

  it('includes the selected categoryId when a category is chosen', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      initialValues: { startDate: '2026-01-05', endDate: '2026-01-10' },
    });

    await user.type(screen.getByLabelText('제목'), '할일 제목');
    await user.selectOptions(screen.getByLabelText('카테고리'), 'c1');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'c1' }),
    );
  });

  it('toggles the completed checkbox in edit mode and includes it in onSubmit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      mode: 'edit',
      initialValues: { startDate: '2026-01-05', endDate: '2026-01-10' },
    });

    await user.type(screen.getByLabelText('제목'), '할일 제목');
    await user.click(screen.getByLabelText('완료'));
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ isCompleted: true }),
    );
  });

  it('displays the serverError message', () => {
    renderForm({ serverError: '서버 오류가 발생했습니다.' });

    expect(screen.getByRole('alert')).toHaveTextContent('서버 오류가 발생했습니다.');
  });

  it('disables the submit button when isSubmitting is true', () => {
    renderForm({ isSubmitting: true });

    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  });
});
