import https from "node:https";
import path from "node:path";
import sharp from "sharp";

const TILE_SIZE = 256;
const ZOOM = 14;
const X_START = 8581;
const Y_START = 4902;
const COLS = 5;
const ROWS = 2;

const UA = "tomtesjekk-hero-kart/1.0 (andresensander@gmail.com)";

function fetchTile(x, y) {
  // Kartverket WMTS: path order is /{z}/{y}/{x}
  const url = `https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/${ZOOM}/${y}/${x}.png`;
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        { headers: { "User-Agent": UA }, rejectUnauthorized: false },
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
  console.log(`Kartverket topo: ${COLS}×${ROWS} tiles @ z${ZOOM}…`);
  const composites = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const buf = await fetchTile(X_START + col, Y_START + row);
      composites.push({
        input: buf,
        left: col * TILE_SIZE,
        top: row * TILE_SIZE,
      });
      process.stdout.write(".");
    }
  }
  console.log(" ferdig.");

  const outPath = path.resolve("public/hero-kart-kv.jpg");
  await sharp({
    create: {
      width: COLS * TILE_SIZE,
      height: ROWS * TILE_SIZE,
      channels: 3,
      background: { r: 245, g: 242, b: 235 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outPath);

  console.log(`Skrev ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
