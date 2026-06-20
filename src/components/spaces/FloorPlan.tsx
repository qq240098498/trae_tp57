import type { Space } from "@/data/types";
import { useStore } from "@/store/useStore";
import { SPACE_STATUS_LABEL } from "@/data/types";
import { cn } from "@/lib/utils";

const cellCls: Record<Space["status"], string> = {
  free: "border-line bg-surface text-ink-soft hover:border-amber/40",
  occupied: "border-amber/40 bg-amber-soft text-amber-ink",
  reserved: "border-indigo/40 bg-indigo-soft text-indigo",
  maintenance: "border-clay/50 bg-clay-soft text-clay",
};

const legend = [
  { k: "free", c: "bg-surface border-line", l: "空闲" },
  { k: "occupied", c: "bg-amber-soft border-amber/40", l: "使用中" },
  { k: "reserved", c: "bg-indigo-soft border-indigo/40", l: "已预约" },
  { k: "maintenance", c: "bg-clay-soft border-clay/50", l: "维护中" },
] as const;

export function FloorPlan() {
  const spaces = useStore((s) => s.spaces);
  const areas = useStore((s) => s.areas);
  const updateSpaceStatus = useStore((s) => s.updateSpaceStatus);
  const pushToast = useStore((s) => s.pushToast);

  const onClick = (sp: Space) => {
    if (sp.status === "free") {
      updateSpaceStatus(sp.id, "maintenance");
      pushToast({ type: "info", title: `${sp.label} 已设为维护中` });
    } else if (sp.status === "maintenance") {
      updateSpaceStatus(sp.id, "free");
      pushToast({ type: "success", title: `${sp.label} 已恢复空闲` });
    } else {
      pushToast({ type: "error", title: `${sp.label} 当前${SPACE_STATUS_LABEL[sp.status]}，不可直接切换` });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        {legend.map((l) => (
          <span key={l.k} className="flex items-center gap-2 text-xs text-ink-soft">
            <span className={cn("h-3.5 w-3.5 rounded border", l.c)} />
            {l.l}
          </span>
        ))}
        <span className="ml-auto text-xs text-ink-muted">点击「空闲 / 维护中」可切换状态</span>
      </div>

      {areas.map((area) => {
        const list = spaces.filter((s) => s.area_id === area.id);
        const cols = Math.max(...list.map((s) => s.col)) + 1;
        return (
          <div key={area.id} className="card p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-8 w-1 rounded-full bg-amber" />
              <div>
                <h3 className="font-display text-lg text-ink">{area.name}</h3>
                <p className="text-xs text-ink-muted">{area.desc}</p>
              </div>
              <span className="ml-auto text-xs text-ink-muted">{list.length} 个资源</span>
            </div>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {list.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => onClick(sp)}
                  title={`${sp.label} · ${SPACE_STATUS_LABEL[sp.status]}`}
                  className={cn(
                    "group relative flex aspect-[4/3] items-center justify-center rounded-lg border text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-soft",
                    cellCls[sp.status],
                  )}
                >
                  {sp.status === "maintenance" && (
                    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg opacity-40">
                      <span className="absolute -left-2 top-1/2 h-px w-[140%] -rotate-45 bg-clay/50" />
                    </span>
                  )}
                  <span className="font-mono">{sp.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
