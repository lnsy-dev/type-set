/**
 * Visual regression tests for type-set SVG export.
 *
 * For each case we screenshot the live canvas, render the exported SVG in the
 * same page, and compare the two images with pixelmatch. Any mismatch writes a
 * diff PNG to tests/e2e/__output__/ for manual review.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '__output__');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const DEFAULT_FONT_SIZE = '48';
const DEFAULT_LINE_HEIGHT = '1.25';

/**
 * Compare two PNG files and write a diff image.
 */
function comparePngs(canvasPath, svgPath, diffPath, { threshold = 0.1, maxDiffRatio = 0.02 }) {
  const img1 = PNG.sync.read(fs.readFileSync(canvasPath));
  const img2 = PNG.sync.read(fs.readFileSync(svgPath));

  if (img1.width !== img2.width || img1.height !== img2.height) {
    throw new Error(
      `Size mismatch for ${path.basename(canvasPath)}: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`
    );
  }

  const diff = new PNG({ width: img1.width, height: img1.height });
  const diffCount = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {
    threshold,
    includeAA: false,
  });

  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  const total = img1.width * img1.height;
  const ratio = diffCount / total;

  return { diffCount, ratio, width: img1.width, height: img1.height };
}

/**
 * Configure the <type-set> element on the fixture page.
 */
async function configureEditor(page, { text, ...attrs }) {
  await page.goto('/fixture');

  await page.evaluate(
    async ({ text, attrs }) => {
      await window.typeSetReady;
      const editor = window.editor;

      editor.text = text;
      for (const [key, value] of Object.entries(attrs)) {
        editor.setAttribute(key, String(value));
      }

      await editor._loadFonts();
      await document.fonts.ready;
    },
    { text, attrs }
  );
}

/**
 * Capture a canvas screenshot and a matching SVG screenshot.
 */
async function capturePair(page, name) {
  const canvasPath = path.join(OUTPUT_DIR, `${name}-canvas.png`);
  const svgPath = path.join(OUTPUT_DIR, `${name}-svg.png`);
  const diffPath = path.join(OUTPUT_DIR, `${name}-diff.png`);

  const canvas = page.locator('type-set canvas');
  const canvasBox = await canvas.boundingBox();
  await canvas.screenshot({ path: canvasPath });

  const svg = await page.evaluate(() => window.editor.exportSVG());

  await page.evaluate(
    ({ svg, width, height }) => {
      const host = document.getElementById('svg-host');
      host.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:${height}px;background:#ffffff;z-index:9999;visibility:visible;`;
      host.innerHTML = '';

      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      const svgEl = doc.documentElement;
      svgEl.setAttribute('width', '100%');
      svgEl.setAttribute('height', '100%');
      host.appendChild(svgEl);
    },
    { svg, width: canvasBox.width, height: canvasBox.height }
  );

  await page.locator('#svg-host').screenshot({ path: svgPath });

  await page.evaluate(() => {
    const host = document.getElementById('svg-host');
    host.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;';
    host.innerHTML = '';
  });

  return { canvasPath, svgPath, diffPath, svg };
}

/**
 * Run a single visual regression case.
 */
async function runVisualCase(page, name, config, { threshold = 0.1, maxDiffRatio = 0.02 } = {}) {
  await configureEditor(page, config);
  const paths = await capturePair(page, name);
  const result = comparePngs(paths.canvasPath, paths.svgPath, paths.diffPath, {
    threshold,
    maxDiffRatio,
  });

  console.log(`[${name}] canvas ${result.width}x${result.height} diff=${result.diffCount} ratio=${(result.ratio * 100).toFixed(3)}%`);

  expect(result.ratio).toBeLessThan(maxDiffRatio);
}

