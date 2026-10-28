import {promises as fs} from 'node:fs';
import path from 'node:path';
// These are the font/weight pairs imported by app/fonts.css.
const fonts=[['noto-sans-kr',[400,700]],['noto-serif-kr',[400,700]],['gaegu',[400,700]],['gowun-dodum',[400]],['gowun-batang',[400,700]],['do-hyeon',[400]],['black-han-sans',[400]],['jua',[400]],['ibm-plex-sans-kr',[400,700]]];
const destination=path.join(process.cwd(),'public','font-exports');await fs.mkdir(destination,{recursive:true});
for(const [name,weights] of fonts){
  const directory=path.join(process.cwd(),'node_modules','@fontsource',name),license=await fs.readFile(path.join(directory,'LICENSE'),'utf8');
  if(!license.includes('SIL OPEN FONT LICENSE Version 1.1'))throw new Error(`Verify font license: ${name}`);
  let result=`/* ${name}\n${license.replaceAll('*/','* /')} */\n`;
  for(const weight of weights){
    const css=await fs.readFile(path.join(directory,`${weight}.css`),'utf8');
    for(const block of css.matchAll(/@font-face\s*\{[^}]+\}/g)){
      const match=block[0].match(/url\((?:['"])?\.\/files\/([a-zA-Z0-9-]+\.woff2)(?:['"])?\)/);if(!match)continue;
      const bytes=await fs.readFile(path.join(directory,'files',match[1]));result+=block[0].replace(/src:[^;]+;/,`src: url(data:font/woff2;base64,${bytes.toString('base64')}) format('woff2');`)+'\n';
    }
  }
  const file=path.join(destination,`${name}.css`);if(await fs.readFile(file,'utf8').catch(()=>null)!==result)await fs.writeFile(file,result);
}
console.log('Prepared offline exports for 9 OFL font families.');
