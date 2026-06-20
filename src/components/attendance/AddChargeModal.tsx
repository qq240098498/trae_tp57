import { useEffect, useMemo, useState } from "react";
import { Printer, ShoppingCart, Minus, Plus, X, Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/store/useStore";
import { yuan } from "@/utils/format";
import { cn } from "@/lib/utils";
import {
  BILL_KIND_LABEL,
  PRINT_CATEGORY_LABEL,
  SNACK_CATEGORY_LABEL,
  type PrintCategory,
  type SnackCategory,
} from "@/data/types";

type BadgeTone = "sage" | "amber" | "indigo" | "clay" | "neutral" | "rose";
type TabMode = "print" | "snack";

const printTone: Record<PrintCategory, BadgeTone> = {
  bw_a4: "neutral",
  color_a4: "indigo",
  bw_a3: "clay",
  color_a3: "rose",
};

const snackTone: Record<SnackCategory, BadgeTone> = {
  drink: "sage",
  snack: "amber",
  instant: "clay",
  other: "indigo",
};

interface Props {
  open: boolean;
  onClose: () => void;
  reservationId: string;
  memberName?: string;
  spaceLabel?: string;
  initialTab?: TabMode;
}

export function AddChargeModal({ open, onClose, reservationId, memberName, spaceLabel, initialTab = "print" }: Props) {
  const [tab, setTab] = useState<TabMode>(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);
  const [printItemId, setPrintItemId] = useState<string>("");
  const [sheets, setSheets] = useState<number>(1);
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");

  const printItems = useStore((s) => s.printItems);
  const snackItems = useStore((s) => s.snackItems);
  const bills = useStore((s) => s.bills);
  const addPrintCharge = useStore((s) => s.addPrintCharge);
  const addSnackCharge = useStore((s) => s.addSnackCharge);
  const pushToast = useStore((s) => s.pushToast);

  const sessionBills = useMemo(
    () => bills.filter((b) => b.reservation_id === reservationId),
    [bills, reservationId],
  );
  const sessionPrintTotal = sessionBills.filter((b) => b.kind === "print").reduce((s, b) => s + b.amount, 0);
  const sessionSnackTotal = sessionBills.filter((b) => b.kind === "snack").reduce((s, b) => s + b.amount, 0);

  const selectedSnackItems = useMemo(
    () =>
      Object.entries(qtyMap)
        .filter(([, q]) => q > 0)
        .map(([id, qty]) => {
          const item = snackItems.find((s) => s.id === id);
          return item ? { item, qty } : null;
        })
        .filter((v): v is { item: typeof snackItems[number]; qty: number } => v != null),
    [qtyMap, snackItems],
  );
  const snackTotal = selectedSnackItems.reduce((s, { item, qty }) => s + item.price * qty, 0);

  const filteredSnacks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return snackItems.filter((s) => s.enabled);
    return snackItems.filter(
      (s) =>
        s.enabled &&
        (s.name.toLowerCase().includes(q) || (s.barcode && s.barcode.includes(q)) ||
          SNACK_CATEGORY_LABEL[s.category].toLowerCase().includes(q)),
    );
  }, [snackItems, search]);

  function reset() {
    setTab("print");
    setPrintItemId("");
    setSheets(1);
    setQtyMap({});
    setSearch("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handlePrintSubmit() {
    if (!printItemId) {
      pushToast({ type: "error", title: "请选择打印类型" });
      return;
    }
    const r = addPrintCharge(reservationId, printItemId, sheets);
    if (r.ok) {
      setSheets(1);
      setPrintItemId("");
      onClose();
    } else if (r.error) {
      pushToast({ type: "error", title: r.error });
    }
  }

  function handleSnackSubmit() {
    if (selectedSnackItems.length === 0) {
      pushToast({ type: "error", title: "请选择商品" });
      return;
    }
    const r = addSnackCharge(
      reservationId,
      selectedSnackItems.map(({ item, qty }) => ({ snackItemId: item.id, quantity: qty })),
    );
    if (r.ok) {
      reset();
      onClose();
    } else if (r.error) {
      pushToast({ type: "error", title: r.error });
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="挂账记账"
      subtitle={memberName && spaceLabel ? `${memberName} · ${spaceLabel}` : undefined}
      size="lg"
      footer={
        tab === "print" ? (
          <button onClick={handlePrintSubmit} className="btn-primary">
            <Printer className="h-4 w-4" />
            确认打印挂账 {printItemId && sheets > 0 ? `· ${yuan(
              (printItems.find((p) => p.id === printItemId)?.price_per_sheet ?? 0) * sheets,
            )}` : ""}
          </button>
        ) : (
          <button onClick={handleSnackSubmit} disabled={selectedSnackItems.length === 0} className="btn-primary">
            <ShoppingCart className="h-4 w-4" />
            确认商品挂账 {selectedSnackItems.length > 0 ? `· ${yuan(snackTotal)}` : ""}
          </button>
        )
      }
    >
      <div className="space-y-5">
        {(sessionPrintTotal > 0 || sessionSnackTotal > 0) && (
          <div className="rounded-xl border border-line-soft bg-surface-sunken px-4 py-3">
            <p className="text-[11px] text-ink-muted">本场次已挂账</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {sessionPrintTotal > 0 && (
                <Badge tone="indigo">
                  {BILL_KIND_LABEL.print}：{yuan(sessionPrintTotal)}
                </Badge>
              )}
              {sessionSnackTotal > 0 && (
                <Badge tone="amber">
                  {BILL_KIND_LABEL.snack}：{yuan(sessionSnackTotal)}
                </Badge>
              )}
              <Badge tone="neutral">
                合计：{yuan(sessionPrintTotal + sessionSnackTotal)}
              </Badge>
            </div>
          </div>
        )}

        <div className="flex rounded-lg border border-line bg-surface p-0.5">
          <button
            onClick={() => setTab("print")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab === "print" ? "bg-amber-soft text-amber-ink" : "text-ink-soft hover:bg-surface-sunken",
            )}
          >
            <Printer className="h-4 w-4" /> 自助打印
          </button>
          <button
            onClick={() => setTab("snack")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab === "snack" ? "bg-amber-soft text-amber-ink" : "text-ink-soft hover:bg-surface-sunken",
            )}
          >
            <ShoppingCart className="h-4 w-4" /> 零食饮料
          </button>
        </div>

        {tab === "print" ? (
          <div className="space-y-4">
            <p className="text-xs text-ink-muted">选择打印类型与张数，挂账到当前场次，离店时合并结算。</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {printItems
                .filter((p) => p.enabled)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPrintItemId(p.id)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      printItemId === p.id
                        ? "border-amber bg-amber-soft/60 ring-2 ring-amber"
                        : "border-line-soft bg-surface hover:border-amber/40",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-semibold text-ink">{p.name}</span>
                      <Badge tone={printTone[p.category]}>
                        {PRINT_CATEGORY_LABEL[p.category]}
                      </Badge>
                    </div>
                    <p className="mt-2 font-display text-lg text-ink tnum">
                      {yuan(p.price_per_sheet)}
                      <span className="text-xs text-ink-muted">/张</span>
                    </p>
                  </button>
                ))}
            </div>

            <div className="rounded-xl border border-line-soft bg-surface-sunken p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink">打印张数</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSheets((n) => Math.max(1, n - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft transition-colors hover:bg-surface"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={sheets}
                    onChange={(e) => setSheets(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-9 w-16 rounded-lg border border-line bg-surface px-2 text-center font-display text-lg text-ink tnum focus:outline-none focus:ring-2 focus:ring-amber"
                  />
                  <button
                    onClick={() => setSheets((n) => n + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft transition-colors hover:bg-surface"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {printItemId && (
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-sm text-ink-muted">小计</span>
                  <span className="font-display text-xl text-ink tnum">
                    {yuan((printItems.find((p) => p.id === printItemId)?.price_per_sheet ?? 0) * sheets)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-ink-muted">扫码或搜索选择商品，支持批量添加，挂账到当前场次。</p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="扫描条码或输入商品名称..."
                className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-10 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-amber"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-muted hover:bg-surface-sunken"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin pr-1">
              {filteredSnacks.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink-muted">未找到匹配商品</p>
              ) : (
                filteredSnacks.map((s) => {
                  const qty = qtyMap[s.id] ?? 0;
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                        qty > 0 ? "border-amber/50 bg-amber-soft/30" : "border-line-soft bg-surface",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-ink">{s.name}</p>
                          <Badge tone={snackTone[s.category]}>{SNACK_CATEGORY_LABEL[s.category]}</Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-ink-muted">
                          <span className="font-display text-ink tnum">{yuan(s.price)}</span>
                          {s.barcode && <span className="truncate font-mono">条码 {s.barcode}</span>}
                          <span>库存 {s.stock}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setQtyMap((m) => ({
                              ...m,
                              [s.id]: Math.max(0, (m[s.id] ?? 0) - 1),
                            }))
                          }
                          disabled={qty === 0}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface text-ink-soft transition-colors disabled:opacity-40 hover:bg-surface"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center font-display text-sm text-ink tnum">{qty}</span>
                        <button
                          onClick={() =>
                            setQtyMap((m) => ({
                              ...m,
                              [s.id]: Math.min(s.stock, (m[s.id] ?? 0) + 1),
                            }))
                          }
                          disabled={s.stock <= 0 || qty >= s.stock}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface text-ink-soft transition-colors disabled:opacity-40 hover:bg-surface"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {selectedSnackItems.length > 0 && (
              <div className="rounded-xl border border-line-soft bg-surface-sunken p-4">
                <p className="text-xs text-ink-muted">已选商品</p>
                <div className="mt-2 space-y-1.5">
                  {selectedSnackItems.map(({ item, qty }) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink-soft">
                        {item.name} × {qty}
                      </span>
                      <span className="font-display text-ink tnum">{yuan(item.price * qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-sm text-ink-muted">合计</span>
                  <span className="font-display text-xl text-ink tnum">{yuan(snackTotal)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
