# API

Every subpath is also re-exported from the root (`@logomarks/core`), except `/parts`, which needs Node.

| Subpath | Exports |
|---|---|
| `/geometry` | Booleans `U D I X`, `robust()`, `robustOps(rand)`; shapes `circle ellipse rect regular annulus sector arcBand bar ring roundPoly rr lens drop squircle pill egg`; transforms `rot move scale flipX rotN mapPts`; lines `stroke weave tracks trackLoop fillet filletClosed offsetPts walk balloon`; `grow soften grown over slices`; iso `iso cubes isoPrism isoBlock isoRing isoPile`; modular `segments segmentLines isoPieces blocks nest linkage`; badges `BADGE place knockout clearance PIX7 pixels checker dsegs`; letters `SKEL skelSolid`; `glitchMark deneedle seeded`; measures `area signedArea perimeter bbox ringBox winding`; output `toPath svg write` |
| `/svg` | `parsePath` (absolute M L C Q A Z), `shapes` (filled elements), `bounds`, `outlinePoints`, `rings`, `filledShape`, `svgShape`, `pathRings`, `arcOf`, `bezierAt` |
| `/fit` | `fitMark(svg)`, `checkFit(svg)`, `CANVAS`, `FIT` |
| `/analyse` | `markParts` and `smallParts` (specks, slivers, pin-holes), `widths` (gaps and strokes), `shapeTags` |
| `/similar` | `outlineSignature`, `letterSignatures`, `variants`, `iou`, `nearestAll` (from coverage arrays: bring any renderer) |
| `/raster` | `frameOf`, `fill` (scanline), `components`, `distance`, `channels` |
| `/edit` | `reshape` (weight, soften, gap, detail), `pieceCount`, `smallSizeInfo`, `adjustPaths`, `transformPath`, `pixelGrid`, `pixelPath`, `pixelCells`, `pixelCoverage` |
| `/parts` | The industry-symbol parts: `exact`, `turn`, `sized`, `chain`, `badge`, `spline`, `duoLine`, `tiles`, `scene`, `letterSolid`, `shearOf`, `rocket`, `facetHead`, `runIndustry` … (Node) |

The shape edits in `/edit` load [clipper-lib](https://www.npmjs.com/package/clipper-lib), an optional peer, the first time they are needed.

## Repeatable drawings

Drawings repeat byte for byte: call `robust()` once, and set `Math.random = seeded(name)` before each mark.

## The design skill's scripts

```bash
npx logomarks-skill <dir> [--url <url>]
```

Writes `scripts/kit.mjs` (one file, needs only polygon-clipping) and `scripts/fit.mjs` (no dependencies) into `<dir>`. `{{url}}` stays in their headers unless `--url` fills it.
