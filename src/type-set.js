/**
 * TypeSet Custom HTML Element
 *
 * Canvas-based typography editor with per-glyph control via opentype.js.
 */

import DataroomElement from 'dataroom-js';
import {
  loadFont,
  loadCustomFont,
  getFont,
  shapeText,
  applyKerning,
  layoutGlyphs,
  hitTest,
  exportGlyphSVG,
} from './type-engine.js';
import { buildHyphenMap } from './hyphenate.js';

const DEFAULTS = {
  'font-family': 'IBM Plex Serif',
  'font-size': '48',
  'font-weight': '400',
  'font-style': 'normal',
  'letter-spacing': '0',
  'line-height': '1.2',
  'color': '#0a5c0a',
  'text-align': 'left',
};

const FONT_FILES = {
  'IBM Plex Serif': {
    100: { normal: 'ibm-plex-serif-latin-100-normal.woff', italic: 'ibm-plex-serif-latin-100-italic.woff' },
    200: { normal: 'ibm-plex-serif-latin-200-normal.woff', italic: 'ibm-plex-serif-latin-200-italic.woff' },
    300: { normal: 'ibm-plex-serif-latin-300-normal.woff', italic: 'ibm-plex-serif-latin-300-italic.woff' },
    400: { normal: 'ibm-plex-serif-latin-400-normal.woff', italic: 'ibm-plex-serif-latin-400-italic.woff' },
    500: { normal: 'ibm-plex-serif-latin-500-normal.woff', italic: 'ibm-plex-serif-latin-500-italic.woff' },
    600: { normal: 'ibm-plex-serif-latin-600-normal.woff', italic: 'ibm-plex-serif-latin-600-italic.woff' },
    700: { normal: 'ibm-plex-serif-latin-700-normal.woff', italic: 'ibm-plex-serif-latin-700-italic.woff' },
  },
  'IBM Plex Sans': {
    100: { normal: 'ibm-plex-sans-latin-100-normal.woff', italic: 'ibm-plex-sans-latin-100-italic.woff' },
    200: { normal: 'ibm-plex-sans-latin-200-normal.woff', italic: 'ibm-plex-sans-latin-200-italic.woff' },
    300: { normal: 'ibm-plex-sans-latin-300-normal.woff', italic: 'ibm-plex-sans-latin-300-italic.woff' },
    400: { normal: 'ibm-plex-sans-latin-400-normal.woff', italic: 'ibm-plex-sans-latin-400-italic.woff' },
    500: { normal: 'ibm-plex-sans-latin-500-normal.woff', italic: 'ibm-plex-sans-latin-500-italic.woff' },
    600: { normal: 'ibm-plex-sans-latin-600-normal.woff', italic: 'ibm-plex-sans-latin-600-italic.woff' },
    700: { normal: 'ibm-plex-sans-latin-700-normal.woff', italic: 'ibm-plex-sans-latin-700-italic.woff' },
  },
  'Crimson Text': {
    400: { normal: 'crimson-text-latin-400-normal.woff', italic: 'crimson-text-latin-400-italic.woff' },
    600: { normal: 'crimson-text-latin-600-normal.woff', italic: 'crimson-text-latin-600-italic.woff' },
    700: { normal: 'crimson-text-latin-700-normal.woff', italic: 'crimson-text-latin-700-italic.woff' },
  },
  'Fira Code': {
    300: { normal: 'fira-code-latin-300-normal.woff' },
    400: { normal: 'fira-code-latin-400-normal.woff' },
    500: { normal: 'fira-code-latin-500-normal.woff' },
    600: { normal: 'fira-code-latin-600-normal.woff' },
    700: { normal: 'fira-code-latin-700-normal.woff' },
  },
  'League Gothic': {
    400: { normal: 'league-gothic-latin-400-normal.woff' },
  },
  'Atkinson Hyperlegible': {
    400: { normal: 'atkinson-hyperlegible-latin-400-normal.woff', italic: 'atkinson-hyperlegible-latin-400-italic.woff' },
    700: { normal: 'atkinson-hyperlegible-latin-700-normal.woff', italic: 'atkinson-hyperlegible-latin-700-italic.woff' },
  },
  'Cormorant Garamond': {
    300: { normal: 'cormorant-garamond-latin-300-normal.woff', italic: 'cormorant-garamond-latin-300-italic.woff' },
    400: { normal: 'cormorant-garamond-latin-400-normal.woff', italic: 'cormorant-garamond-latin-400-italic.woff' },
    500: { normal: 'cormorant-garamond-latin-500-normal.woff', italic: 'cormorant-garamond-latin-500-italic.woff' },
    600: { normal: 'cormorant-garamond-latin-600-normal.woff', italic: 'cormorant-garamond-latin-600-italic.woff' },
    700: { normal: 'cormorant-garamond-latin-700-normal.woff', italic: 'cormorant-garamond-latin-700-italic.woff' },
  },
  'EB Garamond': {
    400: { normal: 'eb-garamond-latin-400-normal.woff', italic: 'eb-garamond-latin-400-italic.woff' },
    500: { normal: 'eb-garamond-latin-500-normal.woff', italic: 'eb-garamond-latin-500-italic.woff' },
    600: { normal: 'eb-garamond-latin-600-normal.woff', italic: 'eb-garamond-latin-600-italic.woff' },
    700: { normal: 'eb-garamond-latin-700-normal.woff', italic: 'eb-garamond-latin-700-italic.woff' },
    800: { normal: 'eb-garamond-latin-800-normal.woff', italic: 'eb-garamond-latin-800-italic.woff' },
  },
  'Spectral': {
    200: { normal: 'spectral-latin-200-normal.woff', italic: 'spectral-latin-200-italic.woff' },
    300: { normal: 'spectral-latin-300-normal.woff', italic: 'spectral-latin-300-italic.woff' },
    400: { normal: 'spectral-latin-400-normal.woff', italic: 'spectral-latin-400-italic.woff' },
    500: { normal: 'spectral-latin-500-normal.woff', italic: 'spectral-latin-500-italic.woff' },
    600: { normal: 'spectral-latin-600-normal.woff', italic: 'spectral-latin-600-italic.woff' },
    700: { normal: 'spectral-latin-700-normal.woff', italic: 'spectral-latin-700-italic.woff' },
    800: { normal: 'spectral-latin-800-normal.woff', italic: 'spectral-latin-800-italic.woff' },
  },
  'UnifrakturMaguntia': {
    400: { normal: 'unifrakturmaguntia-latin-400-normal.woff' },
  },
};

