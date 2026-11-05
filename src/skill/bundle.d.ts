/** The skill's kit.mjs: the geometry kit as one file needing only polygon-clipping, `{{url}}` unfilled. */
export function bundleKit(): string;
/** The skill's fit.mjs: the fit and check as one script with no dependencies, `{{url}}` unfilled. */
export function bundleFit(): string;
/** Writes both scripts into a folder; `url` fills `{{url}}`. Returns the files written. */
export function writeSkillScripts(dir: string, o?: { url?: string }): string[];
