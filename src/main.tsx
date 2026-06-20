import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initStudyRoom } from '@/config/initStudyRoom'
import { appConfig, isDev, isTest, envLabel } from '@/config/env'

const report = initStudyRoom();

if (isDev || isTest) {
  console.log(
    `%c[应用启动] ${appConfig.title}`,
    'color: #f59e0b; font-weight: bold; font-size: 14px;',
    `\n  环境: ${envLabel[appConfig.env]}`,
    `\n  API: ${appConfig.apiBaseUrl || '未配置'}`,
    `\n  初始化: ${report.action} (${report.reason})`,
    `\n  时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}`,
  );
}

document.title = appConfig.title;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
