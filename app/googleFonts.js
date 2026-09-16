// Google Fonts catalog search. Uses the keyless metadata feed behind
// fonts.google.com, fetched once per dev-server run and kept in memory.
const METADATA_URL = "https://fonts.google.com/metadata/fonts";

let catalog = null;
let loading = null;

async function loadCatalog() {
  if (catalog) return catalog;
  loading ||= fetch(METADATA_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Google Fonts returned ${res.status}.`);
      return res.text();
    })
    .then((text) => {
      const data = JSON.parse(text.slice(text.indexOf("{")));
      catalog = data.familyMetadataList
        .map((font) => ({
          family: font.family,
          category: font.category,
          popularity: font.popularity ?? 9999,
          weights: Object.keys(font.fonts || {})
            .filter((key) => /^\d+$/.test(key))
            .map(Number)
            .sort((a, b) => a - b),
        }))
        .filter((font) => font.weights.length)
        .sort((a, b) => a.popularity - b.popularity);
      return catalog;
    })
    .catch((error) => {
      throw new Error(`Could not load the Google Fonts catalog: ${error.message}`);
    })
    .finally(() => {
      loading = null;
    });
  return loading;
}

export async function searchFonts({ q = "", category = "", limit = 24 } = {}) {
  const fonts = await loadCatalog();
  const needle = String(q).trim().toLowerCase();
  let rows = category ? fonts.filter((font) => font.category === category) : fonts;
  if (needle) {
    rows = rows
      .filter((font) => font.family.toLowerCase().includes(needle))
      .sort(
        (a, b) =>
          Number(!a.family.toLowerCase().startsWith(needle)) -
          Number(!b.family.toLowerCase().startsWith(needle))
      );
  }
  const max = Math.min(Math.max(Number(limit) || 24, 1), 100);
  return { total: rows.length, fonts: rows.slice(0, max).map(({ popularity, ...font }) => font) };
}