export const FONT_WEIGHTS = {
  'IBM Plex Serif': [100, 200, 300, 400, 500, 600, 700],
  'IBM Plex Sans': [100, 200, 300, 400, 500, 600, 700],
  'Crimson Text': [400, 600, 700],
  'Fira Code': [300, 400, 500, 600, 700],
  'League Gothic': [400],
  'Atkinson Hyperlegible': [400, 700],
  'Cormorant Garamond': [300, 400, 500, 600, 700],
  'EB Garamond': [400, 500, 600, 700, 800],
  'Spectral': [200, 300, 400, 500, 600, 700, 800],
  'UnifrakturMaguntia': [400],
};

export function hasItalic(family) {
  const map = FONT_FILES[family];
  if (!map) return false;
  const first = Object.values(map)[0];
  return !!first.italic;
}

export function snapWeight(family, weight) {
  const available = FONT_WEIGHTS[family];
  if (!available) return weight;
  const num = typeof weight === 'string' ? parseInt(weight, 10) : weight;
  return available.reduce((prev, curr) =>
    Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev
  );
}

function getFontUrl(family, weight, style, base = './fonts/') {
  const map = FONT_FILES[family];
  if (!map) return null;
  const weightMap = map[weight];
  if (!weightMap) return null;
  const path = weightMap[style] || weightMap.normal || null;
  if (!path) return null;
  // Ensure base ends with /
  const prefix = base.endsWith('/') ? base : base + '/';
  return prefix + path;
}

