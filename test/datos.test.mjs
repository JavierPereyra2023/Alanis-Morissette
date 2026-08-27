import assert from "node:assert/strict";
import test from "node:test";
import { loadData, validateData } from "../scripts/validate-data.mjs";

test("los datos editoriales cumplen el esquema mínimo", () => {
  assert.deepEqual(validateData(loadData()), []);
});

test("las imágenes utilizables tienen archivos locales", () => {
  const data = loadData();
  const usable = data.media.filter((item) => !item.referencesOnly);
  assert.ok(usable.length > 0);
  assert.ok(usable.every((item) => item.src.startsWith("images/")));
});
