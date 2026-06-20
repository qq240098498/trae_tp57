import { appConfig, isDev, isTest } from './env';
import { useStore } from '@/store/useStore';

const INIT_FLAG_KEY = `${appConfig.storageKey}-initialized`;
const INIT_DATA_VERSION = '1.0.0';
const VERSION_KEY = `${appConfig.storageKey}-version`;

export interface InitReport {
  action: 'reset' | 'init' | 'skip' | 'version-upgrade';
  reason: string;
  timestamp: string;
}

function shouldResetData(): boolean {
  if (appConfig.resetDataOnStart) return true;
  const storedVersion = localStorage.getItem(VERSION_KEY);
  if (storedVersion !== INIT_DATA_VERSION) return true;
  return false;
}

function isFirstInit(): boolean {
  return localStorage.getItem(INIT_FLAG_KEY) === null;
}

export function initStudyRoom(): InitReport {
  const now = new Date().toISOString();

  if (shouldResetData()) {
    localStorage.removeItem(appConfig.storageKey);
    localStorage.removeItem(INIT_FLAG_KEY);
    localStorage.setItem(VERSION_KEY, INIT_DATA_VERSION);
    localStorage.setItem(INIT_FLAG_KEY, now);

    const resetData = useStore.getState().resetData;
    if (resetData) resetData();

    if (isDev || isTest) {
      console.log(
        `%c[自习室初始化] %c数据已重置`,
        'color: #3b82f6; font-weight: bold;',
        'color: #10b981;',
        `\n  原因: ${appConfig.resetDataOnStart ? '配置启动重置' : '数据版本升级'}`,
        `\n  版本: ${INIT_DATA_VERSION}`,
        `\n  存储键: ${appConfig.storageKey}`,
      );
    }

    return {
      action: appConfig.resetDataOnStart ? 'reset' : 'version-upgrade',
      reason: appConfig.resetDataOnStart ? '配置启动重置' : '数据版本升级',
      timestamp: now,
    };
  }

  if (isFirstInit() && appConfig.autoInitStudyRoom) {
    localStorage.setItem(INIT_FLAG_KEY, now);
    localStorage.setItem(VERSION_KEY, INIT_DATA_VERSION);

    if (isDev || isTest) {
      console.log(
        `%c[自习室初始化] %c首次初始化完成`,
        'color: #3b82f6; font-weight: bold;',
        'color: #8b5cf6;',
        `\n  版本: ${INIT_DATA_VERSION}`,
        `\n  存储键: ${appConfig.storageKey}`,
      );
    }

    return {
      action: 'init',
      reason: '首次启动自动初始化',
      timestamp: now,
    };
  }

  if (isDev || isTest) {
    console.log(
      `%c[自习室初始化] %c跳过初始化，使用已存储数据`,
      'color: #3b82f6; font-weight: bold;',
      'color: #6b7280;',
      `\n  存储键: ${appConfig.storageKey}`,
    );
  }

  return {
    action: 'skip',
    reason: '已有数据且无需重置',
    timestamp: now,
  };
}

export function forceResetStudyRoom(): InitReport {
  const now = new Date().toISOString();
  localStorage.removeItem(appConfig.storageKey);
  localStorage.removeItem(INIT_FLAG_KEY);
  localStorage.setItem(VERSION_KEY, INIT_DATA_VERSION);
  localStorage.setItem(INIT_FLAG_KEY, now);

  const resetData = useStore.getState().resetData;
  if (resetData) resetData();

  return {
    action: 'reset',
    reason: '用户手动强制重置',
    timestamp: now,
  };
}