test.describe('SVG export visual regression', () => {
  test('single line', async ({ page }) => {
    await runVisualCase(page, 'single-line', {
      text: 'Hello',
      'font-size': DEFAULT_FONT_SIZE,
      'line-height': DEFAULT_LINE_HEIGHT,
    });
  });

  test('explicit newlines', async ({ page }) => {
    await runVisualCase(page, 'explicit-newlines', {
      text: 'Line1\nLine2\nLine3',
      'font-size': DEFAULT_FONT_SIZE,
      'line-height': DEFAULT_LINE_HEIGHT,
    });
  });

  test('wrapped paragraph', async ({ page }) => {
    await runVisualCase(page, 'wrapped-paragraph', {
      text: 'The quick brown fox jumps over the lazy dog while the typography engine wraps the sentence.',
      'font-size': DEFAULT_FONT_SIZE,
      'line-height': DEFAULT_LINE_HEIGHT,
    });
  });

  test('right aligned', async ({ page }) => {
    await runVisualCase(page, 'right-aligned', {
      text: 'Right aligned',
      'text-align': 'right',
      'font-size': DEFAULT_FONT_SIZE,
      'line-height': DEFAULT_LINE_HEIGHT,
    });
  });

  test('center aligned', async ({ page }) => {
    await runVisualCase(page, 'center-aligned', {
      text: 'Center aligned',
      'text-align': 'center',
      'font-size': DEFAULT_FONT_SIZE,
      'line-height': DEFAULT_LINE_HEIGHT,
    });
  });

  test('justified', async ({ page }) => {
    await runVisualCase(page, 'justified', {
      text: 'Justified text should spread evenly across the full line width in the editor.',
      'text-align': 'justify',
      'font-size': DEFAULT_FONT_SIZE,
      'line-height': DEFAULT_LINE_HEIGHT,
    });
  });

  test('letter spacing', async ({ page }) => {
    await runVisualCase(page, 'letter-spacing', {
      text: 'Spaced out',
      'letter-spacing': '4',
      'font-size': DEFAULT_FONT_SIZE,
      'line-height': DEFAULT_LINE_HEIGHT,
    });
  });

  test('line height', async ({ page }) => {
    await runVisualCase(page, 'line-height', {
      text: 'Tall line one\nTall line two',
      'line-height': '2.0',
      'font-size': DEFAULT_FONT_SIZE,
    });
  });

  test('ligatures', async ({ page }) => {
    await runVisualCase(page, 'ligatures', {
      text: 'fi ffi fl ff',
      'font-size': DEFAULT_FONT_SIZE,
      'line-height': DEFAULT_LINE_HEIGHT,
    });
  });

  test('kerning', async ({ page }) => {
    await runVisualCase(page, 'kerning', {
      text: 'AVA Ta To',
      'font-size': DEFAULT_FONT_SIZE,
      'line-height': DEFAULT_LINE_HEIGHT,
    });
  });

  test('per-character weight and italic', async ({ page }) => {
    await page.goto('/fixture');
    await page.evaluate(
      async ({ fontSize, lineHeight }) => {
        await window.typeSetReady;
        const editor = window.editor;
        editor.text = 'Bold italic text';
        editor.setAttribute('font-size', fontSize);
        editor.setAttribute('line-height', lineHeight);
        await editor._loadFonts();

        editor.selectionStart = 0;
        editor.selectionEnd = 4;
        await editor.setWeight(700);

        editor.selectionStart = 5;
        editor.selectionEnd = 11;
        editor.toggleItalic();

        editor.selectionStart = editor.selectionEnd;
        await editor._loadFonts();
        await document.fonts.ready;
      },
      { fontSize: DEFAULT_FONT_SIZE, lineHeight: DEFAULT_LINE_HEIGHT }
    );

    const paths = await capturePair(page, 'weight-italic');
    const result = comparePngs(paths.canvasPath, paths.svgPath, paths.diffPath, {
      threshold: 0.1,
      maxDiffRatio: 0.02,
    });
    console.log(`[weight-italic] canvas ${result.width}x${result.height} diff=${result.diffCount} ratio=${(result.ratio * 100).toFixed(3)}%`);
    expect(result.ratio).toBeLessThan(0.02);
  });

  test('hyphenation', async ({ page }) => {
    await runVisualCase(page, 'hyphenation', {
      text: 'Extraordinarily breathtaking development',
      'font-size': DEFAULT_FONT_SIZE,
      'line-height': DEFAULT_LINE_HEIGHT,
    });
  });

  test('alternate font family', async ({ page }) => {
    await runVisualCase(page, 'ibm-plex-sans', {
      text: 'Sans-serif rendering',
      'font-family': 'IBM Plex Sans',
      'font-size': DEFAULT_FONT_SIZE,
      'line-height': DEFAULT_LINE_HEIGHT,
    });
  });
});
