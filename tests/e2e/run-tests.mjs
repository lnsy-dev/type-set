/**
 * E2E test runner wrapper.
 *
 * The Playwright configuration handles starting the static server; this script
 * just invokes the Playwright test runner so the npm script stays simple.
 */

import { spawnSync } from 'child_process';
import process from 'process';

const args = ['playwright', 'test', ...process.argv.slice(2)];
const result = spawnSync('npx', args, { stdio: 'inherit', shell: false });
process.exit(result.status ?? 1);
