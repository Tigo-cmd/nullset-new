"use client";

import { useState } from "react";
import { Palette, RotateCcw } from "lucide-react";
import { Button } from "./ui";
import { DENOMS, TOKEN, type Denom, type Pool } from "@/lib/nullset/sim";
import { BRAND_PRESETS, brandStore, DEFAULT_BRAND, isHex, useBrand } from "@/lib/nullset/brand";

export interface Controls {
  feeRate: number;
  speed: number;
}

interface ControlsCardProps {
  walletBalance: number | null;
  onBalanceChange: (b: number) => void;
  controls: Controls;
  onControlsChange: (c: Controls) => void;
  pools: Record<Denom, Pool>;
  onPoolSizeChange: (d: Denom, count: number) => void;
  onReset: () => void;
}

const SPEEDS = [
  { v: 0.35, label: "Fast" },
  { v: 1, label: "Normal" },
  { v: 2.2, label: "Slow (explain each step)" },
];

/** Presenter-only panel, shown with teacher view, for setting up classroom scenarios. */
export function ControlsCard(p: ControlsCardProps) {
  return (
    <section className="mb-5 rounded-3xl border border-ns-violet/40 bg-ns-surface p-4 sm:p-6">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={p.onReset}>
          <RotateCcw className="size-3.5" /> Reset session
        </Button>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={`Wallet balance (${TOKEN})`}>
          {p.walletBalance === null ? (
            <p className="text-xs text-ns-muted">Connect the wallet first.</p>
          ) : (
            <NumberInput key={p.walletBalance} value={p.walletBalance} min={0} step={0.01} onCommit={p.onBalanceChange} />
          )}
        </Field>
        <Field label="Relayer fee (%)">
          <NumberInput
            key={p.controls.feeRate}
            value={+(p.controls.feeRate * 100).toFixed(3)}
            min={0}
            max={20}
            step={0.1}
            onCommit={(v) => p.onControlsChange({ ...p.controls, feeRate: v / 100 })}
          />
        </Field>
        <Field label="Animation speed">
          <select
            value={p.controls.speed}
            onChange={(e) => p.onControlsChange({ ...p.controls, speed: Number(e.target.value) })}
            className="h-10 w-full rounded-xl border border-ns-border bg-ns-surface-2 px-3 text-sm focus:border-ns-violet focus:outline-none"
          >
            {SPEEDS.map((s) => (
              <option key={s.v} value={s.v}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Coins mixed (per pool)">
          <div className="grid grid-cols-2 gap-2">
            {DENOMS.map((d) => (
              <div key={d} className="flex items-center gap-1.5">
                <span className="w-8 shrink-0 text-[11px] text-ns-muted">
                  {d}
                </span>
                <NumberInput key={p.pools[d].count} value={p.pools[d].count} min={1} step={1} compact onCommit={(v) => p.onPoolSizeChange(d, Math.round(v))} />
              </div>
            ))}
          </div>
        </Field>
      </div>
      <BrandingControls />
    </section>
  );
}

function BrandingControls() {
  const brand = useBrand();
  const [name, setName] = useState(brand.name);
  const commitName = () => {
    const v = name.trim().slice(0, 32);
    if (!v) return setName(brand.name);
    setName(v);
    if (v !== brand.name) brandStore.set({ name: v });
  };
  const custom = brand.primary !== DEFAULT_BRAND.primary || brand.secondary !== DEFAULT_BRAND.secondary || brand.name !== DEFAULT_BRAND.name;

  return (
    <div className="mt-4 rounded-2xl border border-ns-border bg-ns-surface-2/60 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ns-muted">
          <Palette className="size-3.5" /> Branding
        </p>
        {custom && (
          <button
            onClick={() => {
              brandStore.reset();
              setName(DEFAULT_BRAND.name);
            }}
            className="text-xs font-semibold text-ns-teal hover:underline"
          >
            Reset branding
          </button>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1.4fr] lg:items-end">
        <label className="block">
          <span className="mb-1.5 block text-[11px] text-ns-muted">Name</span>
          <input
            value={name}
            maxLength={32}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="h-10 w-full rounded-xl border border-ns-border bg-ns-surface-2 px-3 text-sm focus:border-ns-violet focus:outline-none"
          />
        </label>
        <div className="flex gap-3">
          <ColorField label="Primary" value={brand.primary} onChange={(v) => brandStore.set({ primary: v })} />
          <ColorField label="Secondary" value={brand.secondary} onChange={(v) => brandStore.set({ secondary: v })} />
        </div>
        <div>
          <span className="mb-1.5 block text-[11px] text-ns-muted">Presets</span>
          <div className="flex flex-wrap gap-2">
            {BRAND_PRESETS.map((pr) => {
              const active = pr.primary === brand.primary && pr.secondary === brand.secondary;
              return (
                <button
                  key={pr.label}
                  title={pr.label}
                  aria-label={pr.label}
                  aria-pressed={active}
                  onClick={() => brandStore.set({ primary: pr.primary, secondary: pr.secondary })}
                  className={`flex h-10 items-center gap-1 rounded-xl border px-2.5 ${active ? "border-ns-text" : "border-ns-border hover:border-ns-border-strong"}`}
                >
                  <span className="size-4 rounded-full" style={{ background: pr.primary }} />
                  <span className="size-4 rounded-full" style={{ background: pr.secondary }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] text-ns-muted">{label}</span>
      <span className="flex h-10 items-center gap-2 rounded-xl border border-ns-border bg-ns-surface-2 pl-1.5 pr-3">
        <input
          type="color"
          value={value}
          onChange={(e) => isHex(e.target.value) && onChange(e.target.value)}
          className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />
        <span className="font-mono text-xs uppercase">{value}</span>
      </span>
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ns-border bg-ns-surface-2/60 p-3.5">
      <p className="mb-2 text-xs font-semibold text-ns-muted">{label}</p>
      {children}
    </div>
  );
}

/** Edits a local draft and commits on blur or Enter, so typing isn't fighting re-renders. */
function NumberInput({
  value,
  min,
  max,
  step,
  compact,
  onCommit,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  compact?: boolean;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const commit = () => {
    const n = Number(draft);
    if (!Number.isFinite(n) || draft.trim() === "") return setDraft(String(value));
    const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
    setDraft(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };
  return (
    <input
      type="number"
      inputMode="decimal"
      value={draft}
      min={min}
      max={max}
      step={step}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className={`w-full rounded-xl border border-ns-border bg-ns-surface-2 px-3 font-mono focus:border-ns-violet focus:outline-none ${compact ? "h-8 text-xs" : "h-10 text-sm"}`}
    />
  );
}
