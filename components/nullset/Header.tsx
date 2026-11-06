"use client";

import { useState } from "react";
import { BookOpen, Menu, Wallet, X } from "lucide-react";
import { Button } from "./ui";
import { shorten, TOKEN } from "@/lib/nullset/sim";
import { DEFAULT_BRAND, useBrand } from "@/lib/nullset/brand";

export interface DemoWallet {
  address: string;
  balance: number;
}

const LINKS = [
  { href: "#pool", label: "Pool" },
  { href: "#stats", label: "Statistics" },
  { href: "#mixing", label: "Live pool" },
  { href: "#deposits", label: "Deposits" },
  { href: "#history", label: "Mixes" },
  { href: "#how", label: "How it works" },
];

export function Logo() {
  const { name } = useBrand();
  return (
    <a href="#top" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight" aria-label={`${name} home`}>
      <svg viewBox="0 0 32 32" className="size-8" fill="none" aria-hidden>
        <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.4" opacity=".2" />
        <circle cx="16" cy="16" r="13" stroke={DEFAULT_BRAND.primary} strokeWidth="2.4" strokeDasharray="20 62" strokeLinecap="round" />
        <path d="M9 23 23 9" stroke={DEFAULT_BRAND.secondary} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      {name}
    </a>
  );
}

function WalletButton({ wallet, connecting, onConnect, onDisconnect, full }: HeaderProps & { full?: boolean }) {
  if (!wallet) {
    return (
      <Button onClick={onConnect} loading={connecting} className={full ? "w-full" : ""}>
        {!connecting && <Wallet className="size-4" />}
        Connect wallet
      </Button>
    );
  }
  return (
    <div className={`flex items-center gap-2 ${full ? "w-full" : ""}`}>
      <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-ns-border bg-ns-surface-2 px-3 text-sm">
        <span className="size-2 rounded-full bg-ns-ok" aria-hidden />
        <span className="font-mono text-xs">{shorten(wallet.address)}</span>
        <span className="ml-auto pl-2 font-semibold text-ns-teal">
          {wallet.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} {TOKEN}
        </span>
      </div>
      <Button variant="ghost" size="md" onClick={onDisconnect} aria-label="Disconnect wallet" className="px-3">
        <X className="size-4" />
      </Button>
    </div>
  );
}

interface HeaderProps {
  wallet: DemoWallet | null;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function Header(props: HeaderProps) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-ns-border bg-ns-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-ns-muted md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-ns-text">
              {l.label}
            </a>
          ))}
          <a href="#how" className="inline-flex items-center gap-1.5 hover:text-ns-text">
            <BookOpen className="size-4" /> Docs
          </a>
        </nav>
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ns-border bg-ns-surface-2 px-3 py-1 text-xs font-semibold text-ns-muted">
            <span className="size-1.5 rounded-full bg-ns-violet" /> Ethereum
          </span>
          <div className="w-80">
            <WalletButton {...props} full />
          </div>
        </div>
        <button
          className="ml-auto grid size-10 place-items-center rounded-xl border border-ns-border md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-ns-border bg-ns-bg px-4 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col text-[15px]">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-ns-border/60 py-3 text-ns-text">
                {l.label}
              </a>
            ))}
            <a href="#how" onClick={() => setOpen(false)} className="inline-flex items-center gap-2 py-3">
              <BookOpen className="size-4" /> Docs
            </a>
          </nav>
          <WalletButton {...props} full />
        </div>
      )}
    </header>
  );
}
