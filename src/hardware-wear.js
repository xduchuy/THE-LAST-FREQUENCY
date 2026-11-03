import * as THREE from 'three';
// Baked once at scene creation. Edges oxidize; frequently touched areas polish.
export function createAgedFaceplateTexture(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#272d28';ctx.fillRect(0,0,512,256);let seed=1974;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<1500;i++){
  let x=random()*512,y=random()*256;const edge=Math.min(x,512-x,y,256-y);
  if(edge>14&&random()>.025)continue;
  ctx.fillStyle=['#65472f','#866442','#434b3c','#1b211d','#a48d64'][Math.floor(random()*5)];ctx.globalAlpha=edge<8?.7:.22;
  ctx.fillRect(x,y,random()*6+.3,random()*2+.3);
 }
 ctx.globalAlpha=1;
 for(const [x,y] of [[17,19],[495,19],[17,240],[495,240]]){
  const gradient=ctx.createRadialGradient(x,y,2,x,y,16);gradient.addColorStop(0,'#775133aa');gradient.addColorStop(1,'#77513300');ctx.fillStyle=gradient;ctx.fillRect(x-16,y-16,32,32);
 }
 // Rubbed arcs near POWER/VOLUME/TUNING, leaving labels/instruments readable.
 ctx.strokeStyle='#9d977638';ctx.lineWidth=1.5;
 for(const [x,y,r] of [[238,210,10],[306,209,23],[428,204,44]]){ctx.beginPath();ctx.arc(x,y,r,.3,1.7);ctx.stroke();}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
