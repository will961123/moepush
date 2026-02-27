/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    AUTH_SECRET: string;
    AUTH_GITHUB_ID: string;
    AUTH_GITHUB_SECRET: string;
    DISABLE_CREDENTIALS_REGISTER: string;
    DISABLE_GITHUB_REGISTER: string;
    TURNSTILE_ENABLED: string;
    TURNSTILE_SITE_KEY: string;
    TURNSTILE_SECRET_KEY: string;
  }

  type Env = CloudflareEnv
}

declare module "next-auth" {
  interface User {
    username?: string | null
  }
  interface Session {
    user: User
  }
}

interface TurnstileObject {
  render: (container: HTMLElement, options: {
    sitekey: string;
    theme?: "light" | "dark" | "auto";
    callback?: (token: string) => void;
    "error-callback"?: () => void;
    "expired-callback"?: () => void;
  }) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileObject;
  }
}

export type { Env }
