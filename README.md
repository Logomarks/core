# @logomarks/core

Geometry, SVG reading, fitting, analysis and similarity for logomarks on a 512 grid: the kit the [Logomarks](https://logomarks.ai) set is drawn with.

## Install

```bash
npm install @logomarks/core
npm install clipper-lib   # only for the shape edits (reshape)
```

## Quick start

```js
import { U, D, rect, circle, svg } from '@logomarks/core/geometry';
import { fitMark, checkFit } from '@logomarks/core/fit';

// Moonrise: a block with a half-moon bitten out of the top, a sun left floating in the bite.
const raw = svg(U(D(rect(0, 0, 300, 300), circle(150, 0, 120)), circle(150, 30, 46)));
const { svg: mark } = fitMark(raw);   // 512 canvas, longest side 448, centred, 0.1 grid
checkFit(mark).problems;              // []
```

## What's in it

- `/geometry`: shapes and real booleans, strokes, tracks, iso solids, badges and letter skeletons
- `/svg`: one SVG path parser, filled shapes, bounds and rings
- `/fit`: the 448 fit and its check
- `/analyse`: specks, slivers and pin-holes, gap and stroke widths, shape tags
- `/similar`: outline and letter signatures, IoU and nearest marks
- `/raster`: scanline fill, components, distance transform
- `/edit`: the studio's shape edits (weight, soften, gap, detail) and pixelate
- `/parts`: the parts the industry symbols are built from (Node)
- `logomarks-skill <dir>`: writes the design skill's `kit.mjs` and `fit.mjs`

Every export, repeatable drawings and the skill scripts: [API](https://github.com/Logomarks/core/blob/main/docs/api.md).

## Links

- [Docs](https://github.com/Logomarks/core/tree/main/docs)
- [Changelog](https://github.com/Logomarks/core/blob/main/CHANGELOG.md)
- [Licence](https://github.com/Logomarks/core/blob/main/LICENSE)
- [GitHub](https://github.com/Logomarks/core)

## Licence

MIT © ArrayPress Limited; author David Sherlock.
