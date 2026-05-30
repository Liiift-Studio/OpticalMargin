# Optical Margin

[![npm](https://img.shields.io/npm/v/%40liiift-studio%2Fopticalmargin.svg)](https://www.npmjs.com/package/@liiift-studio/opticalmargin) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![part of liiift type-tools](https://img.shields.io/badge/liiift-type--tools-blueviolet)](https://github.com/Liiift-Studio/type-tools)

CSS `hanging-punctuation` is Safari-only, uses hard-coded character tables, and gives no control over hang amount, threshold, or which characters hang. Optical Margin measures each punctuation character's actual hang amount from Canvas font metrics — not a lookup table — and applies it as a negative margin. Works in every browser, with every font.

**[opticalmargin.com](https://opticalmargin.com)** · [npm](https://www.npmjs.com/package/@liiift-studio/opticalmargin) · [GitHub](https://github.com/Liiift-Studio/OpticalMargin)

TypeScript · Canvas measurement · Cross-browser · React + Vanilla JS

---

## Install

```bash
npm install @liiift-studio/opticalmargin
```

---

## Usage

> **Next.js App Router:** this library uses browser APIs. Add `"use client"` to any component file that imports from it.

### React component

```tsx
import { OpticalMarginText } from '@liiift-studio/opticalmargin'

<OpticalMarginText>
  "Typography is the craft of endowing human language with a durable visual form."
</OpticalMarginText>
```

Both `hangStart` and `hangEnd` default to `true`, so no props are required for standard use.

### React hook

```tsx
import { useOpticalMargin } from '@liiift-studio/opticalmargin'

// Inside a React component (options object is required; pass {} for defaults):
const ref = useOpticalMargin({})
return <blockquote ref={ref}>{children}</blockquote>
```

The hook re-runs automatically on resize via `ResizeObserver` and after fonts load via `document.fonts.ready`.

### Vanilla JS

```ts
import { applyOpticalMargin, removeOpticalMargin, getCleanHTML } from '@liiift-studio/opticalmargin'

const el = document.querySelector('blockquote')
const original = getCleanHTML(el)
const opts = { hangStart: true, hangEnd: true }

function run() {
  applyOpticalMargin(el, original, opts)
}

run()
document.fonts.ready.then(run)

const ro = new ResizeObserver(() => run())
ro.observe(el)

// Later — disconnect and restore original markup:
// ro.disconnect()
// removeOpticalMargin(el, original)
```

### TypeScript

```ts
import type { OpticalMarginOptions } from '@liiift-studio/opticalmargin'

const opts: OpticalMarginOptions = { threshold: 1, maxHangRatio: 0.8 }
```

---

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `hangStart` | `true` | Hang opening punctuation at line starts |
| `hangEnd` | `true` | Hang closing punctuation and sentence-end marks at line ends |
| `threshold` | `0.5` | Minimum effective hang amount in px before applying (compared after `hangFractions` multiplication). Prevents near-zero corrections on characters that barely protrude |
| `maxHangRatio` | `0.9` | Max proportion of the character's advance width to hang (0–1). Clamped to [0,1]. Caps extreme hangs on very wide punctuation |
| `hangFractions` | see below | Per-character hang fraction overrides. Keys are single characters; values are fractions (0–1) of the measured hang to apply (0 = no hang, 1 = full hang). You can pass a sparse object — unspecified characters fall back to built-in defaults. Default fractions: hyphens/dashes `1.0`, quotes/parens/brackets `0.8`, periods/exclamations `0.8`, commas/semicolons/colons `0.6` |

**`OpticalMarginText` component only:**

| Prop | Default | Description |
|------|---------|-------------|
| `as` | `'p'` | HTML element to render, e.g. `'blockquote'`, `'h1'` |

`OpticalMarginText` also forwards all standard HTML attributes (`aria-label`, `id`, `role`, `className`, `style`, etc.) to the root element.

---

## How it works

Canvas `measureText` returns both `width` (advance width) and `actualBoundingBoxLeft` / `actualBoundingBoxRight` (visual bounds). The difference between advance width and visual bounds is the optical overhang — how far a character's ink sits inside its typographic cell. That value, clamped by `maxHangRatio` and `threshold`, is applied as `margin-inline-start` (start hang) or `margin-inline-end` (end hang) on each line span. Using logical properties means the direction is correct in both LTR and RTL contexts. The algorithm re-runs on resize and after fonts finish loading (`document.fonts.ready`).

**Start character set:** `"` `'` `"` `'` `«` `(` `[`

**End character set:** `.` `,` `;` `:` `!` `?` `"` `'` `"` `'` `»` `-` `–` `—` `…` `)` `]`

Falls back to zero hang (no margin applied) in environments without Canvas support (e.g. SSR).

**Line break safety:** Line breaks are locked to the browser's natural layout. Word breaks never change — the negative margins only affect the optical edge position, not line content or width.

---

## API reference

### `getCleanHTML(el: HTMLElement): string`

Returns the element's innerHTML with all optical-margin injected markup (`om-word` spans, `om-line` spans, `<br data-om>` separators) stripped. Safe to call multiple times — idempotent.

Use this to capture the **original HTML snapshot** before the first `applyOpticalMargin` call. The snapshot must be passed as the second argument to both `applyOpticalMargin` and `removeOpticalMargin` every time they are called.

```ts
const original = getCleanHTML(el)  // capture once, before any apply

function run() {
  applyOpticalMargin(el, original, opts)
}

// Later:
removeOpticalMargin(el, original)  // same snapshot
```

**Important:** Always capture the snapshot from the element's initial state (or via `getCleanHTML` on an already-applied element). Never pass `el.innerHTML` directly after `applyOpticalMargin` has run — the snapshot will include injected markup and the algorithm will double-wrap on the next call.

---

## Dev notes

### `next` in root devDependencies

`package.json` at the repo root lists `next` as a devDependency. This is a **Vercel detection workaround** — not a real dependency of the npm package. Vercel's build system inspects the root `package.json` to detect the framework; without `next` present it falls back to a static build and skips the Next.js pipeline, breaking the `/site` subdirectory deploy.

The package itself has zero runtime dependencies. Do not remove this entry.

---

## Future improvements

- **Hanging numerals** — detect and hang numerals (`1`, `7`) that protrude into the margin at display sizes
- **Configurable character set** — expose a `hangChars` option to override which characters are considered candidates, beyond the built-in punctuation list
- **Per-side max hang** — separate `maxHangStart` / `maxHangEnd` ratios for asymmetric control
- **RTL auto-detection** — automatically swap start/end hang sides based on the element's computed `direction` style
- **Intersection Observer** — skip measurement for off-screen elements and re-run when they enter the viewport

---

See [CHANGELOG](https://github.com/Liiift-Studio/OpticalMargin/releases) for version history.
