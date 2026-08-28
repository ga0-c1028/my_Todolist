import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

afterEach(cleanup);

describe('ConfirmDialog', () => {
  it('renders nothing when open is false', () => {
    render(
      <ConfirmDialog open={false} title="제목" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title and description when open', () => {
    render(
      <ConfirmDialog
        open
        title="정말 삭제하시겠습니까?"
        description="이 작업은 되돌릴 수 없습니다."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument();
    expect(screen.getByText('이 작업은 되돌릴 수 없습니다.')).toBeInTheDocument();
  });

  it('does not render description paragraph when omitted', () => {
    render(<ConfirmDialog open title="제목" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(document.querySelector('.confirm-dialog-description')).not.toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog open title="제목" onConfirm={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByText('취소'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog open title="제목" onConfirm={onConfirm} onCancel={vi.fn()} />);
    await user.click(screen.getByText('확인'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when overlay is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog open title="제목" onConfirm={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole('presentation'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when clicking inside the dialog card', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog open title="제목입니다" onConfirm={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByText('제목입니다'));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('renders custom confirmLabel and cancelLabel', () => {
    render(
      <ConfirmDialog
        open
        title="제목"
        confirmLabel="삭제"
        cancelLabel="닫기"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('삭제')).toBeInTheDocument();
    expect(screen.getByText('닫기')).toBeInTheDocument();
    expect(screen.queryByText('확인')).not.toBeInTheDocument();
    expect(screen.queryByText('취소')).not.toBeInTheDocument();
  });
});
