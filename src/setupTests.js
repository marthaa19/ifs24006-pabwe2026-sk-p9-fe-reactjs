import '@testing-library/jest-dom'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

HTMLCanvasElement.prototype.getContext = () => null

document.getSelection = () => ({
  removeAllRanges: () => {},
  addRange: () => {},
  getRangeAt: () => ({}),
  rangeCount: 0,
})
Range.prototype.getBoundingClientRect = () => ({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 })
Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} })
