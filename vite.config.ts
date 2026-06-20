import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import colors from 'picocolors';

function resolveEnv(mode: string) {
  return loadEnv(mode, process.cwd(), '');
}

function startupBannerPlugin(): Plugin {
  return {
    name: 'startup-banner',
    configureServer(server) {
      const _printUrls = server.printUrls;
      server.printUrls = () => {
        const mode = server.config.mode;
        const env = resolveEnv(mode);
        const envLabel: Record<string, string> = {
          development: '开发环境',
          test: '测试环境',
          production: '生产环境',
        };
        const envName = envLabel[env.VITE_APP_ENV || mode] || mode;
        const envColor = (() => {
          switch (env.VITE_APP_ENV) {
            case 'production': return colors.red;
            case 'test': return colors.yellow;
            default: return colors.green;
          }
        })();

        const hr = colors.cyan('╔══════════════════════════════════════════════════╗');
        const pad = (s: string) => s.padEnd(48, ' ');
        const line = (content: string) => colors.cyan('║') + ` ${content}` + ' '.repeat(Math.max(0, 48 - content.length)) + colors.cyan('║');

        setTimeout(() => {
          console.log('');
          console.log(hr);
          console.log(line(colors.bold(colors.blue('         自习室管理系统 · 启动成功 🎉'))));
          console.log(colors.cyan('╠══════════════════════════════════════════════════╣'));
          console.log(line(`环境模式: ${envColor(envName)}`));
          console.log(line(`应用标题: ${colors.white(env.VITE_APP_TITLE || '自习室管理系统')}`));
          console.log(line(`API 地址: ${colors.magenta(env.VITE_API_BASE_URL || '未配置')}`));
          console.log(line(`模拟数据: ${env.VITE_MOCK_ENABLED === 'true' ? colors.green('已启用') : colors.gray('已关闭')}`));
          console.log(line(`自动初始化: ${env.VITE_AUTO_INIT_STUDYROOM === 'true' ? colors.green('是') : colors.gray('否')}`));
          console.log(line(`启动重置数据: ${env.VITE_RESET_DATA_ON_START === 'true' ? colors.yellow('是') : colors.gray('否')}`));
          console.log(colors.cyan('╠══════════════════════════════════════════════════╣'));
          _printUrls();
          console.log(colors.cyan('╠══════════════════════════════════════════════════╣'));
          console.log(line(colors.gray('提示: 按 Ctrl+C 停止服务')));
          console.log(hr);
          console.log('');
        }, 0);
      };
    },
  };
}

function buildBannerPlugin(): Plugin {
  return {
    name: 'build-banner',
    closeBundle() {
      const mode = process.env.NODE_ENV || 'production';
      const env = resolveEnv(mode);
      const envLabel: Record<string, string> = {
        development: '开发环境',
        test: '测试环境',
        production: '生产环境',
      };
      const envName = envLabel[env.VITE_APP_ENV || mode] || mode;

      const hr = colors.cyan('╔══════════════════════════════════════════════════╗');
      const line = (content: string) => colors.cyan('║') + ` ${content}` + ' '.repeat(Math.max(0, 48 - content.length)) + colors.cyan('║');

      console.log('');
      console.log(hr);
      console.log(line(colors.bold(colors.blue('         自习室管理系统 · 构建完成 ✅'))));
      console.log(colors.cyan('╠══════════════════════════════════════════════════╣'));
      console.log(line(`构建环境: ${colors.green(envName)}`));
      console.log(line(`应用标题: ${colors.white(env.VITE_APP_TITLE || '自习室管理系统')}`));
      console.log(line(`API 地址: ${colors.magenta(env.VITE_API_BASE_URL || '未配置')}`));
      console.log(hr);
      console.log('');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = resolveEnv(mode);
  const port = Number(env.VITE_PORT) || 5173;

  return {
    server: {
      port,
      host: true,
      open: false,
    },
    preview: {
      port,
      host: true,
    },
    build: {
      sourcemap: mode !== 'production',
    },
    plugins: [
      react({
        babel: {
          plugins: mode === 'development' ? ['react-dev-locator'] : [],
        },
      }),
      traeBadgePlugin({
        variant: 'dark',
        position: 'bottom-right',
        prodOnly: true,
        clickable: true,
        clickUrl: 'https://www.trae.ai/solo?showJoin=1',
        autoTheme: true,
        autoThemeTarget: '#root'
      }),
      tsconfigPaths(),
      startupBannerPlugin(),
      buildBannerPlugin(),
    ],
  };
});
