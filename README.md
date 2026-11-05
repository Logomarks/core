# @arraypress/marks-kit

Geometry, SVG reading, fitting, analysis and similarity for logomarks on a 512 grid. It is the kit the [Logomarks](https://logomarks.ai) set is drawn with: shapes and real booleans, strokes, tracks, iso solids, badges and letter skeletons; one SVG path parser; the 448 fit; speck, width and shape-tag analysis; outline and letter signatures; the studio's shape edits; and the parts the industry symbols are built from.

## Install

```bash
npm install @arraypress/marks-kit
npm install clipper-lib   # only for the shape edits (reshape)
```

## Usage

```js
import { U, D, rect, circle, svg } from '@arraypress/marks-kit/geometry';
import { fitMark, checkFit } from '@arraypress/marks-kit/fit';

// Moonrise: a block with a half-moon bitten out of the top, a sun left floating in the bite.
const raw = svg(U(D(rect(0, 0, 300, 300), circle(150, 0, 120)), circle(150, 30, 46)));
const { svg: mark } = fitMark(raw);   // 512 canvas, longest side 448, centred, 0.1 grid
checkFit(mark).problems;              // []
```

## API

| Subpath | Exports |
|---|---|
| `/geometry` | Booleans `U D I X`, `robust()`, `robustOps(rand)`; shapes `circle ellipse rect regular annulus sector arcBand bar ring roundPoly rr lens drop squircle pill egg`; transforms `rot move scale flipX rotN mapPts`; lines `stroke weave tracks trackLoop fillet filletClosed offsetPts walk balloon`; `grow soften grown over slices`; iso `iso cubes isoPrism isoBlock isoRing isoPile`; modular `segments segmentLines isoPieces blocks nest linkage`; badges `BADGE place knockout clearance PIX7 pixels checker dsegs`; letters `SKEL skelSolid`; `glitchMark deneedle seeded`; measures `area signedArea perimeter bbox ringBox winding`; output `toPath svg write` |
| `/svg` | `parsePath` (absolute M L C Q A Z), `shapes` (filled elements), `bounds`, `outlinePoints`, `rings`, `filledShape`, `svgShape`, `pathRings`, `arcOf`, `bezierAt` |
| `/fit` | `fitMark(svg)`, `checkFit(svg)`, `CANVAS`, `FIT` |
| `/analyse` | `markParts` and `smallParts` (specks, slivers, pin-holes), `widths` (gaps and strokes), `shapeTags` |
| `/similar` | `outlineSignature`, `letterSignatures`, `variants`, `iou`, `nearestAll` (from coverage arrays: bring any renderer) |
| `/raster` | `frameOf`, `fill` (scanline), `components`, `distance`, `channels` |
| `/edit` | `reshape` (weight, soften, gap, detail), `pieceCount`, `smallSizeInfo`, `adjustPaths`, `transformPath`, `pixelGrid`, `pixelPath` |
| `/parts` | The industry-symbol parts: `exact`, `turn`, `sized`, `chain`, `badge`, `spline`, `duoLine`, `tiles`, `scene`, `letterSolid`, `shearOf`, `rocket`, `facetHead`, `runIndustry` … (Node) |

`marks-kit-skill <dir>` writes the design skill's single-file `kit.mjs` (needs only polygon-clipping) and `fit.mjs` (no dependencies), with `{{url}}` in their headers.

Drawings repeat byte for byte: call `robust()` once, and set `Math.random = seeded(name)` before each mark.

## License

MIT © ArrayPress Limited
