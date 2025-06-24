// env.d.ts
declare module '@env' {
  export const APP_URL: string;
  export const PARTNER_ID: string;
  export const POSTHOG_KEY: string;
  export const POSTHOG_HOST: string;
  export const SENTRY_DSN: string;
  export const CI: string;
  export const NODE_ENV: string;
}

// Process environment variables for Node.js/Next.js
declare namespace NodeJS {
  interface ProcessEnv {
    APP_URL: string;
    PARTNER_ID: string;
    POSTHOG_KEY: string;
    POSTHOG_HOST: string;
    SENTRY_DSN: string;
    CI: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}

// Global environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_URL: string;
      PARTNER_ID: string;
      POSTHOG_KEY: string;
      POSTHOG_HOST: string;
      SENTRY_DSN: string;
      CI: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

export {};
