import { keyboardOverlapSpacer, keyboardVisibleOffset } from '../src/presentation/layout/keyboardVisibility';

function equal(actual: number, expected: number, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, received ${actual}`);
}
const viewport = { viewportTop: 24, viewportHeight: 400, keyboardTop: 424, offset: 100, contentHeight: 1200 };
equal(keyboardVisibleOffset({ ...viewport, fieldTop: 100, fieldHeight: 44 }), 100, 'Visible input stays still');
equal(keyboardVisibleOffset({ ...viewport, fieldTop: 400, fieldHeight: 44 }), 132, 'Reveal only hidden lower portion plus gap');
equal(keyboardVisibleOffset({ ...viewport, fieldTop: 412, fieldHeight: 44 }), 144, 'Input under keyboard is revealed');
equal(keyboardVisibleOffset({ ...viewport, fieldTop: 16, fieldHeight: 44 }), 80, 'Reveal field above viewport');
equal(keyboardVisibleOffset({ ...viewport, fieldTop: 380, fieldHeight: 44, keyboardTop: 390 }), 146, 'Keyboard overlap clips viewport');
equal(keyboardVisibleOffset({ ...viewport, fieldTop: 16, fieldHeight: 44, offset: 0 }), 0, 'Never negative offset');
equal(keyboardVisibleOffset({ ...viewport, fieldTop: 500, fieldHeight: 44, offset: 790 }), 800, 'Never beyond content extent');
equal(keyboardVisibleOffset({ ...viewport, fieldTop: 500, fieldHeight: 44, contentHeight: 300 }), 0, 'Short content cannot overscroll');
equal(keyboardVisibleOffset({ ...viewport, fieldTop: 36, fieldHeight: 600 }), 100, 'Oversized field aligned at top stays stable');
equal(keyboardVisibleOffset({ ...viewport, fieldTop: 80, fieldHeight: 600 }), 144, 'Oversized field aligns once');
equal(keyboardVisibleOffset({ ...viewport, fieldTop: 100, fieldHeight: 0 }), 100, 'Ignore unmounted zero height input');
equal(keyboardVisibleOffset({ ...viewport, fieldTop: NaN, fieldHeight: 44 }), 100, 'Ignore invalid measurement');
equal(keyboardVisibleOffset({ ...viewport, fieldTop: 500, fieldHeight: 44, keyboardTop: 20 }), 100, 'Ignore unavailable viewport');
// A second measurement after exactly the requested movement must be a no-op.
const first = keyboardVisibleOffset({ ...viewport, fieldTop: 500, fieldHeight: 44 });
equal(keyboardVisibleOffset({ ...viewport, offset: first, fieldTop: 500 - (first - viewport.offset), fieldHeight: 44 }), first, 'No cumulative jump after layout settles');

// 0.4.4: create scroll range only when the keyboard really overlays the viewport.
equal(keyboardOverlapSpacer({ viewportTop: 24, viewportHeight: 400, keyboardTop: 424 }), 0, 'Native adjustResize needs no extra spacer');
equal(keyboardOverlapSpacer({ viewportTop: 24, viewportHeight: 700, keyboardTop: 424 }), 312, 'Overlay adds measured overlap plus visibility gap');
equal(keyboardOverlapSpacer({ viewportTop: 24, viewportHeight: 700, keyboardTop: 800 }), 0, 'Keyboard below viewport adds no spacer');
const compact = { viewportTop: 0, viewportHeight: 600, keyboardTop: 360, offset: 0, contentHeight: 600 };
const overlaySpacer = keyboardOverlapSpacer(compact);
equal(keyboardVisibleOffset({ ...compact, contentHeight: compact.contentHeight + overlaySpacer, fieldTop: 540, fieldHeight: 44 }), 236, 'Overlay spacer creates the missing range to reveal a bottom field');

console.log('Keyboard visibility geometry: 18 regressions passed.');