class TypeSet extends DataroomElement {
  async initialize() {
    this.innerHTML = '';

    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.cursor = 'text';
    this.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.textarea = document.createElement('textarea');
    this.textarea.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;left:-9999px;';
    this.appendChild(this.textarea);

    this._text = 'The quick brown fox jumps over the lazy dog.';
    this.textarea.value = this._text;
    this.cursorIndex = this._text.length;
    this.selectionStart = this.cursorIndex;
    this.selectionEnd = this.cursorIndex;
    this.glyphs = [];
    this.totalHeight = 0;

    this.currentFamily = DEFAULTS['font-family'];
    this.currentWeight = DEFAULTS['font-weight'];
    this.globalWeight = DEFAULTS['font-weight'];
    this.globalLetterSpacing = parseFloat(DEFAULTS['letter-spacing']);
    this.perCharSpacing = new Float64Array(this._text.length);
    this.perCharWeight = new Float64Array(this._text.length);
    this.perCharItalic = new Set();
    this.useLigatures = true;
    this.useKerning = true;
    this.lineHeightMultiplier = parseFloat(DEFAULTS['line-height']);
    this.textAlign = DEFAULTS['text-align'];
    this.useHyphenation = true;
    this._prevCustomFont = null;
    this._prevWeightSpecificHash = '';

    this.blinkOn = true;
    this.blinkInterval = null;
    this.isDragging = false;
    this._mouseDownCount = 0;
    this._lastMouseDownTime = 0;

    this.canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this._onMouseUp.bind(this));
    this.canvas.addEventListener('dblclick', this._onDoubleClick.bind(this));
    this.canvas.addEventListener('click', () => this.textarea.focus());

    this.textarea.addEventListener('input', this._onTextInput.bind(this));
    this.textarea.addEventListener('keydown', this._onKeyDown.bind(this));
    this.textarea.addEventListener('focus', () => this.classList.add('has-focus'));
    this.textarea.addEventListener('blur', () => this.classList.remove('has-focus'));

    this.on('NODE-CHANGED', () => this._onAttrChange());

