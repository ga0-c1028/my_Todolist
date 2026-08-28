import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ErrorMessage } from './ErrorMessage';

afterEach(cleanup);

describe('ErrorMessage', () => {
  it('renders nothing when message is null', () => {
    const { container } = render(<ErrorMessage message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when message is undefined', () => {
    const { container } = render(<ErrorMessage message={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when message is empty string', () => {
    const { container } = render(<ErrorMessage message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the message text inside role="alert"', () => {
    render(<ErrorMessage message="문제가 발생했습니다" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('문제가 발생했습니다');
  });
});
