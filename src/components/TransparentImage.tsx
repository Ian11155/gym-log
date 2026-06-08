import React, { useState, useEffect } from "react";

interface TransparentImageProps {
  src: string;
  alt?: string;
  className?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}

export default function TransparentImage({ src, alt, className, referrerPolicy }: TransparentImageProps) {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    // Enable cross-origin for canvas operations if needed (not strictly required for local files)
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setProcessedSrc(src);
        return;
      }

      const width = img.naturalWidth;
      const height = img.naturalHeight;
      canvas.width = width;
      canvas.height = height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Function to get RGB at coordinate
        const getPixel = (x: number, y: number) => {
          const idx = (y * width + x) * 4;
          return {
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
            a: data[idx + 3],
          };
        };

        // Step 1: Detect background checkerboard colors by looking at edge pixels.
        // We cluster the colors along the top and bottom borders.
        const edgeColors: { r: number; g: number; b: number }[] = [];
        
        const tryAddColor = (r: number, g: number, b: number) => {
          // If similar to already added, skip
          const isSimilar = edgeColors.some(
            (c) =>
              Math.pow(c.r - r, 2) + Math.pow(c.g - g, 2) + Math.pow(c.b - b, 2) < 400 // sqrt(400) = 20 distance
          );
          if (!isSimilar) {
            edgeColors.push({ r, g, b });
          }
        };

        // Sample along top and bottom edges
        for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 50))) {
          const top = getPixel(x, 0);
          if (top.a > 0) tryAddColor(top.r, top.g, top.b);

          const bottom = getPixel(x, height - 1);
          if (bottom.a > 0) tryAddColor(bottom.r, bottom.g, bottom.b);
        }

        // Sample along left and right edges
        for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 50))) {
          const left = getPixel(0, y);
          if (left.a > 0) tryAddColor(left.r, left.g, left.b);

          const right = getPixel(width - 1, y);
          if (right.a > 0) tryAddColor(right.r, right.g, right.b);
        }

        // Default fallback if we didn't find any distinct colors
        if (edgeColors.length === 0) {
          edgeColors.push({ r: 255, g: 255, b: 255 }); // white
          edgeColors.push({ r: 204, g: 204, b: 204 }); // standard grid grey
        }

        // Helper to check if a pixel is a background color
        const isBackgroundColor = (r: number, g: number, b: number, a: number) => {
          if (a === 0) return true;
          // Check proximity to any detected edge colors
          return edgeColors.some(
            (c) =>
              Math.pow(c.r - r, 2) + Math.pow(c.g - g, 2) + Math.pow(c.b - b, 2) < 1600 // sqrt(1600) = 40 distance (generous to handle compression/anti-aliasing)
          );
        };

        // Step 2: Flood-fill to find connected background region starting from the edge borders.
        // This prevents keying out eyes/teeth inside the black outline of the character.
        const visited = new Uint8Array(width * height);
        const queue: [number, number][] = [];

        // Seed with all border coordinates
        for (let x = 0; x < width; x++) {
          queue.push([x, 0]);
          queue.push([x, height - 1]);
          visited[0 * width + x] = 1;
          visited[(height - 1) * width + x] = 1;
        }
        for (let y = 1; y < height - 1; y++) {
          queue.push([0, y]);
          queue.push([width - 1, y]);
          visited[y * width + 0] = 1;
          visited[y * width + (width - 1)] = 1;
        }

        let head = 0;
        while (head < queue.length) {
          const [cx, cy] = queue[head++];
          const idx = (cy * width + cx) * 4;

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (isBackgroundColor(r, g, b, a)) {
            // It's background! Turn it transparent
            data[idx + 3] = 0;

            // Check 4 neighbors
            const neighbors = [
              [cx + 1, cy],
              [cx - 1, cy],
              [cx, cy + 1],
              [cx, cy - 1],
            ];

            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (visited[nIdx] === 0) {
                  visited[nIdx] = 1;
                  queue.push([nx, ny]);
                }
              }
            }
          }
        }

        // Put the modified image data back
        ctx.putImageData(imgData, 0, 0);
        setProcessedSrc(canvas.toDataURL());
      } catch (err) {
        // Fallback to original image if cross-origin or canvas read error
        console.error("TransparentImage process error: ", err);
        setProcessedSrc(src);
      }
    };

    img.onerror = () => {
      setProcessedSrc(src);
    };
  }, [src]);

  return (
    <img
      src={processedSrc || src}
      alt={alt || "Transparent image"}
      className={className}
      referrerPolicy={referrerPolicy}
    />
  );
}
