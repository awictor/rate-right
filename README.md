# RateRight 🟢

**Freelance & consulting rate calculator.** Enter what you want to take home; get the hourly, day, and weekly rate you must actually charge after tax, business expenses, and unbillable time. Runs 100% in the browser — no signup, offline.

![version](https://img.shields.io/badge/version-0.7.0-0E9488) ![status](https://img.shields.io/badge/status-live-0E9488) [![CI](https://github.com/awictor/rate-right/actions/workflows/ci.yml/badge.svg)](https://github.com/awictor/rate-right/actions/workflows/ci.yml)

## Why

Most freelancers set a rate by halving a salary and get crushed by taxes, expenses, and the 40% of the week that is never billable. RateRight works backward from your real take-home goal to the rate that actually gets you there.

## Features

- Required **hourly / day / week** rate from a take-home target
- Accounts for **tax gross-up, business expenses, working weeks, and utilization (billable %)**
- Revenue breakdown + **billable hours/year** + a reality-check note
- Dark mode, inputs remembered locally, zero dependencies — one \`index.html\`

## Run

Open \`index.html\` in any browser, or host free on GitHub Pages / Netlify / Cloudflare Pages.

## Test

\`\`\`
node tests/selftest.mjs
\`\`\`

## License

MIT © Alex Wictor
