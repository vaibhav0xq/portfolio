// Site prose. Facts come from profile.ts; this file only decides how they are said.

import type { DoodleName } from '@/components/Doodle';

export const sections = [
  { id: 'work', label: 'work' },
  { id: 'projects', label: 'projects' },
  { id: 'about', label: 'about' },
  { id: 'hire', label: 'why me' },
  { id: 'contact', label: 'contact' },
];

export const loader = {
  status: 'loading',
  ready: 'ready',
};

export const hero = {
  status: 'remote · open to work',
  titleLines: ['Community', 'moderator,'],
  titleEm: 'now',
  titleB: 'building',
  titleMark: 'web3 products.',
  lede: {
    before: 'I spent a year as the Discord moderator at ',
    org: 'Talus Labs, Inc.',
    after:
      ' guiding members and keeping scams out. Since March 2026 I have been developing my own products end to end, from Solidity contracts to the frontend. Kyro, the latest, is live on Arc mainnet.',
  },
  primary: 'see the projects',
  secondary: 'say hello',
  note: 'a year of moderation, then four products of my own',
  scroll: 'scroll',
  now: 'currently: building Kyro on Arc',
  // The three taped prints beside the title. Not product screenshots (those are in Projects) but
  // three pages from the notebook: a real code excerpt, a system sketch and a member's words.
  prints: [
    {
      key: 'code',
      kind: 'code',
      caption: 'a guarded send, in Solidity',
      date: 'jul 2026',
      // Verbatim from GuardedSend.sol in vaibhav0xq/suho-on-giwa (sendGuarded), two long lines wrapped.
      lines: [
        'id = _sends.length;',
        'uint64 releaseAt =',
        '    uint64(block.timestamp) + recallWindow;',
        '_sends.push(',
        '    PendingSend({',
        '        sender: msg.sender,',
        '        recipient: recipient,',
        '        amount: msg.value,',
        '        releaseAt: releaseAt,',
        '        claimed: false,',
        '        cancelled: false',
        '    })',
        ');',
        '_pendingBySender[msg.sender].push(id);',
        '',
        'emit Sent(id, msg.sender, recipient,',
        '    msg.value, releaseAt);',
      ],
      mark: { line: 2, start: 30, length: 12 },
      note: '600 s to cancel',
    },
    {
      key: 'sketch',
      kind: 'sketch',
      caption: 'how Kyro fits together',
      date: 'may 2026',
      labels: {
        sources: 'arc + 5 evm chains',
        attest: 'attestations',
        indexer: 'indexer',
        api: 'decision api',
        verdict: ['allow,', 'caution', 'or block'],
        outs: ['check page', 'sdk on npm', 'receipts'],
      },
    },
    {
      key: 'note',
      kind: 'note',
      caption: 'a member, on X',
      date: 'dec 12, 2025',
      quote:
        'these guys are always on the front line taking the heat and answering every single question! you guys are the best',
      who: '@juicybitnina',
      about: 'about the Talus mods',
    },
  ] satisfies HeroPrint[],
};

type PrintBase = { key: string; caption: string; date: string };

export type HeroPrint =
  | (PrintBase & { kind: 'code'; lines: string[]; mark: { line: number; start: number; length: number }; note: string })
  | (PrintBase & {
      kind: 'sketch';
      labels: { sources: string; attest: string; indexer: string; api: string; verdict: string[]; outs: string[] };
    })
  | (PrintBase & { kind: 'note'; quote: string; who: string; about: string });

type WorkRow = {
  when: string;
  where: string;
  role: string;
  org: string;
  points: string[];
  doodle: DoodleName;
  tag: string;
};

