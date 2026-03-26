import sharp from "sharp";
import fs from "fs";
import path from "path";

export const compressToTarget = async (inputBuffer, targetKB = 100) => {
  const targetBytes = targetKB * 1024;
  const metadata = await sharp(inputBuffer).metadata();
  const originalWidth = metadata.width || 2500;

  console.log(`Original width: ${originalWidth}px | Starting optimized compression...`);

  // Smart width selection - bigger images get smaller starting width
  let width = originalWidth > 5500 ? 1280 :
              originalWidth > 3500 ? 1450 :
              originalWidth > 2500 ? 1600 : 
              Math.min(1900, originalWidth);

  console.log(`Starting width: ${width}px`);

  // Binary search for the HIGHEST quality possible
  let low = 82;      // Increased minimum quality (was 80)
  let high = 94;
  let bestBuffer = null;
  let bestQuality = 82;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    const resultBuffer = await sharp(inputBuffer)
      .resize({
        width: Math.min(width, originalWidth),
        withoutEnlargement: true,
        fit: "inside",
        kernel: "lanczos3"
      })
      .webp({
        quality: mid,
        effort: 6,
        smartSubsample: true,
        mixed: true,
        useSharpYuv: true
      })
      .withMetadata(false)
      .toBuffer();

    const sizeKB = resultBuffer.length / 1024;

    console.log(`Quality ${mid} @ ${width}px → ${sizeKB.toFixed(1)}KB`);

    if (resultBuffer.length <= targetBytes) {
      bestBuffer = resultBuffer;
      bestQuality = mid;
      low = mid + 1;        // Try higher quality
    } else {
      high = mid - 1;
    }
  }

  if (bestBuffer) {
    console.log(`✅ Success → Quality ${bestQuality} | Size ${(bestBuffer.length / 1024).toFixed(1)}KB`);
    return bestBuffer;
  }

  // Final fallback - reduce width more aggressively and keep good quality
  console.log("Still over target → reducing width further...");
  width = Math.floor(width * 0.82);

  const finalBuffer = await sharp(inputBuffer)
    .resize({
      width: Math.min(width, originalWidth),
      withoutEnlargement: true,
      fit: "inside",
      kernel: "lanczos3"
    })
    .webp({
      quality: 86,                    // Good quality even in fallback
      effort: 6,
      smartSubsample: true,
      mixed: true,
      useSharpYuv: true
    })
    .withMetadata(false)
    .toBuffer();

  const finalKB = finalBuffer.length / 1024;
  console.log(`Final fallback: Width ~${width}px | Quality 86 → ${finalKB.toFixed(1)}KB`);

  return finalBuffer;
};

// Handle upload
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const finalBuffer = await compressToTarget(req.file.buffer, 100);

    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `compressed_${Date.now()}.webp`;
    const filePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filePath, finalBuffer);

    const finalSizeKB = (finalBuffer.length / 1024).toFixed(2);

    console.log(`Final compressed size: ${finalSizeKB} KB`);

    res.status(200).json({
      url: `/uploads/${filename}`,
      sizeKB: parseFloat(finalSizeKB)
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
};