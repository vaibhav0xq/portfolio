// The facts behind the site. They mirror career/resume/Vaibhav_Gangani_Resume.html; the wording
// on the site is its own (see site.ts) but the facts must stay equal.

export const identity = {
  name: 'Vaibhav Gangani',
  education: 'Diploma in Computer Engineering',
  educationPeriod: '2021 to 2024',
  company: 'Talus Labs, Inc.',
  email: 'hello@vaibhav0xq.com',
  github: 'https://github.com/vaibhav0xq',
  linkedin: 'https://www.linkedin.com/in/vaibhav0xq',
  x: 'https://x.com/vaibhav_0xq',
  handle: 'vaibhav_0xq',
};

export type Product = {
  index: string;
  name: string;
  tagline: string;
  status: string;
  chain: string;
  period: string;
  image?: string;
  imageAlt?: string;
  /** Pixel size of the screenshot, so the print keeps its shape before the file arrives. */
  imageSize?: [number, number];
  points: string[];
  stack: string;
  links: { label: string; href: string }[];
};

export const products: Product[] = [
  {
    index: '01',
    name: 'Kyro',
    tagline: 'Wallet intelligence layer for pre-transaction checks on Arc',
    status: 'Live on Arc mainnet',
    chain: 'Arc',
    period: 'May 2026 to Present',
    image: 'projects/kyro.png',
    imageAlt: 'Kyro counterparty check page',
    imageSize: [1920, 1080],
    points: [
      'Kyro indexes wallet history on Arc and five other EVM chains, verifies transaction backed attestations and returns an allow, caution or block verdict with reason codes, a USDC limit and the evidence behind it.',
      'It offers a public check workbench, a decision API, receipts and batch screening, with a TypeScript SDK on npm, an OpenAPI 3.1 contract and a docs site. The agent payment gate demo was built for ETHOnline 2026.',
    ],
    stack: 'Next.js, TypeScript, Supabase Postgres, viem, OpenAPI, Vercel',
    links: [
      { label: 'thekyro.co', href: 'https://www.thekyro.co' },
      { label: 'Check workbench', href: 'https://www.thekyro.co/check' },
      { label: 'GitHub', href: 'https://github.com/vaibhav0xq/kyro-public' },
      { label: 'npm', href: 'https://www.npmjs.com/package/@kyrodev/sdk' },
    ],
  },
  {
    index: '02',
    name: 'LumenMarc',
    tagline: 'Fair value and integrity checks for Coinbase Tokenized Stocks on Base',
    status: 'Live on Base',
    chain: 'Base',
    period: 'Sep 2026',
    image: 'projects/lumenmarc.png',
    imageAlt: 'LumenMarc live reading gauge',
    imageSize: [1920, 1080],
    points: [
      'LumenMarc verifies a B20 token against the published Coinbase list, compares live DEX pool prices with the Chainlink reference feed and reports the premium or discount in basis points, along with oracle freshness and market session state.',
      'It has a public JSON API and a 24 hour reading history. I built it for the Base Build Builder Quest for Tokenized Stocks.',
    ],
    stack: 'React 19, Vite, Express, viem, Drizzle, Postgres, Netlify Functions',
    links: [
      { label: 'lumenmarc.netlify.app', href: 'https://lumenmarc.netlify.app' },
      { label: 'GitHub', href: 'https://github.com/vaibhav0xq/lumenmarc' },
    ],
  },
  {
    index: '03',
    name: 'Suho',
    tagline: 'Recipient checks and guarded sends on GIWA Sepolia',
    status: 'Live on GIWA Sepolia',
    chain: 'GIWA',
    period: 'Jul 2026',
    image: 'projects/suho.png',
    imageAlt: 'Suho recipient assay page',
    imageSize: [1920, 1080],
    points: [
      'Suho runs three Solidity contracts (registry, trust oracle and guarded send) with a 600 second recall window, so a sender can cancel before a transfer is released and claimed by the recipient.',
      'The console covers wallet sessions, recipient verdicts, guarded sends and an activity ledger synced from chain events.',
    ],
    stack: 'Solidity, Hardhat, Next.js, viem, Tailwind CSS',
    links: [
      { label: 'thesuho.xyz', href: 'https://www.thesuho.xyz' },
      { label: 'GitHub', href: 'https://github.com/vaibhav0xq/suho-on-giwa' },
    ],
  },
  {
    index: '04',
    name: 'Turnstile',
    tagline: 'Identity bound tickets and access on Monad',
    status: 'In progress on Monad testnet',
    chain: 'Monad',
    period: 'Sep 2026 to Present',
    points: [
      'Turnstile is passkey ticketing: one WebAuthn credential derives the purchase account, a per event door key that signs rotating entry codes and an AES-256-GCM key for a private passport. Users need no seed phrase and no wallet app.',
      'It runs on Foundry contracts on Monad testnet with 62 tests, a sponsored ERC-2771 relayer in Hono, an Envio HyperIndex indexer and a 3D city, venue and seat picker in React Three Fiber. It is my solo entry for Monad Metropolis.',
    ],
    stack: 'Solidity, Foundry, TypeScript, Hono, Envio, React Three Fiber',
    links: [{ label: 'GitHub', href: 'https://github.com/vaibhav0xq/turnstile' }],
  },
];

export const earlierBuilds = [
  { name: 'Receipts Network', what: 'proof pages on Shelby' },
  { name: 'Vyom', what: 'time locked capsules on Sui' },
];

export const resumePath = 'Vaibhav_Gangani_Resume.pdf';

export function asset(path: string) {
  return import.meta.env.BASE_URL + path;
}
