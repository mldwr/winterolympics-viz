# Winter Olympics Medal Rankings Bump Chart

[![Live Dashboard](https://img.shields.io/badge/Live-Dashboard-blue)](https://winterolympics.orange-goose.com/)
[![Article](https://img.shields.io/badge/Article-Read%20More-orange)](https://orange-goose.com/article/winter-olympics-viz)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB)](https://react.dev)
[![Deployed on Cloudflare](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Workers-F38020)](https://workers.cloudflare.com)

An interactive data visualization dashboard that tracks Winter Olympics medal rankings across all games from **1924 to 2026**. The bump chart reveals the shifting balance of power in winter sports over a century of competition.

**Live dashboard:** [winterolympics.orange-goose.com](https://winterolympics.orange-goose.com/)  
**Accompanying article:** [orange-goose.com/article/winter-olympics-viz](https://orange-goose.com/article/winter-olympics-viz)

> **Note:** This project was generated using DeepSeek-V4-Flash via [Cline](https://github.com/cline/cline).

---

## Overview

The dashboard visualizes how nations' medal rankings have changed over time using a **bump chart** — a line chart where the Y-axis represents rank (rank 1 at the top) and the X-axis represents each Olympic Games. 
Each nation is represented by a colored line with interactive flags in the legend.

The visualization highlights several compelling narratives:

| Story | Nations |
|---|---|
| 🇳🇴 **Norway's Winter Legacy** | Norway |
| ❄️ **The Cold War Powerhouses** | Soviet Union, East Germany, Unified Team, Russia |
| 🌏 **The Rise of Asian Nations** | South Korea, China, Japan |
| 🏠 **The Home Field Advantage** | USA, Canada, Norway, Russia, Italy |
| 🇩🇪 **German Unity on Ice** | Germany, East Germany, West Germany, United Team of Germany |
| 🏂 **The "X-Games" Effect** | USA, Canada |
| ⛰️ **The Infrastructure Barrier** | Switzerland, Austria, France, Norway, USA, Canada |

---

## Features

- **Interactive bump chart** — Hover over any nation's line or legend entry to highlight its trajectory. Click to toggle multiple selections for comparison.
- **Curated stories** — Pre-built narrative filters that highlight specific nations and key years with reference lines.
- **Responsive design** — Optimized for mobile (≤1023px) with bucketed time periods, reduced nation count, and touch-friendly interactions.
- **Flag icons** — 50+ nation flags from [flagcdn.com](https://flagcdn.com), plus custom SVGs for historical entities (Soviet Union, East Germany, Czechoslovakia, etc.).
- **Rich tooltips** — Grouped by medal count with flag thumbnails and tabular-numeral formatting.
- **Dark theme** — Slate/navy color scheme with subtle glass-morphism effects.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [React 19](https://react.dev) | UI framework |
| [Vite 7](https://vitejs.dev) | Build tool and dev server |
| [Recharts 3](https://recharts.org) | Charting library (bump chart with `LineChart`, `CartesianGrid`, `ReferenceLine`) |
| [Cloudflare Workers](https://workers.cloudflare.com) | Hosting and deployment via [Wrangler](https://developers.cloudflare.com/workers/wrangler/) |
| [ESLint 9](https://eslint.org) | Code linting with `eslint-plugin-react-hooks` and `react-refresh` |

### Data pipeline dependencies
- **`cheerio`** / **`axios`** — Wikipedia scraping (`src/scripts/scrape_wikipedia.js`)
- **`arquero`** — Data processing and cleaning (`src/scripts/clean_data.js`)

---

## Data

Medal data is sourced from Wikipedia and processed through a two-step pipeline:

1. **Scraping** (`src/scripts/scrape_wikipedia.js`) — Fetches medal tables from Wikipedia for each Winter Olympic Games.
2. **Cleaning** (`src/scripts/clean_data.js`) — Normalizes nation names, handles historical entities, and produces CSV files.

The cleaned data is stored in `public/data/` as CSV files:
- `medals_year_total_nation.csv` — Total medals by nation and year (primary dataset)
- `medals.csv` — Individual medal-level records

### Ranking methodology

The bump chart uses **dense ranking**: nations with the same medal count share the same rank. For example, if two nations tie for 3rd place, both are assigned rank 3 and the next nation is rank 4.

### Mobile data aggregation

On mobile viewports (≤1023px width), years are bucketed into 6 time periods to reduce visual density and improve legibility. The bucketing aggregates medal totals within each period before computing ranks.

---

## Project Structure

```
winterolympics-viz/
├── public/
│   ├── data/                    # CSV data files
│   ├── flags/                   # Custom SVG flags for historical nations
│   └── orange_goose_logo.png   # Branding logo
├── src/
│   ├── components/
│   │   ├── ChartCard.jsx        # Bump chart container with Recharts integration
│   │   ├── Header.jsx           # App header with summary statistics
│   │   ├── OlympicRings.jsx     # Olympic rings SVG icon
│   │   └── Stories.jsx          # Curated story selector and detail panel
│   ├── scripts/
│   │   ├── scrape_wikipedia.js  # Wikipedia data scraper
│   │   └── clean_data.js        # Data cleaning and normalization
│   ├── assets/                  # Static assets
│   ├── App.jsx                  # Main application logic and state management
│   ├── App.css                  # Application styles (dark theme)
│   ├── constants.js             # Nation-to-flag mapping
│   ├── index.css                # Global base styles
│   ├── main.jsx                 # React entry point
│   └── stories.js               # Curated story definitions
├── index.html                   # HTML entry point
├── vite.config.js               # Vite configuration
├── wrangler.jsonc               # Cloudflare Workers configuration
├── eslint.config.js             # ESLint configuration
└── package.json                 # Dependencies and scripts
```

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/mldwr/winterolympics-viz.git
cd winterolympics-viz

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Deployment

The project is deployed on **Cloudflare Workers** using Wrangler:

```bash
npm run deploy
```

This runs `vite build` followed by `wrangler deploy` to publish the static site to Cloudflare's global edge network.

---

## License

© 2026 [Orange Goose Analytics](https://orange-goose.com). All rights reserved.

Data sourced from Wikipedia. Flag icons from [flagcdn.com](https://flagcdn.com) and custom SVGs for historical entities.
