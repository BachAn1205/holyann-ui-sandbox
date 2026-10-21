// Canvas stub for browser environments
// This file is used to prevent "canvas" module resolution errors in Turbopack
// The canvas module is only needed for Node.js PDF rendering, not in browser

export function createCanvas() {
  return {
    getContext: () => ({}),
    toBuffer: () => Buffer.from([]),
    toDataURL: () => '',
  };
}

export function loadImage() {
  return Promise.resolve({});
}
