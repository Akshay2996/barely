/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Minimal typings for the Google Identity Services token client we use.
interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface GoogleTokenClient {
  requestAccessToken(overrides?: { prompt?: string }): void;
}

interface Window {
  google?: {
    accounts: {
      oauth2: {
        initTokenClient(config: {
          client_id: string;
          scope: string;
          prompt?: string;
          callback: (resp: GoogleTokenResponse) => void;
          error_callback?: (err: { type?: string; message?: string }) => void;
        }): GoogleTokenClient;
        revoke(accessToken: string, done?: () => void): void;
      };
    };
  };
}
