const fs=require('fs');const sharp=require('sharp');
(async()=>{
fs.mkdirSync('public/photos',{recursive:true});
const photos=[['apple','https://images.unsplash.com/photo-1739079316621-367e6e138781?w=1500&q=90&fit=max&fm=jpg'],['citrus','https://images.unsplash.com/photo-1605693681813-beef2f8fe022?w=1500&q=90&fit=max&fm=jpg'],['grape','https://images.unsplash.com/photo-1756364171636-7996379c51d4?w=1500&q=90&fit=max&fm=jpg']];
await Promise.all(photos.map(async([name,url])=>{const r=await fetch(url);if(!r.ok)throw Error(name+' download failed '+r.status);const b=Buffer.from(await r.arrayBuffer());await sharp(b).rotate().resize({width:1400,height:1400,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toFile(`public/photos/fruit-${name}.webp`);console.log(name,await sharp(`public/photos/fruit-${name}.webp`).metadata().then(m=>({width:m.width,height:m.height})));}));
})();
