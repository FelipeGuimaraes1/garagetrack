import fs from "node:fs/promises";
import sharp from "sharp";
import toIco from "to-ico";

const SRC = "public/favicon.svg";
const OUT = "public";

const sizesPng = [180, 192, 512]; // para manifest + Apple
const sizesIco = [16, 32, 48]; // múltiplos tamanhos dentro do .ico

async function main() {
  const svg = await fs.readFile(SRC);

  // PNGs
  await Promise.all(
    sizesPng.map((s) =>
      sharp(svg).resize(s, s).png().toFile(`${OUT}/favicon-${s}.png`)
    )
  );

  // Apple touch icon (180x180)
  await fs.copyFile(`${OUT}/favicon-180.png`, `${OUT}/apple-touch-icon.png`);

  // ICO (16, 32, 48)
  const icoBuffers = await Promise.all(
    sizesIco.map((s) => sharp(svg).resize(s, s).png().toBuffer())
  );
  const ico = await toIco(icoBuffers);
  await fs.writeFile(`${OUT}/favicon.ico`, ico);

  console.log("Favicons gerados em /public 🎉");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
