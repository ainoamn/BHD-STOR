const fs = require("fs");
const path = require("path");
const sharp = require("C:/dev/BHD-STOR/frontend/node_modules/sharp");

const src = "C:/Users/ahami/.cursor/projects/c-dev-BHD-STOR/assets";
const dest = "C:/dev/BHD-STOR/frontend/public/brand/oman";

const jobs = [
  { file: "oman-hero-v2.jpg", out: "hero-coast.webp", width: 2200, quality: 84 },
  { file: "oman-fort-v3.jpg", out: "fort-nizwa.webp", width: 1400, quality: 82 },
  { file: "oman-alam-v2.jpg", out: "palace-alam.webp", width: 1400, quality: 82 },
  { file: "oman-mutrah-v2.jpg", out: "souq-mutrah.webp", width: 1400, quality: 82 },
  { file: "oman-coast-v2.jpg", out: "fort-coast.webp", width: 1400, quality: 82 },
];

(async () => {
  fs.mkdirSync(dest, { recursive: true });
  for (const job of jobs) {
    const input = path.join(src, job.file);
    const output = path.join(dest, job.out);
    if (!fs.existsSync(input)) {
      console.error("missing", input);
      process.exit(1);
    }
    await sharp(input)
      .resize({ width: job.width, withoutEnlargement: true })
      .webp({ quality: job.quality })
      .toFile(output);
    const kb = Math.round(fs.statSync(output).size / 1024);
    console.log(`${job.file} -> ${job.out} (${kb} KB)`);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