export const work = {
  idx: '01 / experience',
  title: 'Work',
  pen: 'two roles so far',
  rows: [
    {
      when: 'jul 2025 to jul 2026',
      where: 'one year, remote',
      role: 'Discord Moderator',
      org: 'Talus Labs, Inc.',
      points: [
        'Most of my time went to the help channels: wallets that would not connect to the hub, roles that had not been applied and account problems. I answered in public, step by step, so the next person with the same issue could find the fix.',
        'The rest was keeping the server safe: impersonation attempts, suspicious links and spam. I flagged them early, escalated the serious cases and kept the channels usable.',
        'I also helped run announcements and events: community takeovers with a lineup of hosts, workshops on the Talus stage and updates from the team written up for members. I handled internal information with care.',
      ],
      doodle: 'megaphone',
      tag: 'support, safety and events',
    },
    {
      when: 'may 2026 to now',
      where: 'independent, remote',
      role: 'Founder and Developer',
      org: 'Kyro, wallet checks on Arc',
      points: [
        'Kyro checks whether a wallet can be trusted before money moves. I built it alone, from the indexer that reads Arc and five other EVM chains to the public check page.',
        'It went live on Arc on mainnet launch day, September 16, 2026, with a decision API, receipts, batch screening and a TypeScript SDK on npm.',
        'I also maintain the OpenAPI 3.1 contract, the docs site and the deploys. For ETHOnline 2026 I built an agent payment gate demo on top of Kyro.',
      ],
      doodle: 'tools',
      tag: 'indexer, API, SDK and frontend',
    },
  ] satisfies WorkRow[],
  // Screenshots from the Talus server and X. Each opens full size. Handles of other members are
  // visible in some, which he approved.
  board: {
    title: 'From the Talus server',
    pen: 'a few posts from that year',
    lede: 'Announcements I wrote, a fix that got people connected and a shout out from the community. Open one to read it.',
    open: 'open full size',
    close: 'close',
    items: [
      {
        key: 'wallet-fix',
        src: 'community/wallet-fix.png',
        alt: 'Discord post by Vaibhav with numbered steps to connect a Solana wallet on the Talus hub. A member replies: thank you Vaibhav bro, now connected.',
        cap: 'a wallet fix that worked',
        date: 'sep 2025',
        w: 717,
        h: 799,
      },
      {
        key: 'shoutout',
        src: 'community/shoutout.png',
        alt: 'Post on X by juicybitnina thanking the Talus moderators Mubbyz042, Yushatotz and vaibhav_0xq for answering every question.',
        cap: 'a shout out on X',
        date: 'dec 2025',
        w: 600,
        h: 298,
      },
      {
        key: 'takeover',
        src: 'community/takeover.png',
        alt: 'Discord announcement by Vaibhav: community takeover live again, with four hosts and their workshop times on the Talus stage.',
        cap: 'my takeover announcement',
        date: 'nov 2025',
        w: 734,
        h: 418,
      },
      {
        key: 'workshop',
        src: 'community/workshop.png',
        alt: 'Discord announcement by Vaibhav for a Talus workshop on why an X account is not ranking on Kaito, with date, venue, host and a registration link.',
        cap: 'a workshop announcement',
        date: 'oct 2025',
        w: 1347,
        h: 369,
      },
      {
        key: 'lineup',
        src: 'community/lineup.png',
        alt: 'Discord message by Vaibhav listing the day\'s community takeover lineup: five hosts with their sessions and times.',
        cap: 'the lineup for a takeover day',
        date: 'nov 2025',
        w: 900,
        h: 290,
      },
    ],
  },
};

export const projects = {
  idx: '02 / projects',
  title: 'Projects',
  pen: 'screenshots and live links',
  hint: 'scroll to move along the shelf',
  open: 'open',
  noImage: 'no screenshot yet, in progress on Monad testnet',
  earlierTitle: 'Earlier builds',
  earlierText: 'Two smaller products from before Kyro. Both public on GitHub.',
};

