# Nullset

An interactive, fully simulated privacy-pool (coin mixer) interface for
teaching how zero-knowledge mixers work: deposit, secret note, Merkle tree,
nullifier, proof, withdrawal to a fresh address.

**Nothing here is real.** No wallet is contacted, no blockchain is used and
no funds move. All state lives in the browser tab. Hashes are real SHA-256.

## Features

- Simulated wallet picker and connect flow
- Deposit (fixed denominations, secret note backup) and withdraw (relayer,
  step-by-step proof, double-spend check)
- Pool statistics, live mixing animation, public ledger ("what the
  blockchain sees"), previous mixes
- Teacher view: reveals the private deposit→withdrawal link and per-step
  hashes, plus presenter controls (balance, fee, speed, pool sizes,
  branding: name and colours)

## Develop

```
npm install
npm run dev        # http://localhost:3000
```

## Build and host

```
npm run build      # writes a static site to ./out
npm start          # preview ./out locally
```

Upload the contents of `out/` to any static host (Netlify, Cloudflare
Pages, GitHub Pages, shared hosting, or your own server behind a .org
domain). No server-side code or database is needed.

Stack: Next.js 16 (static export), React 19, TypeScript, Tailwind CSS 4,
Lucide icons.
