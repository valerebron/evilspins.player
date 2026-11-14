# Converted to Importable NPM Package ✅

## Summary
The project is now an importable Vue 3 component library. Users can install and use it as:

```vue
<script setup lang="ts">
import { Card, type Card as CardType } from 'evilspins-player'
import 'evilspins-player/style.css'
</script>

<template>
  <Card :card="myCard" :back-color="#1e293b" />
</template>
```

## Changes Made

### 1. package.json
- Removed `"private": true`
- Added proper `"main"`, `"module"`, `"types"`, `"exports"` fields
- Added `"files": ["dist"]`
- Moved runtime deps to `dependencies` (vue, blurhash)
- Added `"peerDependencies"` for vue
- Added `"sideEffects": false` for tree-shaking
- Added metadata: description, author, license, keywords

### 2. Build Configs
- **vite.lib.config.ts** - Library build configuration
  - Entry: `src/index.ts`
  - Output: ESM (`evilspins-player.es.js`) + UMD (`evilspins-player.umd.js`)
  - External: `vue` (peer dependency)
  - CSS extracted to `style.css`
  - `publicDir: false` to avoid copying public assets
  - `emptyOutDir: true` for clean builds

- **tsconfig.lib.json** - TypeScript config for declaration generation
  - `declaration: true`
  - `emitDeclarationOnly: true`
  - `declarationDir: ./dist`
  - Excludes app-specific files (main.ts, App.vue)

### 3. Entry Point (src/index.ts)
Exports:
- Components: `Card`, `CardElement`, `Platine`, `RankComponent`, `PlayButton`, `Loader`, `PlayPauseIcon`
- SVG Components: `HeartSVG`, `DiamondSVG`, `ClubSVG`, `SpadeSVG`
- Types: `CardType`, `Suit`, `RankType`
- Composables: `useAutoplayGate`, `useScreenWakeLock`, `useIsTouchInterface`
- Utils: `getYearColor`, `timeout`
- Platine internals: `Disc`, `Sampler`

### 4. Static Assets Handling
- Moved SVGs from `public/` to `src/assets/`
- Import with `?url` suffix in components for proper bundling
- Assets copied to `dist/assets/` with original names

### 5. Component Adjustments
- `CardElement.vue`: Uses imported SVG URLs instead of public paths
- `Platine.vue`: Uses imported favicon/rewind SVGs
- Created `src/styles/main.scss` with Tailwind + custom CSS variables
- Created `src/vite-env.d.ts` for Vue/asset type declarations

### 6. Build Scripts
```json
{
  "build": "vue-tsc -b && vite build",           // App build
  "build:lib": "vite build -c vite.lib.config.ts && vue-tsc -p tsconfig.lib.json"  // Library build
}
```

## Output (dist/)
```
dist/
├── evilspins-player.es.js      # ESM bundle
├── evilspins-player.es.js.map
├── evilspins-player.umd.js     # UMD bundle
├── evilspins-player.umd.js.map
├── style.css                   # Extracted CSS
├── index.d.ts                  # Main type definitions
├── components/                 # Component .d.ts files
├── composables/                # Composable .d.ts files
├── types/                      # Type .d.ts files
├── utils/                      # Utility .d.ts files
└── plugins/                    # Plugin .d.ts files
```

## Usage in Consumer Project

```bash
npm install evilspins-player
```

```vue
<!-- MyComponent.vue -->
<script setup lang="ts">
import { Card, type Card as CardType } from 'evilspins-player'
import 'evilspins-player/style.css'

const myCard: CardType = {
  url_audio: 'https://example.com/audio.mp3',
  url_image: 'https://example.com/cover.jpg',
  year: 2024,
  month: '01',
  day: '15',
  hour: '12',
  artist: 'Artist Name',
  title: 'Track Title',
  esid: 'unique-id',
  slug: 'track-slug',
  createdAt: new Date(),
  suit: '♥',
  rank: 'A'
}
</script>

<template>
  <Card :card="myCard" :back-color="#1e293b" />
</template>
```

## Note on Type Declarations
The generated `index.d.ts` references `.vue` files directly (e.g., `./components/Card.vue`). This works with modern TypeScript/Vue setups that use `vue-tsc` or `volar`. For maximum compatibility, consider using a tool like `unplugin-dts` or `rollup-plugin-dts` to generate a single bundled declaration file in the future.