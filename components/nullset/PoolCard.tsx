"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  EyeOff,
  LoaderCircle,
  Lock,
  RefreshCw,
  Wallet,
  X,
} from "lucide-react";
import { Badge, Button, InfoTip } from "./ui";
import type { DemoWallet } from "./Header";
import {
  commitmentOf,
  DENOMS,
  encodeNote,
  isAddress,
  makeNote,
  nullifierHashOf,
  parseNote,
  randAddress,
  randHex,
  shorten,
  sleep,
  TOKEN,
  type Denom,
  type Note,
  type Pool,
} from "@/lib/nullset/sim";
import { brandSlug, useBrand } from "@/lib/nullset/brand";

type Tab = "deposit" | "withdraw";

interface PoolCardProps {
  wallet: DemoWallet | null;
  connecting: boolean;
  pools: Record<Denom, Pool>;
  denom: Denom;
  onDenomChange: (d: Denom) => void;
  onConnect: () => void;
  onDeposit: (denom: Denom, commitment: string) => number;
  onWithdraw: (w: { denom: Denom; commitment: string; nullifierHash: string; recipient: string; payout: number; fee: number }) => void;
  toast: (msg: string) => void;
  teacher: boolean;
  /** Relayer fee as a fraction, e.g. 0.005 for 0.5 %. */
  feeRate: number;
  /** Multiplier for the simulated waiting times (1 = normal). */
  speed: number;
}


export function PoolCard(props: PoolCardProps) {
  const [tab, setTab] = useState<Tab>("deposit");
  const [prefillNote, setPrefillNote] = useState("");

  return (
    <section id="pool" className="scroll-mt-24 rounded-3xl border border-ns-border bg-ns-surface p-2 shadow-2xl shadow-black/30">
      <div role="tablist" aria-label="Pool action" className="grid grid-cols-2 gap-1 rounded-2xl bg-ns-bg/60 p-1">
        {(["deposit", "withdraw"] as const).map((t) => {
          const active = tab === t;
          const Icon = t === "deposit" ? ArrowDownToLine : ArrowUpFromLine;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t)}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold capitalize transition ${
                active ? "bg-ns-surface-3 text-ns-text shadow" : "text-ns-muted hover:text-ns-text"
              }`}
            >
              <Icon className={`size-4 ${active ? "text-ns-teal" : ""}`} />
              {t}
            </button>
          );
        })}
      </div>
      <div className="p-4 sm:p-6">
        {tab === "deposit" ? (
          <DepositTab
            {...props}
            onUseNote={(n) => {
              setPrefillNote(n);
              setTab("withdraw");
            }}
          />
        ) : (
          <WithdrawTab {...props} key={prefillNote} initialNote={prefillNote} />
        )}
      </div>
    </section>
  );
}

function DenomPicker({ value, onChange }: { value: Denom; onChange: (d: Denom) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Amount">
      {DENOMS.map((d) => (
        <button
          key={d}
          role="radio"
          aria-checked={value === d}
          onClick={() => onChange(d)}
          className={`h-12 rounded-xl border text-sm font-semibold transition ${
            value === d
              ? "border-ns-teal bg-ns-teal-soft text-ns-teal"
              : "border-ns-border bg-ns-surface-2 text-ns-text hover:border-ns-border-strong"
          }`}
        >
          {d}
          <span className="ml-1 text-[11px] font-medium opacity-70">{TOKEN}</span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deposit
// ---------------------------------------------------------------------------

function DepositTab({
  speed,
  wallet,
  connecting,
  denom,
  onDenomChange,
  onConnect,
  onDeposit,
  pools,
  onUseNote,
  toast,
}: PoolCardProps & { onUseNote: (note: string) => void }) {
  const slug = brandSlug(useBrand().name);
  const [pending, setPending] = useState<{ note: Note; encoded: string; commitment: string } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const amount = Number(denom);
  const insufficient = wallet ? wallet.balance < amount : false;

  async function start() {
    setPreparing(true);
    const note = makeNote(denom);
    const commitment = await commitmentOf(note);
    setPending({ note, encoded: encodeNote(note, slug), commitment });
    setPreparing(false);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-ns-muted">Token</span>
      </div>
      <div className="mb-5 flex h-12 items-center gap-3 rounded-xl border border-ns-border bg-ns-surface-2 px-4">
        <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-ns-teal to-ns-violet text-[10px] font-black text-ns-teal-ink">
          Ξ
        </span>
        <span className="font-semibold">{TOKEN}</span>
        <span className="text-sm text-ns-muted">Ether</span>
        {wallet && (
          <span className="ml-auto text-sm text-ns-muted">
            Balance <b className="text-ns-text">{wallet.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b>
          </span>
        )}
      </div>

      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-sm font-medium text-ns-muted">Amount</span>
        <InfoTip>
          Every deposit in a pool is the same size, so amounts can&apos;t be used to match a deposit with a withdrawal.
        </InfoTip>
      </div>
      <DenomPicker value={denom} onChange={onDenomChange} />

      <div className="mt-5 flex gap-3 rounded-xl border border-ns-violet/25 bg-ns-violet-soft/60 p-3.5 text-sm text-ns-muted">
        <Lock className="mt-0.5 size-4 shrink-0 text-ns-violet" />
        <p>
          You&apos;ll receive a <b className="text-ns-text">secret note</b>. Only its hash (the commitment) is published. The
          note is the only way to withdraw. It&apos;s generated in your browser and is never sent anywhere.
        </p>
      </div>

      <div className="mt-5">
        {!wallet ? (
          <Button size="lg" className="w-full" onClick={onConnect} loading={connecting}>
            {!connecting && <Wallet className="size-4" />} Connect wallet
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={start} loading={preparing} disabled={insufficient}>
            {insufficient ? `Insufficient balance` : `Deposit ${denom} ${TOKEN}`}
          </Button>
        )}
        <p className="mt-3 text-center text-xs text-ns-muted">
          The pool currently has {pools[denom].count.toLocaleString()} equal deposits of {denom} {TOKEN}.
        </p>
      </div>

      {pending && (
        <NoteModal
          {...pending}
          denom={denom}
          onClose={() => setPending(null)}
          onConfirm={async () => {
            await sleep(1400 * speed);
            const idx = onDeposit(denom, pending.commitment);
            toast(`Deposit #${idx.toLocaleString()} confirmed`);
            return idx;
          }}
          onUseNote={() => {
            onUseNote(pending.encoded);
            setPending(null);
          }}
        />
      )}
    </div>
  );
}

