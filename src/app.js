/**
 * Demo app wiring for the <type-set> editor page.
 *
 * Lives in the webpack bundle so its imports resolve correctly under both
 * the dev server and production builds (raw /src files are not served).
 */

import { FONT_WEIGHTS, hasItalic, snapWeight } from './font-data.js';

customElements.whenDefined('type-set').then(() => {
  const editor = document.getElementById('editor');

  function updateWeightSlider(family) {
    const weights = FONT_WEIGHTS ? FONT_WEIGHTS[family] : null;
    const slider = document.getElementById('font-weight');
    const valEl = document.getElementById('font-weight-val');
    if (weights && weights.length) {
      slider.min = Math.min(...weights);
      slider.max = Math.max(...weights);
      slider.step = 100;
      const current = parseInt(slider.value, 10);
      const snapped = snapWeight ? snapWeight(family, current) : current;
      slider.value = snapped;
      valEl.textContent = snapped;
      editor.setAttribute('font-weight', snapped);
    }
  }

  function bindAttr(id, attr, transform) {
    const el = document.getElementById(id);
    const valEl = document.getElementById(id + '-val');
    el.addEventListener('input', () => {
      let val = el.value;
      if (transform) val = transform(val);
      el.value = val;
      editor.setAttribute(attr, val);
      if (valEl) valEl.textContent = val;
    });
  }

  bindAttr('font-size', 'font-size');
  bindAttr('line-height', 'line-height');

  document.getElementById('font-family').addEventListener('change', (e) => {
    const family = e.target.value;
    editor.setAttribute('font-family', family);
    updateWeightSlider(family);
    const italicBtn = document.getElementById('toggle-italic');
    if (italicBtn && hasItalic) {
      italicBtn.disabled = !hasItalic(family);
    }
  });

  document.getElementById('text-align').addEventListener('change', (e) => {
    editor.setAttribute('text-align', e.target.value);
  });

  document.getElementById('color').addEventListener('input', (e) => {
    editor.setAttribute('color', e.target.value);
  });

  // Weight — applies to selection or globally
  const weightSlider = document.getElementById('font-weight');
  const weightVal = document.getElementById('font-weight-val');
  const weightScope = document.getElementById('weight-scope');
  const clearWeightBtn = document.getElementById('clear-weight');

  function updateWeightUI() {
    const selected = editor.hasSelection;
    weightScope.textContent = selected ? '(selection)' : '(global)';
    const val = selected
      ? (editor.perCharWeight[editor.selStart] || editor.globalWeight)
      : editor.globalWeight;
    weightSlider.value = val;
    weightVal.textContent = val;
  }

  setInterval(updateWeightUI, 200);

  weightSlider.addEventListener('input', async () => {
    const val = parseInt(weightSlider.value, 10);
    const family = editor.getAttribute('font-family') || 'IBM Plex Serif';
    const snapped = snapWeight ? snapWeight(family, val) : val;
    weightSlider.value = snapped;
    weightVal.textContent = snapped;
    await editor.setWeight(snapped);
  });

  clearWeightBtn.addEventListener('click', () => {
    editor.clearWeight();
    updateWeightUI();
  });

  // Italic — applies only to selection
  const italicBtn = document.getElementById('toggle-italic');
  italicBtn.addEventListener('click', () => {
    const savedStart = editor.selectionStart;
    const savedEnd = editor.selectionEnd;
    editor.toggleItalic();
    editor.selectionStart = savedStart;
    editor.selectionEnd = savedEnd;
    editor._render();
  });

  // Ligatures & Kerning
  document.getElementById('use-ligatures').addEventListener('change', (e) => {
    editor.setLigatures(e.target.checked);
  });
  document.getElementById('use-kerning').addEventListener('change', (e) => {
    editor.setKerning(e.target.checked);
  });
  document.getElementById('use-hyphenation').addEventListener('change', (e) => {
    editor.setHyphenation(e.target.checked);
  });

  // Spacing
  const spacingInput = document.getElementById('spacing');
  const spacingVal = document.getElementById('spacing-val');
  const spacingScope = document.getElementById('spacing-scope');
  const clearSpacingBtn = document.getElementById('clear-spacing');

  function updateSpacingUI() {
    const selected = editor.hasSelection;
    spacingScope.textContent = selected ? '(selection)' : '(global)';
    const val = selected
      ? (editor.perCharSpacing[editor.selStart] || 0)
      : parseFloat(editor.getAttribute('letter-spacing') || '0');
    spacingInput.value = val;
    spacingVal.textContent = val;
  }

  setInterval(updateSpacingUI, 200);

  spacingInput.addEventListener('input', () => {
    const val = spacingInput.value;
    spacingVal.textContent = val;
    editor.setSpacing(val);
  });

  clearSpacingBtn.addEventListener('click', () => {
    editor.clearSpacing();
    updateSpacingUI();
  });

  // Exports
  document.getElementById('export-svg').addEventListener('click', () => {
    editor.downloadSVG();
  });

  document.getElementById('export-png').addEventListener('click', () => {
    editor.downloadPNG('typeset.png', 600);
  });
});
