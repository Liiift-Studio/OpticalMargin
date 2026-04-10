# Optical Margin

Font-metric hanging punctuation — cross-browser optical margin alignment using actual canvas glyph bounds, not a lookup table. Works with any font including variable fonts.

**[opticalmargin.com](https://opticalmargin.com)** · [npm](https://www.npmjs.com/package/@liiift-studio/opticalmargin) · [GitHub](https://github.com/Liiift-Studio/OpticalMargin)

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

<OpticalMarginText hangStart hangEnd>
  "Typography is the craft of endowing human language with a durable visual form."
</OpticalMarginText>
```

### React hook

```tsx
import { useOpticalMargin } from '@liiift-studio/opticalmargin'

function Quote({ children }) {
  const ref = useOpticalMargin({ hangStart: true, hangEnd: true })
  return <blockquote ref={ref}>{children}</blockquote>
}
```

### Vanilla JS

```ts
import { applyOpticalMargin, getCleanHTML } from '@liiift-studio/opticalmargin'

const el = document.querySelector('blockquote')
const originalHTML = getCleanHTML(el)

applyOpticalMargin(el, originalHTML, { hangStart: true, hangEnd: true })
```

---

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hangStart` | `boolean` | `true` | Hang opening punctuation at line starts |
| `hangEnd` | `boolean` | `true` | Hang closing punctuation and sentence-end marks at line ends |
| `threshold` | `number` | `0.5` | Minimum hang amount in px before applying |
| `maxHangRatio` | `number` | `0.9` | Max proportion of character advance width to hang |

---

## Dev notes

### `next` in root devDependencies

`package.json` at the repo root lists `next` as a devDependency. This is a **Vercel detection workaround** — not a real dependency of the npm package. Vercel's build system inspects the root `package.json` to detect the framework; without `next` present it falls back to a static build and skips the Next.js pipeline, breaking the `/site` subdirectory deploy.

The package itself has zero runtime dependencies. Do not remove this entry.

---

Current version: v1.0.0
