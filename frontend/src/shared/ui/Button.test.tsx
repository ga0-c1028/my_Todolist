import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

afterEach(cleanup);

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>클릭</Button>);
    expect(screen.getByText('클릭')).toBeInTheDocument();
  });

  it('applies primary class by default', () => {
    render(<Button>버튼</Button>);
    expect(screen.getByText('버튼')).toHaveClass('button--primary');
  });

  it('applies secondary class when variant="secondary"', () => {
    render(<Button variant="secondary">버튼</Button>);
    expect(screen.getByText('버튼')).toHaveClass('button--secondary');
    expect(screen.getByText('버튼')).not.toHaveClass('button--primary');
  });

  it('fires onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>버튼</Button>);
    await user.click(screen.getByText('버튼'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders disabled attribute and does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={onClick} disabled>
        버튼
      </Button>,
    );
    const button = screen.getByText('버튼');
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('merges custom className with variant class', () => {
    render(<Button className="custom-class">버튼</Button>);
    const button = screen.getByText('버튼');
    expect(button).toHaveClass('button--primary');
    expect(button).toHaveClass('custom-class');
  });
});
