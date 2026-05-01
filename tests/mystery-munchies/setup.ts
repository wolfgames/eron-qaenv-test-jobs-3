/**
 * Test setup for Mystery Munchies.
 *
 * The @adobe/data ECS package eagerly opens a CacheStorage namespace via
 * `globalThis.caches.open(...)` for its persistent blob store. CacheStorage
 * does not exist in the Node test environment; the resulting unhandled
 * rejection produces a non-zero exit code even when assertions pass.
 *
 * Polyfill `caches` with a noop in-memory implementation so the import
 * side-effect succeeds quietly. Game-side tests never depend on persistence.
 */

class NoopCache {
  match() { return Promise.resolve(undefined); }
  matchAll() { return Promise.resolve([]); }
  add() { return Promise.resolve(undefined); }
  addAll() { return Promise.resolve(undefined); }
  put() { return Promise.resolve(undefined); }
  delete() { return Promise.resolve(false); }
  keys() { return Promise.resolve([]); }
}

class NoopCacheStorage {
  open() { return Promise.resolve(new NoopCache()); }
  match() { return Promise.resolve(undefined); }
  has() { return Promise.resolve(false); }
  delete() { return Promise.resolve(false); }
  keys() { return Promise.resolve([]); }
}

if (typeof (globalThis as { caches?: unknown }).caches === 'undefined') {
  (globalThis as { caches: unknown }).caches = new NoopCacheStorage();
}

// Pixi imports trigger module-side-effect introspection of `navigator`,
// `window`, and `document`. Provide a minimal polyfill so importing the
// GameController module in node tests does not throw at import time.
if (typeof (globalThis as { navigator?: unknown }).navigator === 'undefined') {
  (globalThis as { navigator: unknown }).navigator = {
    userAgent: 'node-test',
    platform: 'node',
    vendor: '',
    maxTouchPoints: 0,
  };
}
if (typeof (globalThis as { window?: unknown }).window === 'undefined') {
  (globalThis as { window: unknown }).window = globalThis;
}
if (typeof (globalThis as { document?: unknown }).document === 'undefined') {
  // Bare-bones document for Pixi's DOM checks; tests do not actually mount.
  (globalThis as { document: unknown }).document = {
    createElement: () => ({ style: {}, getContext: () => null }),
    createElementNS: () => ({ style: {} }),
    documentElement: { style: {} },
    body: { style: {} },
    head: { appendChild: () => undefined },
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
}
if (typeof (globalThis as { HTMLCanvasElement?: unknown }).HTMLCanvasElement === 'undefined') {
  (globalThis as { HTMLCanvasElement: unknown }).HTMLCanvasElement = class {};
}
