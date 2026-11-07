"use client";

import { useState } from "react";
import { Menu, Wallet, X } from "lucide-react";
import { Button } from "./ui";
import { formatUsd, shorten, TOKEN } from "@/lib/nullset/sim";
import { useEthUsd } from "@/lib/nullset/price";
import { useBrand } from "@/lib/nullset/brand";

export interface DemoWallet {
  address: string;
  balance: number;
}

const LINKS = [
  { href: "#pool", label: "Pool" },
  { href: "#stats", label: "Statistics" },
  { href: "#mixing", label: "Live pool" },
];

function EthereumIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 417" className={className} fill="currentColor" aria-hidden>
      <path d="M127.9 0 125.1 9.5v275.6l2.8 2.8 127.9-75.6L127.9 0Z" opacity=".85" />
      <path d="M127.9 0 0 212.3l127.9 75.6V0Z" />
      <path d="m127.9 312.2-1.6 1.9v98.1l1.6 4.6 128-180.3-128 75.7Z" opacity=".85" />
      <path d="M127.9 416.8V312.2L0 236.5l127.9 180.3Z" />
    </svg>
  );
}

export function Logo() {
  const { name } = useBrand();
  return (
    <a href="#top" className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-ns-teal sm:text-3xl" aria-label={`${name} home`}>
      <img src="/tornado-mark.png" alt="" className="size-11 shrink-0 object-contain sm:size-12" />
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
    <div className={`flex items-center justify-end gap-2 ${full ? "w-full" : ""}`}>
      <div className="flex flex-col items-end justify-center py-1">
        <span className="inline-block rounded-md bg-ns-teal px-5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ns-teal-ink">
          CONNECTED
        </span>
        <div className="mt-1 flex flex-col items-end leading-tight">
          <span className="text-[15px] font-bold tracking-tight text-ns-teal">
            {wallet.balance.toLocaleString(undefined, { maximumFractionDigits: 5 })} {TOKEN}
          </span>
          <span className="text-[13px] font-semibold tracking-tight text-ns-muted">
            $34,636.53
          </span>
        </div>
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
  const rate = useEthUsd();
  return (
    <header className="sticky top-0 z-40 border-b border-ns-border bg-ns-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center gap-4 px-4 lg:gap-6">
        <Logo />
        <nav className="hidden items-center gap-4 whitespace-nowrap text-[13px] text-ns-muted lg:flex xl:gap-5">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-ns-text">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <span className="inline-flex h-11 items-center gap-2 rounded-sm border border-ns-border bg-ns-surface-2 px-3 text-xs font-bold text-ns-text">
            <span className="grid size-6 place-items-center rounded-[3px] border border-ns-teal/50 bg-ns-teal-soft text-ns-teal">
              <EthereumIcon className="size-3.5" />
            </span>
            Ethereum
          </span>
          <div className="w-60">
            <WalletButton {...props} full />
          </div>
        </div>
        {props.wallet && (
          <div
            className="ml-auto flex flex-col items-end justify-center lg:hidden"
            aria-label="Connected wallet"
          >
            <span className="inline-block rounded-md bg-ns-teal px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ns-teal-ink">
              CONNECTED
            </span>
            <div className="mt-0.5 flex flex-col items-end leading-tight">
              <span className="text-[13px] font-bold tracking-tight text-ns-teal">
                {props.wallet.balance.toLocaleString(undefined, { maximumFractionDigits: 5 })} {TOKEN}
              </span>
              <span className="text-[11px] font-semibold tracking-tight text-ns-muted">
                $34,636.53
              </span>
            </div>
          </div>
        )}
        <button
          className={`${props.wallet ? "" : "ml-auto"} grid size-10 shrink-0 place-items-center rounded-sm border border-ns-border lg:hidden`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-ns-border bg-ns-bg px-4 pb-5 pt-3 lg:hidden">
          <nav className=" mb-3 flex flex-col text-[15px]">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-ns-border/60 py-3 text-ns-text">
                {l.label}
              </a>
            ))}
          </nav>
          <WalletButton {...props} full />
        </div>
      )}
    </header>
  );
}
