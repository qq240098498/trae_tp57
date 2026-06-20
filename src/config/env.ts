export interface AppConfig {
  env: 'development' | 'test' | 'production';
  title: string;
  apiBaseUrl: string;
  mockEnabled: boolean;
  autoInitStudyRoom: boolean;
  resetDataOnStart: boolean;
  storageKey: string;
}

function getBooleanEnv(key: string, defaultValue: boolean): boolean {
  const val = import.meta.env[key];
  if (val === undefined || val === null || val === '') return defaultValue;
  return val === 'true' || val === '1';
}

export const appConfig: AppConfig = {
  env: (import.meta.env.VITE_APP_ENV as AppConfig['env']) || 'development',
  title: import.meta.env.VITE_APP_TITLE || '自习室管理系统',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  mockEnabled: getBooleanEnv('VITE_MOCK_ENABLED', true),
  autoInitStudyRoom: getBooleanEnv('VITE_AUTO_INIT_STUDYROOM', true),
  resetDataOnStart: getBooleanEnv('VITE_RESET_DATA_ON_START', false),
  storageKey: import.meta.env.VITE_STORAGE_KEY || 'quiet-study-ops-v1',
};

export const isDev = appConfig.env === 'development';
export const isTest = appConfig.env === 'test';
export const isProd = appConfig.env === 'production';

export const envLabel: Record<AppConfig['env'], string> = {
  development: '开发环境',
  test: '测试环境',
  production: '生产环境',
};
