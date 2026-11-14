# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**evilspins-player** - A Vue 3 component library for interactive audio cards with vinyl-style playback. The library exports reusable components (Card, CardElement, Platine, Rank, PlayButton, etc.) that can be imported and used in other Vue projects.

## Key Commands

```bash
# Development
pnpm dev                    # Start Vite dev server (demo app)

# Building
pnpm run build              # Build demo app (vue-tsc + vite build)
pnpm run build:lib          # Build library (ESM + UMD + types)
pnpm run preview            # Preview built demo app

# Type checking
vue-tsc --noEmit            # Type check without emitting files
```

## Architecture

### Public API (src/index.ts)
Exports:
- **Components**: Card, CardElement, Platine, Rank, PlayButton, Loader, PlayPauseIcon
- **SVG Components**: HeartSVG, DiamondSVG, ClubSVG, SpadeSVG
- **Types**: CardData, Suit, RankType, CardSize, CardTransitionConfig, PlatineProgressConfig, PlatinePhysicsConfig, PlatineAnimationConfig, YearColorMap
- **Composables**: useAutoplayGate, useScreenWakeLock, useIsTouchInterface
- **Utils**: getYearColor, timeout, Disc, Sampler

### Component Hierarchy
```
Card (main wrapper)
├── CardElement (flip card with face-up/face-down)
│   ├── Rank (suit + number display)
│   └── PlayButton (interactive play/pause)
│       └── PlayPauseIcon (animated SVG icon)
└── Platine (vinyl turntable playback)
```

### Data Flow
- **CardData** interface (`src/types/types.ts`) - Generic card data contract:
  - Required: `audioUrl`
  - Optional: `imageUrl`, `blurhash`, `title`, `artist`, `year`, `startTime`, `suit`, `rank`
  - Extensible via `[key: string]: unknown`
- All components accept `CardData` via props
- Slots provide customization points for content

### Key Features
- **Slot-based customization**: All components expose slots with props for full content control
- **Configurable physics/animation**: Platine accepts `progressConfig`, `animationConfig`, `physicsConfig` props
- **Year-based color theming**: `getYearColor()` with customizable `YearColorMap`
- **Screen Wake Lock API**: Prevents screen sleep during playback
- **Touch/mouse unified interaction**: Works on both desktop and mobile

## Library Build Configuration

- **vite.lib.config.ts**: Library mode, externalizes Vue, CSS extraction to `style.css`
- **tsconfig.lib.json**: Declaration generation for `dist/index.d.ts`
- Outputs: ESM (`evilspins-player.es.js`), UMD (`evilspins-player.umd.js`), types

## Development Notes

- No test framework configured
- No linting configured (ESLint/Prettier not in devDependencies)
- Uses pnpm as package manager
- Tailwind CSS v3.4 with custom colors (`esyellow`, etc.)
- Vue 3 Composition API with `<script setup>` throughout
- Self-closing `<slot>` elements must pass props as attributes (not `v-slot`)

## Git Rules
- Use existing default Git identity
- Never modify Git identity config
- Never use "Claude" or "Anthropic" as commit author
- Never add Co-Authored-By trailers referencing AI agents