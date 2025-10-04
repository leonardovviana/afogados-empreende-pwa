import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(process.cwd());
const INPUT_ICON = path.join(ROOT, "src", "assets", "icon.png");
const OUTPUT_DIR = path.join(ROOT, "public");
const SIZES = [192, 512];
const PADDING_RATIO = 0.18; // 18% de área transparente total

async function ensureIconExists() {
  try {
    await fs.access(INPUT_ICON);
  } catch {
    throw new Error(`Ícone base não encontrado em ${INPUT_ICON}`);
  }
}

async function generateIcon(size) {
  const innerSize = Math.round(size * (1 - PADDING_RATIO));

  const resizedBuffer = await sharp(INPUT_ICON)
    .resize(innerSize, innerSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const outputBuffer = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedBuffer, gravity: "center" }])
    .png()
    .toBuffer();

  const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
  await sharp(outputBuffer).png({ compressionLevel: 9 }).toFile(outputPath);
  console.log(`✔ Gerado ${outputPath}`);
}

async function main() {
  await ensureIconExists();
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  await Promise.all(SIZES.map((size) => generateIcon(size)));
  console.log("Ícones gerados com padding transparente para Android.");
}

main().catch((error) => {
  console.error("Erro ao gerar ícones:", error);
  process.exit(1);
});
