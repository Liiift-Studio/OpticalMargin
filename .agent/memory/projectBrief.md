---
name: project-brief
description: Core identity, scope, and constraints for optical-margin
type: project
---

# optical-margin — Project Brief

## Identity
- **Package name**: `optical-margin`
- **Version**: 0.0.1 (pre-release)
- **Author**: Quinn Keaveney / Liiift Studio

## What It Is
CSS hanging-punctuation is Safari-only with no weight control. Detects characters at line starts (opening quotes) and line ends (periods, commas, hyphens, closing quotes). Measures each character's actual visual bounding box vs advance width using Canvas measureText or opentype.js. Hang amount = advanceWidth - visualWidth — font-agnostic for any character in any language.

## What It Is Not
- Not a general animation library
- Not a CSS preprocessor
- Not a font loading utility

## API Surface (target)
Options: hangStart, hangEnd, threshold, fontUrl

## Constraints
- Framework-agnostic core (vanilla JS)
- Optional React bindings (peer deps)
- SSR safe (guard typeof window)
- Zero required dependencies (opentype.js optional)
- TypeScript strict mode

## Status
Bootstrap complete. Algorithm not yet implemented.
See PROCESS.md for the build guide.
