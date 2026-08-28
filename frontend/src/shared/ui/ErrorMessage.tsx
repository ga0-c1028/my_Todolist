import type { JSX } from 'react';
import './ErrorMessage.css';

interface ErrorMessageProps {
  message?: string | null;
}

export function ErrorMessage({ message }: ErrorMessageProps): JSX.Element | null {
  if (!message) {
    return null;
  }

  return (
    <p role="alert" className="error-message">
      {message}
    </p>
  );
}
