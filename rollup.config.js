import typescript from "@rollup/plugin-typescript"

export default {
    input: './src/index.ts',
    output: [
        {
            format: 'cjs',
            file: 'lib/simple-vue.cjs.js'
        },
        {
            format: 'es',
            file: 'lib/simple-vue.esm.js'
        }
    ],
    plugins: [typescript()]
}