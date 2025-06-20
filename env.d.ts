// env.d.ts
declare module '@env' {
  export const APP_URL: string;
  export const API_URL: string;
  export const SENTRY_DSN: string;
  export const POSTHOG_API_KEY: string;
  export const POSTHOG_HOST: string;
  // add any other keys you’re pulling in from .env
}
