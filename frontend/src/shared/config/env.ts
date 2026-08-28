export function getEnv() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error('Missing required environment variable: VITE_API_BASE_URL');
  }
  return { apiBaseUrl, isDev: import.meta.env.DEV };
}
