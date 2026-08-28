import type { ButtonHTMLAttributes, JSX } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', className, ...rest }: ButtonProps): JSX.Element {
  const classes = ['button', `button--${variant}`, className].filter(Boolean).join(' ');
  return <button className={classes} {...rest} />;
}
