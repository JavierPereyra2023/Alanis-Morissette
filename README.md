# Alanis Morissette: documental digital

Micrositio editorial estático construido con HTML, CSS y JavaScript nativo.

## Desarrollo

El sitio se sirve directamente desde `sitio/`. Para una prueba local puede usarse cualquier servidor estático, por ejemplo `npx serve sitio`.

## Validaciones

Requiere Node.js 18 o superior. Los comandos disponibles son:

- `npm test`: ejecuta los tests integrados de Node.
- `npm run validate`: valida la estructura de `sitio/js/datos.js`, las URLs y las imágenes locales.

## Despliegue

Vercel publica la carpeta `sitio/` según la configuración de `vercel.json`. No se necesitan dependencias de runtime.
