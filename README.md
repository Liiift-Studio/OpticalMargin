# optical-margin

> Font-metric hanging punctuation — cross-browser optical margin alignment using actual glyph bounds, not a lookup table

## Concept

CSS hanging-punctuation is Safari-only with no weight control. Detects characters at line starts (opening quotes) and line ends (periods, commas, hyphens, closing quotes). Measures each character's actual visual bounding box vs advance width using Canvas measureText or opentype.js. Hang amount = advanceWidth - visualWidth — font-agnostic for any character in any language.

## Install

```bash
npm install optical-margin
```

## Usage

### React

```tsx
import { OpticalMarginText } from 'optical-margin'

<OpticalMarginText>
  Your paragraph text here.
</OpticalMarginText>
```

### Vanilla JS

```ts
import { applyOpticalMargin, getCleanHTML } from 'optical-margin'

const el = document.querySelector('p')
const original = getCleanHTML(el)
applyOpticalMargin(el, original, { /* options */ })
```

## Options

| Option | Description |
|--------|-------------|
| `hangStart` | boolean, default true |
| `hangEnd` | boolean, default true |
| `threshold` | minimum hang in px before applying |
| `fontUrl` | optional, for sub-pixel glyph bounds via opentype.js |

## Development

```bash
npm install
npm test
npm run build
```

---

Part of the [Liiift Studio](https://liiift.studio) typography tools family.
See also: [Ragtooth](https://ragtooth.liiift.studio)
