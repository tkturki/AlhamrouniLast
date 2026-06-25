declare module 'jsqr' {
  interface QRCode {
    data: string;
    binaryData: Uint8Array;
    version: number;
    location: {
      topLeftCorner: { x: number; y: number };
      topRightCorner: { x: number; y: number };
      bottomLeftCorner: { x: number; y: number };
      bottomRightCorner: { x: number; y: number };
      topLeftAlignmentPattern: { x: number; y: number };
      topRightAlignmentPattern: { x: number; y: number };
      bottomLeftAlignmentPattern: { x: number; y: number };
    };
  }

  interface Options {
    inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
    canBreak?: boolean;
  }

  function QRCode(data: Uint8ClampedArray, width: number, height: number, options?: Options): QRCode | null;

  export = QRCode;
}
