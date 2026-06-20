import type { Reservation, Space, Area } from "@/data/types";
import { fmtTime } from "@/utils/format";
import { spaceArea } from "@/store/selectors";
import { cn } from "@/lib/utils";

const START_H = 8;
const END_H = 22;
const SPAN = END_H - START_H;

function pct(iso: string): number {
  const d = new Date(iso);
  const h = d.getHours() + d.getMinutes() / 60;
  return Math.min(100, Math.max(0, ((h - START_H) / SPAN) * 100));
}

const areaColor: Record<Area["type"], string> = {
  open: "bg-amber/80 hover:bg-amber",
  booth: "bg-sage/80 hover:bg-sage",
  room: "bg-indigo/80 hover:bg-indigo",
};

export function TodayTimeline({
  reservations,
  spaces,
  areas,
}: {
  reservations: Reservation[];
  spaces: Space[];
  areas: Area[];
}) {
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const nowPct = ((nowH - START_H) / SPAN) * 100;
  const showNow = nowH >= START_H && nowH <= END_H;

  const hours = Array.from({ length: SPAN + 1 }, (_, i) => START_H + i);

  return (
    <div>
      <div className="relative h-24">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        {hours.map((h) => (
          <div key={h} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${((h - START_H) / SPAN) * 100}%` }}>
            <span className="block h-2 w-px bg-line" />
            <span className="mt-1 block text-[9px] text-ink-muted tnum">{h}:00</span>
          </div>
        ))}

        {reservations.map((r) => {
          const sa = spaceArea(spaces, areas, r.space_id);
          const left = pct(r.start);
          const width = Math.max(2, pct(r.end) - left);
          const tone = sa?.area.type ?? "open";
          const cancelled = r.status === "cancelled";
          return (
            <div
              key={r.id}
              title={`${sa?.space.label ?? ""} · ${fmtTime(r.start)}-${fmtTime(r.end)}`}
              className={cn(
                "absolute top-3 h-7 cursor-default overflow-hidden rounded-md text-[10px] font-medium text-white shadow-soft transition-all",
                areaColor[tone],
                cancelled && "opacity-40 line-through",
              )}
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <span className="whitespace-nowrap px-1.5 leading-7">{sa?.space.label}</span>
            </div>
          );
        })}

        {showNow && (
          <div className="absolute top-0 bottom-0 z-10 -translate-x-1/2" style={{ left: `${nowPct}%` }}>
            <div className="h-full w-px bg-amber" />
            <div className="absolute -top-0.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-amber ring-2 ring-amber-soft" />
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-amber px-1.5 py-0.5 text-[9px] font-semibold text-white tnum">
              现在
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
