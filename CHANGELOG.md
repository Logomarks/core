# Changelog

All notable changes to `@logomarks/core` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.7] — 2026-11-07

### Fixed

- `toPath()` and `deneedle()` keep every corner of an open ring. Both sliced the last point off each ring on the assumption it repeated the first, which holds for the booleans' rings (`U`, `D`, `I`, `grow`, `lens`, `drop`) but not the builders' (`poly`, `rect`, `circle`, `ellipse`, `rr`, `roundPoly`, `splineClosed`), so a hand-built `toPath([rect(…)])` lost a corner and `deneedle()` on an open ring lost one before trimming. They now drop the last point only when it lies within 1e-6 of the first. Every one of the 3,967 Logomarks SVGs round-trips (`svgShape` then `toPath`, `deneedle` and a sample through `grow`) to byte-identical path data as in 0.1.6, and 14 of the site's generator batches (247 marks) write identical files.

### Added

- `openRing(ring, eps = 1e-6)` and `closeRing(ring, eps = 1e-6)` in `/geometry`: a ring without or with its closing point, whichever way it came in. `grow()`'s ring reading uses `openRing` too (with an exact match, as before).

## [0.1.6] — 2026-11-07

### Fixed

- `filledShape()` and `svgShape()` read non-zero outlines whose subpaths overlap (font glyph outlines, as Bodoni Moda and DM Serif Display draw them) correctly. Each ring's winding was judged beside its longest edge, so an outer whose longest edge lay inside another contour was dropped and whole strokes vanished. When any two rings cross or touch, the fill now comes from the rings' summed winding (`windingFill`, exact however they overlap; opposite windings cancel, as a browser draws them); where the old reading already covered the same ground its polygons are kept. Every one of the 3,967 Logomarks SVGs (392 non-zero outlines among them) reads to identical polygons as in 0.1.5. Even-odd outlines are unchanged. The skill's generated `kit.mjs` carries the same reading.

### Added

- `nonzeroFill(rings, ops)`, `windingFill(rings, ops)` and `ringsMeet(rings)` in `/svg`: non-zero fill straight from rings, for glyph outlines and other non-zero path data.

## [0.1.5] — 2026-11-06

### Added

- `pixelCoverage(paths, grid)` measures how much of each pixel cell a mark covers from its rings, by scanline, so pixelate runs without a canvas (a server, a Worker); `pixelCells(cov, grid)` returns the filled cells themselves, for drawing them one by one (`@arraypress/covers` uses both for its pixel mosaic). `pixelPath` is unchanged.

## [0.1.4] — 2026-11-06

### Fixed

- The generated `fit.mjs` fits several files each in place. Given exactly two files it used to take the second as the output and write the first one's fit into it, so the second mark was lost. A file's fit now goes to another file only with `-o out.svg`, or when the second path doesn't exist yet (`in.svg out.svg`, as before). `--help` prints the usage (it used to crash), and an unknown option, a missing path or `-o` with several inputs exits 2 with the reason.

## [0.1.3] — 2026-11-06

### Fixed

- `letterSignatures()` counts a pixel as ink only above half coverage (8-bit alpha 128 and up, as `holecheck.mjs` did): with Float32 coverage, an alpha of 127 rounded past `127 / 255` and counted, which moved letter scores by about a hundredth and could reorder near matches.

## [0.1.2] — 2026-11-06

### Changed

- Renamed from `@logomarks/marks-kit` to `@logomarks/core`, and its bin from `marks-kit-skill` to `logomarks-skill` (the generated scripts' headers name both); no code changes. The repository is now github.com/Logomarks/core.

## [0.1.1] — 2026-11-05

### Changed

- Renamed to `@logomarks/marks-kit`; no code changes.

## [0.1.0] — 2026-11-05

### Added

- **Geometry** (`/geometry`): the Logomarks kit, split into modules: shapes, booleans with the opt-in `robust()` retry (and `robustOps(rand)`, which leaves polygon-clipping and `Math.random` alone), strokes, weaves, tracks, fillets, offsets, iso solids, modular systems, the house badges and PIX7, letter skeletons, glitch editions and `deneedle()`. Every generator of the Logomarks set redraws byte-identical with it.
- **SVG** (`/svg`): one path parser for everything that reads a mark, the filled elements of a file, outline bounds, rings, and a whole mark read back as a shape.
- **Fit** (`/fit`): `fitMark()` and `checkFit()`, byte-identical to the design skill's `fit.mjs`.
- **Analysis** (`/analyse`): pieces and holes (vector, or a scanline raster), small-part classification, gap and stroke widths, shape tags.
- **Similarity** (`/similar`): outline and letter signatures from coverage, IoU over all 8 rotations and flips, and `nearestAll()` for "More like this".
- **Raster** (`/raster`): scanline fill, connected components, distance transform, even-width runs.
- **Edits** (`/edit`): the studio's reshape (weight, soften, gap, detail with clipper-lib, an optional peer), adjustments and frames, and the pixelate grid.
- **Parts** (`/parts`): the industry-symbol parts merged into one set: placing and sizing, curves, house lines, badges, tiles, iso scenes, letters, trade objects, faceted heads, and the batch writer.
- **`marks-kit-skill`**: writes the design skill's single-file `kit.mjs` and `fit.mjs`.