function NoteModal({
  encoded,
  commitment,
  denom,
  onClose,
  onConfirm,
  onUseNote,
}: {
  encoded: string;
  commitment: string;
  denom: Denom;
  onClose: () => void;
  onConfirm: () => Promise<number>;
  onUseNote: () => void;
}) {
  const { name } = useBrand();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | { done: number }>("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(encoded);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; the note is still selectable */
    }
  }

  function download() {
    const blob = new Blob([`${name} note\n\n${encoded}\n`], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${brandSlug(name)}-note-${denom}eth.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const done = typeof state === "object";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="note-title">
      <div className="w-full max-w-lg rounded-t-3xl border border-ns-border bg-ns-surface p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="note-title" className="text-lg font-bold">
              {done ? "Deposit confirmed" : "Back up your secret note"}
            </h2>
            <p className="mt-1 text-sm text-ns-muted">
              {done
                ? `Your commitment is leaf #${state.done.toLocaleString()} in the ${denom} ${TOKEN} pool.`
                : "Anyone holding this note can withdraw the deposit. If you lose it, the funds can't be recovered."}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-xl border border-ns-border text-ns-muted hover:text-ns-text">
            <X className="size-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-dashed border-ns-violet/60 bg-ns-violet-soft/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-ns-violet">
            <EyeOff className="size-3.5" /> Private: never shown on chain
          </div>
          <p className="break-all font-mono text-xs leading-relaxed text-ns-text">{encoded}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="subtle" onClick={copy}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
            </Button>
            <Button size="sm" variant="subtle" onClick={download}>
              <Download className="size-3.5" /> Download
            </Button>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-[110px_1fr] gap-y-1.5 text-xs">
          <dt className="text-ns-muted">Commitment</dt>
          <dd className="font-mono">
            {shorten(commitment, 10, 6)} <Badge tone="teal">public</Badge>
          </dd>
          <dt className="text-ns-muted">Amount</dt>
          <dd>
            {denom} {TOKEN}
          </dd>
        </dl>

        {done ? (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onUseNote}>Try withdrawing</Button>
          </div>
        ) : (
          <>
            <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="size-4 accent-[var(--color-ns-teal)]" />
              I&apos;ve backed up my note
            </label>
            <Button
              size="lg"
              className="mt-4 w-full"
              disabled={!saved}
              loading={state === "sending"}
              onClick={async () => {
                setState("sending");
                const idx = await onConfirm();
                setState({ done: idx });
              }}
            >
              {state === "sending" ? "Submitting deposit…" : `Confirm deposit of ${denom} ${TOKEN}`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Withdraw
// ---------------------------------------------------------------------------

type StepState = "todo" | "active" | "done" | "error";
const STEPS = [
  "Parse note and recompute the commitment",
  "Find the leaf and build its Merkle path",
  "Generate the zero-knowledge proof",
  "Relayer submits; contract verifies",
] as const;

function WithdrawTab({ wallet, pools, onWithdraw, toast, initialNote, teacher, feeRate, speed }: PoolCardProps & { initialNote: string }) {
  const { name } = useBrand();
  const [note, setNote] = useState(initialNote);
  const [recipient, setRecipient] = useState("");
  const [relayer, setRelayer] = useState(true);
  const [steps, setSteps] = useState<StepState[] | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [result, setResult] = useState<{ ok: boolean; msg: string; tx?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const parsed = parseNote(note);
  const amount = parsed ? Number(parsed.denom) : 0;
  const fee = relayer ? +(amount * feeRate).toFixed(6) : 0;
  const linksBack = !!wallet && recipient.trim().toLowerCase() === wallet.address.toLowerCase();

  const noteError = note.trim() && !parsed ? `That doesn't look like a valid ${name} note.` : null;
  const addrError = recipient.trim() && !isAddress(recipient) ? "Enter a 0x address with 40 hex characters." : null;

  async function withdraw() {
    if (!parsed || !isAddress(recipient)) return;
    setBusy(true);
    setResult(null);
    const s: StepState[] = ["active", "todo", "todo", "todo"];
    const update = (i: number, v: StepState) => {
      s[i] = v;
      setSteps([...s]);
    };
    setSteps([...s]);
    const det: string[] = [];
    const explain = (i: number, t: string) => {
      det[i] = t;
      setDetails([...det]);
    };
    setDetails([]);
    const fail = (i: number, msg: string) => {
      update(i, "error");
      setResult({ ok: false, msg });
      setBusy(false);
    };

    await sleep(500 * speed);
    const pool = pools[parsed.denom];
    const commitment = await commitmentOf(parsed);
    if (!(commitment in pool.leaves)) {
      return fail(0, "No deposit in this pool matches the note, so a real prover couldn't build a proof.");
    }
    explain(0, `commitment = H(nullifier, secret) = ${shorten(commitment, 10, 6)}`);
    update(0, "done");
    update(1, "active");
    await sleep(700 * speed);
    explain(1, `Leaf #${pool.leaves[commitment].toLocaleString()} of ${pool.count.toLocaleString()}. The real proof hides which leaf.`);
    update(1, "done");
    update(2, "active");
    await sleep(1600 * speed);
    const nullifierHash = await nullifierHashOf(parsed);
    explain(2, `Public output: nullifierHash = H(nullifier) = ${shorten(nullifierHash, 10, 6)}`);
    update(2, "done");
    update(3, "active");
    await sleep(900 * speed);
    if (pool.spent.includes(nullifierHash)) {
      return fail(3, `Nullifier hash ${shorten(nullifierHash)} has already been spent. Rejected as a double-spend.`);
    }
    const payout = amount - fee;
    onWithdraw({ denom: parsed.denom, commitment, nullifierHash, recipient: recipient.trim(), payout, fee });
    explain(3, `nullifierHash not in the spent set, so it is accepted and added. Recipient ${shorten(recipient.trim())}.`);
    update(3, "done");
    const tx = "0x" + randHex(32);
    setResult({ ok: true, msg: `Sent ${payout} ${TOKEN} to ${shorten(recipient.trim())}.`, tx });
    toast("Withdrawal complete");
    setBusy(false);
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <label htmlFor="ns-note" className="text-sm font-medium text-ns-muted">
          Note
        </label>
        <InfoTip>The secret note you saved when you deposited. It stays in this browser tab and is never uploaded.</InfoTip>
      </div>
      <textarea
        id="ns-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        spellCheck={false}
        placeholder={`${brandSlug(name)}-10eth-…`}
        className="w-full resize-none rounded-xl border border-ns-border bg-ns-surface-2 px-4 py-3 font-mono text-xs leading-relaxed text-ns-text placeholder:text-ns-muted/60 focus:border-ns-teal focus:outline-none"
      />
      {noteError && <p className="mt-1.5 text-xs text-ns-danger">{noteError}</p>}

      <div className="mb-2 mt-4 flex items-center justify-between">
        <label htmlFor="ns-recipient" className="text-sm font-medium text-ns-muted">
          Recipient address
        </label>
        <button onClick={() => setRecipient(randAddress())} className="inline-flex items-center gap-1 text-xs font-semibold text-ns-teal hover:underline">
          <RefreshCw className="size-3" /> Use a fresh address
        </button>
      </div>
      <input
        id="ns-recipient"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        spellCheck={false}
        placeholder="0x…"
        className="h-12 w-full rounded-xl border border-ns-border bg-ns-surface-2 px-4 font-mono text-xs text-ns-text placeholder:text-ns-muted/60 focus:border-ns-teal focus:outline-none"
      />
      {addrError && <p className="mt-1.5 text-xs text-ns-danger">{addrError}</p>}
      {linksBack && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ns-warn">
          <CircleAlert className="size-3.5" /> This is your connected address. Withdrawing here links the two sides again.
        </p>
      )}

      <div className="mt-4 rounded-xl border border-ns-border bg-ns-surface-2 p-4 text-sm">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            Use relayer
            <InfoTip>A fresh address has no coins to pay gas. A relayer submits the transaction and takes a small fee from the withdrawal.</InfoTip>
          </span>
          <input type="checkbox" checked={relayer} onChange={(e) => setRelayer(e.target.checked)} className="peer sr-only" />
          <span className="relative h-6 w-11 rounded-full bg-ns-surface-3 transition peer-checked:bg-ns-teal after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" aria-hidden />
        </label>
        <dl className="mt-3 space-y-1.5 border-t border-ns-border pt-3 text-xs">
          <Row k="Pool" v={parsed ? `${parsed.denom} ${TOKEN}` : "—"} />
          <Row k={`Relayer fee (${+(feeRate * 100).toFixed(2)}%)`} v={parsed ? `${fee} ${TOKEN}` : "—"} />
          <Row k="You receive" v={parsed ? `${+(amount - fee).toFixed(6)} ${TOKEN}` : "—"} strong />
        </dl>
      </div>

      <Button size="lg" className="mt-5 w-full" onClick={withdraw} loading={busy} disabled={!parsed || !isAddress(recipient)}>
        {busy ? "Working…" : "Withdraw"}
      </Button>

      {steps && (
        <ol className="mt-5 space-y-2.5">
          {STEPS.map((label, i) => (
            <li key={label} className="text-sm">
              <div className="flex items-center gap-2.5">
                {steps[i] === "done" && <CircleCheck className="size-4 shrink-0 text-ns-ok" />}
                {steps[i] === "active" && <LoaderCircle className="size-4 shrink-0 animate-spin text-ns-teal" />}
                {steps[i] === "error" && <CircleAlert className="size-4 shrink-0 text-ns-danger" />}
                {steps[i] === "todo" && <span className="size-4 shrink-0 rounded-full border border-ns-border-strong" />}
                <span className={steps[i] === "todo" ? "text-ns-muted" : ""}>{label}</span>
              </div>
              {teacher && details[i] && <p className="ml-[26px] mt-1 break-all font-mono text-[11px] text-ns-violet">{details[i]}</p>}
            </li>
          ))}
        </ol>
      )}

      {result && (
        <div className={`mt-4 rounded-xl border p-3.5 text-sm ${result.ok ? "border-ns-ok/30 bg-ns-teal-soft text-ns-text" : "border-ns-danger/30 bg-ns-danger-soft text-ns-danger"}`}>
          <p>{result.msg}</p>
          {result.tx && (
            <p className="mt-1 font-mono text-xs text-ns-muted">
              Tx {shorten(result.tx, 10, 8)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ns-muted">{k}</dt>
      <dd className={strong ? "font-semibold text-ns-teal" : ""}>{v}</dd>
    </div>
  );
}