export const about = {
  idx: '03 / about',
  title: 'About',
  pen: 'the short version',
  text: [
    'I am Vaibhav, a solo developer from Gujarat, India, with a Diploma in Computer Engineering (2021 to 2024). I work remotely.',
    'I started in web3 on the community side, answering members and handling incidents for a year as an official Discord moderator. Then I began building the products I kept wishing existed. On the other side I am a small content creator.',
  ],
  facts: [
    { k: 'based in', v: 'Gujarat, India, remote' },
    { k: 'education', v: 'Diploma, Computer Engineering, 2021 to 2024' },
    { k: 'building since', v: 'March 2026' },
    { k: 'chains so far', v: 'Arc, Base, GIWA, Monad, Sui, Solana' },
  ],
  useTitle: 'what I use and where',
  // Tool names sit between backticks and are set in the typewriter face. Every tool named here is
  // on the resume; the products are the proof of where it was used.
  use: [
    {
      label: 'contracts',
      text: 'Solidity, with `Foundry` for Turnstile (62 tests on Monad testnet) and `Hardhat` for Suho. `ERC-2771` relays so users do not pay gas, `EIP-712` typed signatures, `Sui Move` for Vyom. Contracts live on GIWA Sepolia and Monad testnet.',
    },
    {
      label: 'chain data',
      text: '`viem` on Kyro, LumenMarc and Suho. Kyro has its own indexer across Arc and five other EVM chains, Turnstile uses `Envio HyperIndex` and LumenMarc reads `Chainlink feeds` for its reference prices.',
    },
    {
      label: 'apis and data',
      text: '`Node.js` on the server side, `Hono` for the Turnstile relayer and `Express` for LumenMarc. `REST and OpenAPI`, with a 3.1 contract published for Kyro. `Postgres` through `Supabase` on Kyro and `Drizzle` on LumenMarc, `SQL` underneath.',
    },
    {
      label: 'frontend',
      text: '`TypeScript` on every product, `JavaScript` where a project needs it. `React` with `Next.js` on Kyro and Suho, `Vite` on LumenMarc and this site, `Tailwind CSS` for layout. `React Three Fiber` on top of `Three.js` for the seat picker in Turnstile and the taped prints at the top of this page.',
    },
    {
      label: 'identity',
      text: '`WebAuthn passkeys` in Turnstile, where one credential derives the purchase account and signs the rotating entry codes. No seed phrase or wallet app is needed.',
    },
    {
      label: 'community',
      text: 'A year in the Talus Labs, Inc. Discord: support and onboarding, incident escalation, scam and impersonation response, events and announcements. `Dyno`, `MEE6`, `Carl-bot` and `Ticket Tool` for the automation and the tickets.',
    },
    {
      label: 'day to day',
      text: '`Git` and `GitHub Actions`, `Vercel` for Kyro and `Netlify` for LumenMarc, `Biome` for lint and format, `Notion` for notes and `VS Code`.',
    },
  ],
};

export const hire = {
  idx: '04 / why me',
  title: 'Why hire me',
  pen: 'four reasons',
  reasons: [
    {
      n: '01',
      title: 'Community and code',
      text: 'I have supported a community for a year and I have built products for one. I can explain a technical change without jargon, write documentation that people read and spot a bad actor early.',
    },
    {
      n: '02',
      title: 'End to end delivery',
      text: 'I take a product from the contracts and the indexer to the API, the frontend and the deploy. Four products since May 2026, each one public with a URL.',
    },
    {
      n: '03',
      title: 'Live products',
      text: 'Kyro has been on Arc mainnet since launch day, LumenMarc is on Base and Suho is on GIWA Sepolia. You can open any of them today.',
    },
    {
      n: '04',
      title: 'Used to incidents',
      text: 'A year of moderation taught me to escalate early, write things down and handle internal information with care.',
    },
  ],
  roles: 'Open to remote roles: full stack or smart contract developer, developer relations, community engineering.',
  stamp: 'open to work',
};

/** Shown in place of any image that would not load. */
export const missing = {
  note: 'this print did not load',
  hint: 'reload the page to try again',
};

export const contact = {
  idx: '05 / contact',
  title: 'Say hello',
  pen: 'I read every message',
  text: 'Email is the fastest way to reach me. My code is on GitHub and I post on X.',
  resume: 'resume (pdf)',
  footer: 'Vaibhav Gangani, 2026. Made with React, Three.js and GSAP.',
};
