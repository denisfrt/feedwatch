import * as esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: true,
    format: 'cjs',
    platform: 'node',
    target: ['node26'],
    outfile: 'dist/backend.js',
    external: ["better-sqlite3"]
})
