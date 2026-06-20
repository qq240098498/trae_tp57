import { useStore } from "@/store/useStore";
import { recentLogs, spaceArea } from "@/store/selectors";
import { fmtDateTime, relativeTime } from "@/utils/format";
import type { AccessLog } from "@/data/types";
import { cn } from "@/lib/utils";

const actionMeta: Record<AccessLog["action"], { label: string; dot: string }> = {
  issue: { label: "权限下发", dot: "bg-sage" },
  open: { label: "开门", dot: "bg-amber" },
  revoke: { label: "权限回收", dot: "bg-clay" },
};

export function AccessTimeline() {
  const { accessLogs, accessTokens, spaces, areas } = useStore();
  const logs = recentLogs(accessLogs, accessTokens, 30);

  return (
    <div className="card p-6">
      <div className="mb-4">
        <p className="label-eyebrow">开门记录</p>
        <h2 className="mt-1 font-display text-xl text-ink">门禁操作时间线</h2>
      </div>
      <div className="relative max-h-[560px] overflow-y-auto pr-2 scrollbar-thin">
        <div className="absolute left-[15px] top-1 bottom-1 w-px bg-line" />
        <div className="space-y-1">
          {logs.map(({ log }) => {
            const meta = actionMeta[log.action];
            const sa = spaceArea(spaces, areas, log.space_id);
            const failed = log.result === "failed";
            return (
              <div key={log.id} className="relative flex items-start gap-4 py-2.5">
                <span className={cn("relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-surface", failed ? "bg-rose-500" : meta.dot)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{failed ? "操作异常" : meta.label}</span>
                    <span className="text-xs text-ink-muted">· {sa?.space.label} · {sa?.area.name}</span>
                    {failed && <span className="chip bg-rose-100 text-rose-700">失败</span>}
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-muted tnum">{fmtDateTime(log.time)} · {relativeTime(log.time)}</p>
                </div>
              </div>
            );
          })}
          {logs.length === 0 && <p className="py-10 text-center text-sm text-ink-muted">暂无门禁记录</p>}
        </div>
      </div>
    </div>
  );
}