    this._resizeObserver = new ResizeObserver(() => {
      if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => this._shapeAndLayout(), 50);
    });
    this._resizeObserver.observe(this);

    await this._loadFonts();
    this._startBlink();
  }

  _getFontBase() {
    return this.getAttribute('font-base') || './fonts/';
  }

  _getWeightSpecificFontsHash() {
    const parts = [];
    const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
    for (const w of weights) {
      const normal = this.getAttribute(`font-${w}`);
      const italic = this.getAttribute(`font-${w}-italic`);
      if (normal) parts.push(`${w}:n:${normal}`);
      if (italic) parts.push(`${w}:i:${italic}`);
    }
    return parts.join('|');
  }

  async _loadFonts() {
    const family = this.currentFamily;
    const base = this._getFontBase();
    const customFontUrl = this.getAttribute('font');

    // Collect all distinct weights used in the text
    const weights = new Set([this.globalWeight]);
    for (let i = 0; i < this._text.length; i++) {
      const w = this.perCharWeight[i];
      if (w) weights.add(String(w));
    }

    // Check if any weight-specific custom fonts are defined
    let hasWeightSpecific = false;
    for (const weight of weights) {
      if (this.getAttribute(`font-${weight}`) || this.getAttribute(`font-${weight}-italic`)) {
        hasWeightSpecific = true;
        break;
      }
    }

    // Fast path: single custom font with no weight-specific overrides
    if (customFontUrl && !hasWeightSpecific) {
      this._prevCustomFont = customFontUrl;
      await loadCustomFont(family, customFontUrl);
      this._shapeAndLayout();
      return;
    }

    // If a catch-all custom font is set alongside weight-specific ones,
    // load it first as the fallback for unspecified weights.
    if (customFontUrl) {
      await loadCustomFont(family, customFontUrl);
    }

    for (const weight of weights) {
      const customNormal = this.getAttribute(`font-${weight}`);
      const customItalic = this.getAttribute(`font-${weight}-italic`);

      if (customNormal) {
        await loadFont(family, weight, 'normal', customNormal, true);
      } else if (!customFontUrl) {
        const normalUrl = getFontUrl(family, weight, 'normal', base);
        if (normalUrl) await loadFont(family, weight, 'normal', normalUrl);
      }

      if (customItalic) {
        await loadFont(family, weight, 'italic', customItalic, true);
      } else if (!customFontUrl) {
        const italicUrl = getFontUrl(family, weight, 'italic', base);
        if (italicUrl) await loadFont(family, weight, 'italic', italicUrl);
      }
    }

    this._shapeAndLayout();
  }

  get text() {
    return this._text;
  }

  set text(value) {
    this._text = value;
    this.textarea.value = value;
    const newArr = new Float64Array(value.length);
    newArr.set(this.perCharSpacing.subarray(0, Math.min(this.perCharSpacing.length, value.length)));
    this.perCharSpacing = newArr;
    const newWeight = new Float64Array(value.length);
    newWeight.set(this.perCharWeight.subarray(0, Math.min(this.perCharWeight.length, value.length)));
    this.perCharWeight = newWeight;
    // Clear per-character styles on full text replacement; typing preserves them via _onTextInput
    this.perCharItalic = new Set();
    this._shapeAndLayout();
    this.event('typeset-change', { text: value });
  }

  _onAttrChange() {
    const family = this.getAttribute('font-family') || DEFAULTS['font-family'];
    const weight = this.getAttribute('font-weight') || DEFAULTS['font-weight'];
    const spacing = parseFloat(this.getAttribute('letter-spacing') || DEFAULTS['letter-spacing']);
    const lineHeight = parseFloat(this.getAttribute('line-height') || DEFAULTS['line-height']);
    const textAlign = this.getAttribute('text-align') || DEFAULTS['text-align'];
    const fontBase = this.getAttribute('font-base') || './fonts/';
    const customFont = this.getAttribute('font');
    const weightSpecificHash = this._getWeightSpecificFontsHash();

    this.globalLetterSpacing = spacing;
    this.lineHeightMultiplier = lineHeight;
    this.textAlign = textAlign;

    const snappedWeight = String(snapWeight(family, weight));
    const familyChanged = this.currentFamily !== family;
    const weightChanged = this.currentWeight !== snappedWeight;
    const customFontChanged = this._prevCustomFont !== customFont;
    const weightSpecificChanged = this._prevWeightSpecificHash !== weightSpecificHash;

    this.currentFamily = family;
    this.currentWeight = snappedWeight;
    this.globalWeight = snappedWeight;

    if (customFontChanged || familyChanged || weightChanged || weightSpecificChanged) {
      this._loadFonts();
    } else {
      this._shapeAndLayout();
    }
  }

  _shapeAndLayout() {
    const fontSize = parseFloat(this.getAttribute('font-size') || DEFAULTS['font-size']);
    const lineHeightPx = fontSize * this.lineHeightMultiplier;
    const family = this.currentFamily;

    // Build style runs based on per-character weight + italic
    const runs = [];
    let currentRun = null;

    for (let i = 0; i < this._text.length; i++) {
      const char = this._text[i];
      const weight = String(this.perCharWeight[i] || this.globalWeight);
      const style = this.perCharItalic.has(i) ? 'italic' : 'normal';

      if (!currentRun || currentRun.weight !== weight || currentRun.style !== style) {
        currentRun = { start: i, weight, style, text: '' };
        runs.push(currentRun);
      }
      currentRun.text += char;
      currentRun.end = i + 1;
    }

    // Shape each run with its corresponding font
    this.glyphs = [];
    for (const run of runs) {
      const font = getFont(family, run.weight, run.style)
        || getFont(family, run.weight, 'normal')
        || getFont(family, this.globalWeight, run.style)
        || getFont(family, this.globalWeight, 'normal');
      if (!font) continue;

      const runGlyphs = shapeText(run.text, font, fontSize, this.useLigatures);

      // Offset char indices to global positions and attach style info
      for (const g of runGlyphs) {
        g.charIndex += run.start;
        g.fontFamily = family;
        g.fontWeight = run.weight;
        g.fontStyle = run.style;
      }

      // Apply kerning within run
      if (this.useKerning) {
        applyKerning(runGlyphs, font, fontSize);
      }

      this.glyphs.push(...runGlyphs);
    }

    // Apply spacing: global + per-char
    for (const g of this.glyphs) {
      const extra = this.perCharSpacing[g.charIndex] || 0;
      g.spacingOffset = this.globalLetterSpacing + extra;
    }

    const style = getComputedStyle(this);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const maxWidth = Math.max((this.clientWidth || 800) - paddingLeft - paddingRight, 1);
    const hyphenMap = this.useHyphenation ? buildHyphenMap(this._text) : null;
    this.totalHeight = layoutGlyphs(this.glyphs, maxWidth, lineHeightPx, {
      textAlign: this.textAlign,
      hyphenMap,
      text: this._text,
      fontSize,
    });
    this._render();
  }

  _render() {
    if (!this.canvas) return;

    this.classList.toggle('has-selection', this.hasSelection);

    const dpr = window.devicePixelRatio || 1;
    const style = getComputedStyle(this);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const cssWidth = Math.max((this.clientWidth || 800) - paddingLeft - paddingRight, 1);
    const cssHeight = this.totalHeight + 20;

    if (this.canvas.width !== Math.floor(cssWidth * dpr) || this.canvas.height !== Math.floor(cssHeight * dpr)) {
      this.canvas.width = Math.floor(cssWidth * dpr);
      this.canvas.height = Math.floor(cssHeight * dpr);
    }
    this.canvas.style.height = cssHeight + 'px';

    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    if (this.glyphs.length === 0) return;

    const fontSize = parseFloat(this.getAttribute('font-size') || DEFAULTS['font-size']);
    const color = this.getAttribute('color') || DEFAULTS['color'];

    this._drawSelection(ctx);

    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';

    let currentFont = null;
    for (const g of this.glyphs) {
      if (g.char === '\n') continue;
      const fontStr = `${g.fontStyle} ${g.fontWeight} ${fontSize}px "${g.fontFamily}"`;
      if (fontStr !== currentFont) {
        ctx.font = fontStr;
        currentFont = fontStr;
      }
      ctx.fillText(g.char, g.x, g.y);
    }

    if (this.blinkOn && document.activeElement === this.textarea) {
      this._drawCursor(ctx);
    }
  }

  _drawSelection(ctx) {
    if (this.selectionStart === this.selectionEnd) return;
    const selStart = Math.min(this.selectionStart, this.selectionEnd);
    const selEnd = Math.max(this.selectionStart, this.selectionEnd);
    const fontSize = parseFloat(this.getAttribute('font-size') || DEFAULTS['font-size']);
    const lineHeightPx = fontSize * this.lineHeightMultiplier;

    ctx.fillStyle = 'rgba(10, 92, 10, 0.2)';

    for (const g of this.glyphs) {
      const gCharStart = g.charIndex;
      const gCharEnd = g.charIndex + (g.charCount || 1);
      if (gCharEnd <= selStart || gCharStart >= selEnd) continue;

      ctx.fillRect(g.x, g.y - fontSize, g.advanceWidth + g.spacingOffset, lineHeightPx);
    }
  }

  _drawCursor(ctx) {
    const idx = this.cursorIndex;
    const fontSize = parseFloat(this.getAttribute('font-size') || DEFAULTS['font-size']);
    const lineHeightPx = fontSize * this.lineHeightMultiplier;

    let x = 0;
    let y = fontSize;

    if (this.glyphs.length > 0) {
      if (idx >= this._text.length) {
        const last = this.glyphs[this.glyphs.length - 1];
        x = last.x + last.advanceWidth + last.spacingOffset;
        y = last.y;
      } else {
        for (const g of this.glyphs) {
          const gStart = g.charIndex;
          const gEnd = g.charIndex + (g.charCount || 1);
          if (idx >= gStart && idx < gEnd) {
            const ratio = (idx - gStart) / (g.charCount || 1);
            x = g.x + (g.advanceWidth + g.spacingOffset) * ratio;
            y = g.y;
            break;
          }
        }
      }
    }

    ctx.strokeStyle = this.getAttribute('color') || DEFAULTS['color'];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - fontSize);
    ctx.lineTo(x, y + (lineHeightPx - fontSize));
    ctx.stroke();
  }

  _startBlink() {
    if (this.blinkInterval) clearInterval(this.blinkInterval);
    this.blinkInterval = setInterval(() => {
      this.blinkOn = !this.blinkOn;
      this._render();
    }, 530);
  }

  _getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  _onMouseDown(e) {
    const now = Date.now();
    if (now - this._lastMouseDownTime < 400) {
      this._mouseDownCount++;
    } else {
      this._mouseDownCount = 1;
    }
    this._lastMouseDownTime = now;

    if (this._mouseDownCount === 3) {
      this._mouseDownCount = 0;
      this._selectAllText();
      return;
    }

    if (this._mouseDownCount === 2) {
      // Let dblclick handle word selection; don't reset cursor here
      return;
    }

    this.isDragging = true;
    const { x, y } = this._getCanvasCoords(e);
    const fontSize = parseFloat(this.getAttribute('font-size') || DEFAULTS['font-size']);
    const lineHeightPx = fontSize * this.lineHeightMultiplier;

    this.cursorIndex = hitTest(this.glyphs, x, y, lineHeightPx);
    this.selectionStart = this.cursorIndex;
    this.selectionEnd = this.cursorIndex;
    this.blinkOn = true;
    this._render();
    this.textarea.focus();
  }

  _onMouseMove(e) {
    if (!this.isDragging) return;
    const { x, y } = this._getCanvasCoords(e);
    const fontSize = parseFloat(this.getAttribute('font-size') || DEFAULTS['font-size']);
    const lineHeightPx = fontSize * this.lineHeightMultiplier;

    this.selectionEnd = hitTest(this.glyphs, x, y, lineHeightPx);
    this.cursorIndex = this.selectionEnd;
    this._render();
  }

  _onMouseUp() {
    this.isDragging = false;
  }

  _onDoubleClick(e) {
    const { x, y } = this._getCanvasCoords(e);
    const fontSize = parseFloat(this.getAttribute('font-size') || DEFAULTS['font-size']);
    const lineHeightPx = fontSize * this.lineHeightMultiplier;
    const idx = hitTest(this.glyphs, x, y, lineHeightPx);

    // Select the word at the cursor
    const text = this._text;
    let wordStart = idx;
    let wordEnd = idx;

    while (wordStart > 0 && !/\s/.test(text[wordStart - 1])) {
      wordStart--;
    }
    while (wordEnd < text.length && !/\s/.test(text[wordEnd])) {
      wordEnd++;
    }

    this.textarea.selectionStart = wordStart;
    this.textarea.selectionEnd = wordEnd;
    this.selectionStart = wordStart;
    this.selectionEnd = wordEnd;
    this.cursorIndex = wordEnd;
    this.blinkOn = false;
    this.textarea.focus();
    this._render();
  }

  _selectAllText() {
    this.textarea.selectionStart = 0;
    this.textarea.selectionEnd = this._text.length;
    this.selectionStart = 0;
    this.selectionEnd = this._text.length;
    this.cursorIndex = this._text.length;
    this.blinkOn = false;
    this.textarea.focus();
    this._render();
  }

  _onTextInput() {
    const oldText = this._text;
    const newText = this.textarea.value;

    if (newText !== oldText) {
      // Find the changed region
      let start = 0;
      while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) {
        start++;
      }

      let oldEnd = oldText.length;
      let newEnd = newText.length;
      while (oldEnd > start && newEnd > start && oldText[oldEnd - 1] === newText[newEnd - 1]) {
        oldEnd--;
        newEnd--;
      }

      const oldLen = oldEnd - start;
      const newLen = newEnd - start;

      // Adjust perCharItalic indices
      const newSet = new Set();
      for (const idx of this.perCharItalic) {
        if (idx < start) {
          newSet.add(idx);
        } else if (idx >= oldEnd) {
          newSet.add(idx - oldLen + newLen);
        }
        // indices in [start, oldEnd) are deleted or replaced; don't carry over
      }
      this.perCharItalic = newSet;

      // Adjust perCharSpacing
      const newSpacing = new Float64Array(newText.length);
      for (let i = 0; i < start; i++) newSpacing[i] = this.perCharSpacing[i] || 0;
      for (let i = oldEnd; i < oldText.length; i++) {
        const newIdx = i - oldLen + newLen;
        if (newIdx >= 0 && newIdx < newText.length) {
          newSpacing[newIdx] = this.perCharSpacing[i] || 0;
        }
      }
      this.perCharSpacing = newSpacing;

      // Adjust perCharWeight
      const newWeight = new Float64Array(newText.length);
      for (let i = 0; i < start; i++) newWeight[i] = this.perCharWeight[i] || 0;
      for (let i = oldEnd; i < oldText.length; i++) {
        const newIdx = i - oldLen + newLen;
        if (newIdx >= 0 && newIdx < newText.length) {
          newWeight[newIdx] = this.perCharWeight[i] || 0;
        }
      }
      this.perCharWeight = newWeight;

      this._text = newText;
      this.cursorIndex = this.textarea.selectionStart;
      this.selectionStart = this.cursorIndex;
      this.selectionEnd = this.cursorIndex;
      this._shapeAndLayout();
      this.event('typeset-change', { text: newText });
    }
  }

  _onKeyDown(e) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      this._moveCursor(e.key, e.shiftKey);
      return;
    }
    if (e.key === 'Escape') {
      this.selectionStart = this.cursorIndex;
      this.selectionEnd = this.cursorIndex;
      this._render();
    }
  }

  _moveCursor(key, shift) {
    let newIndex = this.cursorIndex;

    if (key === 'ArrowLeft') {
      newIndex = Math.max(0, this.cursorIndex - 1);
    } else if (key === 'ArrowRight') {
      newIndex = Math.min(this._text.length, this.cursorIndex + 1);
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
      const g = this.cursorIndex < this._text.length
        ? this.glyphs.find(g => this.cursorIndex >= g.charIndex && this.cursorIndex < g.charIndex + (g.charCount || 1))
        : this.glyphs[this.glyphs.length - 1];
      if (g) {
        newIndex = this._findIndexOnAdjacentLine(g.x, g.y, key === 'ArrowDown');
      }
    }

    this.cursorIndex = newIndex;
    if (shift) {
      this.selectionEnd = newIndex;
    } else {
      this.selectionStart = newIndex;
      this.selectionEnd = newIndex;
    }
    this.blinkOn = true;
    this._render();
  }

  _findIndexOnAdjacentLine(x, y, down) {
    const fontSize = parseFloat(this.getAttribute('font-size') || DEFAULTS['font-size']);
    const lineHeightPx = fontSize * this.lineHeightMultiplier;
    const targetY = down ? y + lineHeightPx : y - lineHeightPx;

    let closest = down ? this._text.length : 0;
    let minDist = Infinity;

    for (const g of this.glyphs) {
      if (Math.abs(g.y - targetY) < lineHeightPx / 2) {
        const dist = Math.abs(g.x - x);
        if (dist < minDist) {
          minDist = dist;
          closest = g.charIndex;
        }
      }
    }

    return closest;
  }

  get hasSelection() {
    return this.selectionStart !== this.selectionEnd;
  }

  get selStart() {
    return Math.min(this.selectionStart, this.selectionEnd);
  }

  get selEnd() {
    return Math.max(this.selectionStart, this.selectionEnd);
  }

  setSpacing(value) {
    const num = parseFloat(value);
    if (this.hasSelection) {
      for (let i = this.selStart; i < this.selEnd && i < this._text.length; i++) {
        this.perCharSpacing[i] = num;
      }
    } else {
      this.globalLetterSpacing = num;
      this.setAttribute('letter-spacing', String(num));
    }
    this._shapeAndLayout();
  }

  clearSpacing() {
    if (this.hasSelection) {
      for (let i = this.selStart; i < this.selEnd && i < this._text.length; i++) {
        this.perCharSpacing[i] = 0;
      }
    } else {
      this.globalLetterSpacing = 0;
      this.setAttribute('letter-spacing', '0');
      this.perCharSpacing = new Float64Array(this._text.length);
    }
    this._shapeAndLayout();
  }

  toggleItalic() {
    if (!this.hasSelection) return;

    const [start, end] = [this.selStart, this.selEnd];
    let allItalic = true;
    for (let i = start; i < end; i++) {
      if (!this.perCharItalic.has(i)) {
        allItalic = false;
        break;
      }
    }

    if (allItalic) {
      for (let i = start; i < end; i++) this.perCharItalic.delete(i);
    } else {
      for (let i = start; i < end; i++) this.perCharItalic.add(i);
    }

    this._shapeAndLayout();
  }

  async _loadFontForWeight(weight) {
    const customFontUrl = this.getAttribute('font');
    const weightSpecific = this.getAttribute(`font-${weight}`);
    const italicSpecific = this.getAttribute(`font-${weight}-italic`);

    if (weightSpecific) {
      await loadFont(this.currentFamily, String(weight), 'normal', weightSpecific, true);
    } else if (customFontUrl) {
      await loadCustomFont(this.currentFamily, customFontUrl);
    } else {
      const base = this._getFontBase();
      const normalUrl = getFontUrl(this.currentFamily, weight, 'normal', base);
      if (normalUrl) await loadFont(this.currentFamily, weight, 'normal', normalUrl);
    }

    if (italicSpecific) {
      await loadFont(this.currentFamily, String(weight), 'italic', italicSpecific, true);
    } else if (!customFontUrl && !weightSpecific) {
      const base = this._getFontBase();
      const italicUrl = getFontUrl(this.currentFamily, weight, 'italic', base);
      if (italicUrl) await loadFont(this.currentFamily, weight, 'italic', italicUrl);
    }
  }

  async setWeight(value) {
    const weight = snapWeight(this.currentFamily, value);
    if (this.hasSelection) {
      await this._loadFontForWeight(weight);
      for (let i = this.selStart; i < this.selEnd && i < this._text.length; i++) {
        this.perCharWeight[i] = weight;
      }
      this._shapeAndLayout();
    } else {
      this.globalWeight = String(weight);
      this.setAttribute('font-weight', String(weight));
    }
  }

  clearWeight() {
    if (this.hasSelection) {
      for (let i = this.selStart; i < this.selEnd && i < this._text.length; i++) {
        this.perCharWeight[i] = 0;
      }
      this._shapeAndLayout();
    } else {
      this.globalWeight = DEFAULTS['font-weight'];
      this.setAttribute('font-weight', DEFAULTS['font-weight']);
    }
  }

  setLigatures(enabled) {
    this.useLigatures = enabled;
    this._shapeAndLayout();
  }

  setKerning(enabled) {
    this.useKerning = enabled;
    this._shapeAndLayout();
  }

  setHyphenation(enabled) {
    this.useHyphenation = enabled;
    this._shapeAndLayout();
  }

  async exportSVG() {
    const fontSize = parseFloat(this.getAttribute('font-size') || DEFAULTS['font-size']);
    const color = this.getAttribute('color') || DEFAULTS['color'];
    const width = this.clientWidth || 800;
    const height = this.totalHeight + 20;
    return exportGlyphSVG(this.glyphs, fontSize, color, width, height);
  }

  async exportPNG(dpi = 600) {
    const scale = dpi / 96;
    const cssWidth = this.clientWidth || 800;
    const cssHeight = this.totalHeight + 20;

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(cssWidth * scale);
    canvas.height = Math.ceil(cssHeight * scale);

    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const fontSize = parseFloat(this.getAttribute('font-size') || DEFAULTS['font-size']);
    const color = this.getAttribute('color') || DEFAULTS['color'];

    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';

    let currentFont = null;
    for (const g of this.glyphs) {
      if (g.char === '\n') continue;
      const fontStr = `${g.fontStyle} ${g.fontWeight} ${fontSize}px "${g.fontFamily}"`;
      if (fontStr !== currentFont) {
        ctx.font = fontStr;
        currentFont = fontStr;
      }
      ctx.fillText(g.char, g.x, g.y);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  async downloadSVG(filename = 'typeset.svg') {
    const svg = await this.exportSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async downloadPNG(filename = 'typeset.png', dpi = 600) {
    const blob = await this.exportPNG(dpi);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Expose font data for UI
window.TYPESET_FONTS = { FONT_WEIGHTS, hasItalic, snapWeight };

if (!customElements.get('type-set')) {
  customElements.define('type-set', TypeSet);
}

export default TypeSet;
