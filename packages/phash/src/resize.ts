/**
 * An area-average (box filter) downscaler.
 * Safely scales an RGBA image buffer (Uint8ClampedArray) to fixed dimensions.
 * This function guarantees mathematically identical resizing behavior across Node (sharp) 
 * and browser (canvas) boundaries, which is critical for perceptual hashing parity.
 */
export function downscaleBoxFilter(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  outWidth: number,
  outHeight: number
): Uint8ClampedArray {
  const outData = new Uint8ClampedArray(outWidth * outHeight * 4);
  const blockWidth = width / outWidth;
  const blockHeight = height / outHeight;

  for (let y = 0; y < outHeight; y++) {
    for (let x = 0; x < outWidth; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      const startY = Math.floor(y * blockHeight);
      const endY = Math.floor((y + 1) * blockHeight);
      const startX = Math.floor(x * blockWidth);
      const endX = Math.floor((x + 1) * blockWidth);

      for (let iy = startY; iy < endY; iy++) {
        for (let ix = startX; ix < endX; ix++) {
          const idx = (iy * width + ix) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          a += data[idx + 3];
          count++;
        }
      }
      
      const outIdx = (y * outWidth + x) * 4;
      if (count > 0) {
        outData[outIdx] = Math.round(r / count);
        outData[outIdx + 1] = Math.round(g / count);
        outData[outIdx + 2] = Math.round(b / count);
        outData[outIdx + 3] = Math.round(a / count);
      }
    }
  }
  
  return outData;
}
