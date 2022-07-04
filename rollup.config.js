import typescript from "@rollup/plugin-typescript";
export default{
  input: 'src/index.ts',
  output:[
    {
    file: 'lib/vue-thin.cjs.js',
    format:'cjs',
    },  
    {
      file: 'lib/vue-thin.esm.js',
      format:'es',
    },  
  ],
  plugins:[
    typescript(),
  ]
}