/** A point on the canvas, y pointing down. */
export type Point = [number, number];
/** A closed ring of points (the last joins the first). */
export type Ring = Point[];
/** A polygon: an outer ring, then its holes. */
export type Polygon = Ring[];
/** A shape: a set of polygons, as polygon-clipping returns it. */
export type Shape = Polygon[];
/** Anything the booleans take: one polygon or a shape. */
export type Geom = Polygon | Shape;
/** A box: `[x0, y0, x1, y1]`. */
export type Box = [number, number, number, number];
/** A point in 3D, for the iso helpers: x down-right, y down-left, z up. */
export type Point3 = [number, number, number];
/** An iso projection: a 3D point to the canvas. */
export type Projection = (x: number, y: number, z: number) => Point;
