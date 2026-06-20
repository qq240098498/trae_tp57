/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: 'development' | 'test' | 'production';
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_MOCK_ENABLED: string;
  readonly VITE_AUTO_INIT_STUDYROOM: string;
  readonly VITE_RESET_DATA_ON_START: string;
  readonly VITE_STORAGE_KEY: string;
  readonly VITE_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
