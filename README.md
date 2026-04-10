# Optical Margin

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

### React component

```tsx
import { OpticalMarginText } from '@liiift-studio/opticalmargin'

<OpticalMarginText hangStart={true} hangEnd={true}>
  "Typography is the craft of endowing human language with a durable visual form."
</OpticalMarginText>
```

### React hook

```tsx
import { useOpticalMargin } from '@liiift-studio/opticalmargin'

const ref = useOpticalMargin({ hangStart: true, hangEnd: true })
<blockquote ref={ref}>{children}</blockquote>
```

### Vanilla JS

```ts
import { applyOpticalMargin, removeOpticalMargin, getCleanHTML } from '@liiift-studio/opticalmargin'

const el = document.querySelector('blockquote')
const original = getCleanHTML(el)
applyOpticalMargin(el, original, { hangStart: true, hangEnd: true })

// Later — restore original markup:
removeOpticalMargin(el, original)
```

---

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `hangStart` | `true` | Hang opening punctuation at line starts |
| `hangEnd` | `true` | Hang closing punctuation and sentence-end marks at line ends |
| `threshold` | `0.5` | Minimum hang amount in px before applying. Prevents near-zero corrections on characters that barely protrude |
| `maxHangRatio` | `0.9` | Max proportion of the character's advance width to hang (0–1). Caps extreme hangs on very wide punctuation |
| `as` | `'p'` | HTML element to render, e.g. `'blockquote'`, `'h1'`. *(React component only)* |

---

## How it works

Canvas `measureText` returns both `width` (advance width) and `actualBoundingBoxLeft` / `actualBoundingBoxRight` (visual bounds). The difference between advance width and visual bounds is the optical overhang — how far a character's ink sits inside its typographic cell. That value, clamped by `maxHangRatio` and `threshold`, is applied as `margin-inline-start` (start hang) or `margin-inline-end` (end hang) on the line span wrapping each detected line. Using logical properties means the direction is correct in both LTR and RTL contexts. The algorithm re-runs on resize and after fonts finish loading (`document.fonts.ready`).

The start character set includes: `"` `'` `"` `'` `«` `(` `[`. The end character set includes: `.` `,` `;` `:` `!` `?` `"` `'` `"` `'` `»` `-` `–` `—` `…` `)` `]`.

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
- **RTL support** — swap start/end hang sides based on computed `direction` style
- **Intersection Observer** — skip measurement for off-screen elements and re-run when they enter the viewport

---

Current version: v1.0.0
