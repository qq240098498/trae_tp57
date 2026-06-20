import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
        <footer className="mx-auto max-w-[1400px] px-4 pb-10 pt-2 lg:px-8">
          <p className="text-center text-xs text-ink-muted">
            静谧自习空间 · 运营管理系统 · 数据保存在本地浏览器，刷新不丢失
          </p>
        </footer>
      </div>
    </div>
  );
}
