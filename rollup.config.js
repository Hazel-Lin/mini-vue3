import typescript from "@rollup/plugin-typescript";
export default{
  input: 'src/index.ts',
  output:[
    {
    file: 'dist/index.common.js',
    format:'cjs',
    name:'lib',
    },  
    {
      file: 'dist/index.esm.js',
      format:'es',
      name:'lib',
      },  
  ],
  plugin:[
    typescript(),
  ]
}