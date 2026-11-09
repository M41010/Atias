/**
 * Genera las imágenes para redes sociales (1200×630) de cada idioma en public/og/.
 * Se ejecuta a mano cuando cambian el logo o los textos: node scripts/og-images.mjs
 */
import sharp from "sharp";

const TEXTS = {
  es: ["Previsión de cosecha en invernadero", "Cuenta la cosecha", "antes de recogerla."],
  en: ["Greenhouse harvest forecasting", "Count the harvest", "before you pick it."],
  fr: ["Prévision de récolte sous serre", "Comptez la récolte", "avant de la cueillir."],
  nl: ["Oogstprognose voor de kas", "Tel de oogst", "voordat je plukt."],
  it: ["Previsione del raccolto in serra", "Conta il raccolto", "prima di raccoglierlo."],
  pt: ["Previsão de colheita em estufa", "Conte a colheita", "antes de a apanhar."],
};

const esc = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function grid() {
  const lines = [];
  for (let x = 0; x <= 1200; x += 24) lines.push(`<path d="M${x} 0V630" stroke="#0f2b20" stroke-opacity="${x % 120 === 0 ? 0.22 : 0.07}"/>`);
  for (let y = 0; y <= 630; y += 24) lines.push(`<path d="M0 ${y}H1200" stroke="#0f2b20" stroke-opacity="${y % 120 === 0 ? 0.22 : 0.07}"/>`);
  return lines.join("");
}

for (const [locale, [eyebrow, line1, line2]] of Object.entries(TEXTS)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f1f4ec"/>${grid()}
  <rect x="0" y="560" width="1200" height="70" fill="#0f2b20"/>
  <g transform="translate(72 60) scale(3.4) translate(-15.5 -19.5)">
    <path d="M17 33A7 12 0 0 1 31 33" fill="none" stroke="#0f2b20" stroke-width="3"/>
    <circle cx="24" cy="27.3" r="3.2" fill="#3f8f2a"/>
  </g>
  <text x="136" y="106" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="64" letter-spacing="4" fill="#0f2b20">TIAS</text>
  <text x="72" y="250" font-family="Arial, sans-serif" font-weight="700" font-size="30" letter-spacing="2" fill="#3a5446">${esc(eyebrow.toUpperCase())}</text>
  <text x="72" y="345" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="72" fill="#0f2b20">${esc(line1)}</text>
  <text x="72" y="440" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="72" fill="#0f2b20">${esc(line2)}</text>
  <g transform="translate(880 -70) scale(5.6)">
    <path d="M3 33A7 12 0 0 1 17 33A7 12 0 0 1 31 33A7 12 0 0 1 45 33" fill="none" stroke="#0f2b20" stroke-width="3" stroke-linejoin="round"/>
    <path d="M1.5 33H46.5M3 33v9M17 33v9M31 33v9M45 33v9" fill="none" stroke="#0f2b20" stroke-width="3"/>
    <circle cx="24" cy="27.3" r="3.2" fill="#3f8f2a"/>
  </g>
</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(`public/og/${locale}.png`);
  console.log(`public/og/${locale}.png`);
}
