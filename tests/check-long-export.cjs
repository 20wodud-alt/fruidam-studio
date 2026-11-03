// Inspect actual browser downloads from a 15-visible-section fixture:
// first pink, middle blue, last green; one hidden magenta section.
const assert=require("node:assert/strict"),sharp=require("sharp");
(async()=>{
  const files=process.argv.slice(2);assert.equal(files.length,2,"Pass the downloaded JPG and PNG files.");
  const metadata=[];
  for(const [index,file] of files.entries()){
    const image=sharp(file),meta=await image.metadata();metadata.push(meta);
    assert.equal(meta.format,index===0?"jpeg":"png");assert.equal(meta.width,index===0?848:780);assert.ok(meta.height>10000,"all 15 sections must be in one tall image");
    const {data,info}=await image.removeAlpha().raw().toBuffer({resolveWithObject:true});
    const seen=new Set();let hidden=false;
    const colors=[[247,217,210],[221,232,255],[217,242,217]];
    for(let y=0;y<info.height;y++){
      const offset=(y*info.width+5)*info.channels,rgb=Array.from(data.subarray(offset,offset+3));
      colors.forEach((color,i)=>{if(color.every((c,k)=>Math.abs(c-rgb[k])<5))seen.add(i);});
      if(rgb[0]>250&&rgb[1]<5&&rgb[2]>250)hidden=true;
    }
    assert.deepEqual([...seen],[0,1,2],"first, middle and last sections must all appear in order");assert.equal(hidden,false,"hidden section is excluded");
    console.log(`${meta.format}: ${meta.width} × ${meta.height}; first/middle/last present, hidden section excluded.`);
  }
  assert.ok(Math.abs(metadata[0].height/848-metadata[1].height/780)<.01,"platform width changes keep the full page proportion");
  console.log("PASS: one decodable long JPG and PNG, full-page coverage, no ZIP or numbered parts.");
})().catch(error=>{console.error(error);process.exitCode=1;});
