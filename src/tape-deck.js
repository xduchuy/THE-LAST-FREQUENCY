import {morseEvents} from './field-operations.js';
// Rebuild the radio's procedural signal, not speech. Saved tapes reference collected stations.
export function renderTape(station,sampleRate){
 const events=morseEvents(station.morseCodeString||'... --- ...');
 const duration=events.reduce((n,e)=>n+e.duration,0)*3+.8;
 const pcm=new Float32Array(Math.ceil(sampleRate*duration));let cursor=.3,seed=1974;
 for(let i=0;i<pcm.length;i++){seed=(seed*1664525+1013904223)>>>0;pcm[i]=(seed/4294967296-.5)*.012;}
 for(let repeat=0;repeat<3;repeat++)for(const e of events){
  if(e.tone){for(let i=Math.floor(cursor*sampleRate);i<Math.min(pcm.length,(cursor+e.duration)*sampleRate);i++){
   const t=i/sampleRate-cursor,envelope=Math.min(1,t/.006,(e.duration-t)/.008);
   pcm[i]+=Math.sin(2*Math.PI*(station.carrierPitch||660)*i/sampleRate)*.23*Math.max(0,envelope);
  }}cursor+=e.duration;
 }return pcm;
}
export class TapeDeck{
 constructor(audio){this.audio=audio;this.source=null;this.gain=null;this.station=null;this.buffer=null;this.offset=0;this.rate=1;this.started=0;}
 select(station){if(this.station?.id===station.id)return;this.stop();this.station=station;this.buffer=null;}
 get position(){return this.source?Math.min(this.duration,this.offset+(this.audio.ctx.currentTime-this.started)*this.rate):this.offset;}
 get duration(){return this.buffer?.duration||0;}
 play(){
  if(!this.station||this.source)return;this.audio.init();const ctx=this.audio.ctx;if(!ctx)return;
  if(!this.buffer){const pcm=renderTape(this.station,ctx.sampleRate);this.buffer=ctx.createBuffer(1,pcm.length,ctx.sampleRate);this.buffer.copyToChannel(pcm,0);}
  if(this.offset>=this.duration)this.offset=0;
  const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=this.buffer;source.playbackRate.value=this.rate;
  gain.gain.value=0;gain.gain.linearRampToValueAtTime(.7*this.audioVolume,ctx.currentTime+.02);
  source.connect(gain);gain.connect(this.audio.limiter);this.source=source;this.gain=gain;this.started=ctx.currentTime;
  source.onended=()=>{source.disconnect();gain.disconnect();if(this.source===source){this.source=null;this.gain=null;this.offset=this.duration;}};
  source.start(0,this.offset);
 }
 get audioVolume(){return this.volume??.8;}
 pause(){if(!this.source)return;this.offset=this.position;const source=this.source,gain=this.gain;this.source=null;this.gain=null;gain.gain.setTargetAtTime(0,this.audio.ctx.currentTime,.005);source.stop(this.audio.ctx.currentTime+.025);}
 stop(){this.pause();this.offset=0;}
 seek(seconds){const playing=Boolean(this.source);this.pause();this.offset=Math.max(0,Math.min(this.duration,Number(seconds)||0));if(playing)this.play();}
 speed(value){if(![.5,.75,1].includes(value))return;const playing=Boolean(this.source);this.pause();this.rate=value;if(playing)this.play();}
}
