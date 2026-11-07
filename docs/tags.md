# Shape tags

`shapeTags(coverage, { w, h, size })` tags a fitted mark (512 canvas, mark centred) from its coverage raster. The
tags are measured, never guessed from names. `shapeMeasures()` returns the numbers they are decided on, and
`tagsOf(measures, thresholds)` decides them, so a caller can show the measures or try other thresholds.

Rasterise at 256 px (the default `size`). The thresholds were tuned there, on the 4,040 Logomarks marks, against
contact sheets of random samples per tag, until about 95% read right by eye.

```js
import { shapeTags, shapeMeasures, tagsOf, SHAPE } from '@logomarks/core/analyse';

const tags = shapeTags(alpha, { w: 448, h: 380, size: 256 }); // e.g. ['wide', 'solid', 'symmetric']
```

## The tags

| Tag | Rule (`SHAPE`) |
|---|---|
| `wide` / `tall` | width over height above 1.25, or below 0.8 |
| `round` | about square (0.9 to 1.11); the ink reaches its convex hull all round (`reach` ≥ 0.6); and the hull runs on a circle, any one of: `arc` ≥ 0.74 with `circularity` ≥ 0.89, `arc` ≥ 0.65 with `circularity` ≥ 0.96, or `rim` ≥ 0.8 with `circularity` ≥ 0.97 |
| `square` | about square, not round; its closed silhouette fills the box (`closedFill` ≥ 0.88) and every corner (`closedCorners` ≥ 0.6) |
| `light` / `solid` | light when the pieces are strokes (`elongation` ≥ 3) and under 30% of the ink lies in parts thicker than 48 units or than 12% of the short side (`min(thick, thickRelative)` < 0.3); every other mark is solid. Every mark gets exactly one. |
| `symmetric` | the left-right mirror matches: coverage ≥ 0.95 and outline ≥ 0.95. A top-bottom mirror alone (a K, a C, an arrow) doesn't count. |
| `radial` | a turn by a third, a quarter or a fifth about the centre of mass matches: coverage ≥ 0.9 and outline ≥ 0.9 (rotational symmetry of order 3 or more; a half turn alone, an S or a Z, doesn't count) |

## The measures

All from the binary ink (pixels over half covered). Lengths in canvas units scale with `size`.

- **`reach`:** 180 rays from the hull's centre; the share on which the outermost ink gets within 8% of the hull. A
  flower or a ring of dots doesn't reach between its petals or dots.
- **`arc`:** the share of the hull's edge within 2.5% of the circle most of it lies on. That circle is found by a
  least-squares fit, then 300 point triples tried in a fixed order, then three refits on the points within 4%, so a
  cut-off cap, a Q's tail or a ball on the rim doesn't pull it.
- **`rim`:** 360 rays from that circle's centre; the share whose outermost ink lies within 7% of its radius. It
  catches round marks whose hull is chorded by gaps (a segmented ring).
- **`circularity`:** the hull's 4πA/P². A disc is 1; a hexagon about 0.95 on the raster; a square 0.79.
- **`closedFill`, `closedCorners`:** the ink closed by a disc of radius 30 (gaps up to 60 join, so a modular tile or
  a grid of dots reads as one block), holes filled; its share of the ink's box, and the filled share of its emptiest
  corner patch (30% of the short side). A shield fails on its round corners; an octagon on its fill.
- **`mirror`:** across the box's vertical middle, two ways. `coverage` is overlap over union (a big solid badge
  dominates it); `outline` is the share of outline pixels that land within 4 units of the outline (a small
  asymmetric glyph inside a badge breaks it). Both must pass.
- **`turns`:** the same two scores for turns of order 3, 4 and 5 about the coverage's centre of mass (an order 6 or 8
  mark passes 3 or 4).
- **`thick`, `thickRelative`:** the share of the ink covered by discs of diameter 48 (or 12% of the short side) that
  fit inside it, from the distance transform. Using either lets a wide mark's strokes, thick for its height, still
  read light.
- **`elongation`:** each piece's area over its width squared (width = 4 × its mean depth), averaged by area. A stroke
  scores about its length over its width; a dot 1.8; a square block 2.3. Dots and blocks are solid.

## Known limits

- Mixed marks sit on the weight line: a monoline drawing with one solid part (an eye with a solid pupil), heavy
  monoline letters (strokes about 50 wide), iso objects whose faces are strokes. Around 5% of light marks read
  borderline.
- Wavy-edged or petalled round marks (a sun with rays, a flower) are not round: their ink doesn't reach the hull all
  round.
