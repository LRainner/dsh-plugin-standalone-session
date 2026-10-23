import { build } from 'esbuild'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

await rm(join(root, 'lib'), { recursive: true, force: true })
await mkdir(join(root, 'lib'), { recursive: true })

// Host half: a plain ESM plugin (Cordis function plugin).
await build({
  absWorkingDir: root,
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  sourcemap: false,
  logLevel: 'info',
})

// Client half: a lazily materialized CJS factory registered with the page's
// Module Loader. React and the JSX runtime are platform modules, never bundled.
const clientOut = join(root, 'lib', 'client.bundle.cjs')
await build({
  absWorkingDir: root,
  entryPoints: ['src/client/index.ts'],
  outfile: clientOut,
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  target: 'es2022',
  jsx: 'automatic',
  jsxImportSource: 'react',
  external: ['react', 'react/jsx-runtime'],
  sourcemap: false,
  logLevel: 'info',
})

const body = await readFile(clientOut, 'utf8')
await rm(clientOut, { force: true })
const wrapped = `window.__ModuleLoader__.load({
  id: ${JSON.stringify(pkg.name)},
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
${body}
    return module.exports;
  }
});
`
await writeFile(join(root, 'lib', 'client.js'), wrapped, 'utf8')
console.log(`built lib/index.js and lib/client.js (${wrapped.length} bytes)`)
