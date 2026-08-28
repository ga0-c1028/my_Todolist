import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryForm } from './CategoryForm';

function renderForm(props: Partial<Parameters<typeof CategoryForm>[0]> = {}) {
  const onSubmit = vi.fn();
  render(<CategoryForm onSubmit={onSubmit} {...props} />);
  return { onSubmit };
}

describe('CategoryForm', () => {
  it('shows the "새 카테고리 이름" label when onCancel is not provided', () => {
    renderForm();

    expect(screen.getByText('새 카테고리 이름 (1~20자)')).toBeInTheDocument();
  });

  it('does not show the label when onCancel is provided (inline-edit mode)', () => {
    renderForm({ onCancel: vi.fn() });

    expect(screen.queryByText('새 카테고리 이름 (1~20자)')).not.toBeInTheDocument();
  });

  it('pre-fills the input from initialName', () => {
    renderForm({ initialName: '업무' });

    expect(screen.getByRole('textbox')).toHaveValue('업무');
  });

  it('does not call onSubmit and shows a validation error when the name is empty', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(await screen.findByText('이름은 1자 이상 20자 이하로 입력해주세요.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit and shows a validation error when the name is 21+ characters', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByRole('textbox'), 'a'.repeat(21));
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(await screen.findByText('이름은 1자 이상 20자 이하로 입력해주세요.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with the entered name when valid', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByRole('textbox'), '새 카테고리');
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(onSubmit).toHaveBeenCalledWith('새 카테고리');
  });

  it('clears the input after a valid submit in create mode (no onCancel)', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole('textbox'), '새 카테고리');
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('does not clear the input after submit in inline-edit mode (onCancel provided)', async () => {
    const user = userEvent.setup();
    renderForm({ onCancel: vi.fn(), initialName: '업무' });

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '새이름');
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(screen.getByRole('textbox')).toHaveValue('새이름');
  });

  it('renders a cancel button and calls onCancel when clicked, given onCancel is provided', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderForm({ onCancel });

    const cancelButton = screen.getByRole('button', { name: '취소' });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('does not render a cancel button when onCancel is not provided', () => {
    renderForm();

    expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument();
  });

  it('displays the serverError message', () => {
    renderForm({ serverError: '이미 존재하는 이름입니다.' });

    expect(screen.getByText('이미 존재하는 이름입니다.')).toBeInTheDocument();
  });

  it('disables the submit button when isSubmitting is true', () => {
    renderForm({ isSubmitting: true });

    expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();
  });
});
