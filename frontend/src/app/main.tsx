import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { QueryProvider } from './providers/QueryProvider';
import { LocaleProvider, ThemeProvider } from '../shared/config';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LocaleProvider>
        <QueryProvider>
          <App />
        </QueryProvider>
      </LocaleProvider>
    </ThemeProvider>
  </StrictMode>,
);
