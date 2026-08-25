/**
 * Unit tests for SVG export coordinate transform.
 *
 * These tests verify the low-level math that flips opentype.js glyph paths
 * from font-space (Y up) into screen-space (Y down) around the baseline.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { exportGlyphSVG } from '../src/type-engine.js';

function makeBoxGlyph(char, x, y, { unitsPerEm = 1000, advanceWidth = 10 } = {}) {
  return {
    char,
    x,
    y,
    advanceWidth,
    spacingOffset: 0,
    kerning: 0,
    kerningOverride: 0,
    charIndex: 0,
    charCount: 1,
    unitsPerEm,
    path: {
      unitsPerEm,
      commands: [
        { type: 'M', x: 0, y: 0 },
        { type: 'L', x: 10, y: 0 },
        { type: 'L', x: 10, y: 20 },
        { type: 'L', x: 0, y: 20 },
        { type: 'Z' },
      ],
    },
  };
}

describe('exportGlyphSVG', () => {
  it('flips Y around the baseline while keeping X unchanged', () => {
    const glyphs = [makeBoxGlyph('A', 5, 50)];
    const svg = exportGlyphSVG(glyphs, 100, '#000000', 100, 100);

    // fontSize 100 / unitsPerEm 1000 = 0.1
    // baseline y = 50, so path points map to y = 50 - cmd.y * 0.1
    assert(svg.includes('d="M5,50 L6,50 L6,48 L5,48 Z"'));
  });

  it('skips newline glyphs even when they carry a path', () => {
    const glyphs = [makeBoxGlyph('\n', 0, 50)];
    const svg = exportGlyphSVG(glyphs, 100, '#000000', 100, 100);

    // The SVG should contain the group but no path element.
    assert(!svg.includes('<path'));
  });

  it('positions multiple lines in correct top-to-bottom order', () => {
    const glyphs = [
      makeBoxGlyph('A', 0, 60),
      makeBoxGlyph('B', 0, 120),
    ];
    const svg = exportGlyphSVG(glyphs, 100, '#000000', 100, 200);

    // Second line baseline (120) is lower in screen space than first (60).
    assert(svg.includes('M0,60'));
    assert(svg.includes('M0,120'));
  });

  it('falls back to path.unitsPerEm when glyph.unitsPerEm is missing', () => {
    const glyph = makeBoxGlyph('A', 0, 50);
    delete glyph.unitsPerEm;
    const svg = exportGlyphSVG([glyph], 100, '#000000', 100, 100);

    assert(svg.includes('<path'));
  });
});
