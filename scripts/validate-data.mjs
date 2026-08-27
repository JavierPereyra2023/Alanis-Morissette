import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dataPath = resolve(root, "sitio/js/datos.js");

export function loadData() {
  const source = readFileSync(dataPath, "utf8").replace(/^export /gm, "");
  return vm.runInNewContext(`${source}\n({ biografia, discografia, timeline, argentina, media })`, {});
}

export function validateData(data) {
  const errors = [];
  const requireArray = (name, value) => {
    if (!Array.isArray(value) || value.length === 0) errors.push(`${name} debe ser un array no vacío`);
  };

  requireArray("discografia", data.discografia);
  requireArray("timeline.eras", data.timeline?.eras);
  requireArray("argentina.visits", data.argentina?.visits);
  requireArray("media", data.media);

  const ids = new Set();
  for (const [index, item] of (data.media || []).entries()) {
    if (!item.id) errors.push(`media[${index}] no tiene id`);
    if (ids.has(item.id)) errors.push(`id multimedia duplicado: ${item.id}`);
    ids.add(item.id);
    if (!item.src && !item.referencesOnly) errors.push(`media[${index}] no tiene src`);
    if (item.referencesOnly && !item.pageUrl) errors.push(`media[${index}] de referencia no tiene pageUrl`);
    if (!item.referencesOnly && item.src && !existsSync(resolve(root, "sitio", item.src))) {
      errors.push(`imagen no encontrada: ${item.src}`);
    }
  }

  for (const album of data.discografia || []) {
    if (!album.title || !Number.isInteger(album.year)) errors.push(`álbum inválido: ${album.title || "sin título"}`);
    if (!Array.isArray(album.tracks)) errors.push(`tracks inválidos en: ${album.title}`);
    for (const link of album.officialLinks || []) {
      if (!/^https?:\/\//i.test(link.url || "")) errors.push(`URL inválida en: ${album.title}`);
    }
  }

  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const errors = validateData(loadData());
  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Datos válidos: estructura, IDs, URLs e imágenes locales comprobados.");
  }
}
