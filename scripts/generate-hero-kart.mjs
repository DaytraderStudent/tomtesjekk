import https from "node:https";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const TILE_SIZE = 256;
const ZOOM = 14;

// Grimstad-området (Agder, Norge) — blanding av boligklynger, skog, vei, vann
const X_START = 8581;
const Y_START = 4902;
const COLS = 5;
const ROWS = 2;

const UA = "tomtesjekk-hero-kart/1.0 (andresensander@gmail.com)";

function fetchTile(x, y) {
  const url = `https://tile.openstreetmap.org/${ZOOM}/${x}/${y}.png`;
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: { "User-Agent": UA },
          rejectUnauthorized: false,
        },
        (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`${url} → ${res.statusCode}`));
            return;
          }
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => resolve(Buffer.concat(chunks)));
          res.on("error", reject);
        },
      )
      .on("error", reject);
  });
}

async function main() {
  console.log(
    `Henter ${COLS}×${ROWS} tiles fra (${X_START},${Y_START}) @ z${ZOOM}…`,
  );
  const composites = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = X_START + col;
      const y = Y_START + row;
      const buf = await fetchTile(x, y);
      composites.push({
        input: buf,
        left: col * TILE_SIZE,
        top: row * TILE_SIZE,
      });
      process.stdout.write(".");
    }
  }
  console.log(" ferdig.");

  const width = COLS * TILE_SIZE;
  const height = ROWS * TILE_SIZE;

  const outPath = path.resolve("public/hero-kart.jpg");
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 245, g: 242, b: 235 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outPath);

  console.log(`Skrev ${outPath} (${width}×${height})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
