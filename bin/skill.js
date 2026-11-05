#!/usr/bin/env node
/**
 * logomarks-skill <dir> [--url <url>]: writes the design skill's scripts/kit.mjs and scripts/fit.mjs into <dir>,
 * generated from @logomarks/core. `{{url}}` stays in their headers unless --url fills it.
 */
import { writeSkillScripts } from '../src/skill/bundle.js';

const args = process.argv.slice(2), at = args.indexOf('--url');
const url = at >= 0 ? args.splice(at, 2)[1] : undefined;
if (!args[0]) {
	console.log('Usage: logomarks-skill <dir> [--url <url>]');
	process.exit(1);
}
for (const file of writeSkillScripts(args[0], { url })) console.log('wrote', file);
