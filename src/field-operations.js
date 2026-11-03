// Optional post-CHRONOS contracts. Never mutates the campaign mission.
export const CONTRACTS=[
 {id:'relay',name:'Đài mất tích',duration:180,brief:'Tìm hai đài tiếp sức: vùng 3.1–3.3 MHz / anten 35°, sau đó 8.8–9.0 MHz / anten 145°. Giữ THU mỗi đài 3 giây.',targets:['borealis','k19']},
 {id:'telegram',name:'Điện báo lúc bình minh',duration:240,brief:'Thu ECHO-7 ở 4.6–4.9 MHz / anten 110° trong 3 giây. Đối chiếu xung Morse trên băng điện báo rồi nộp hai chữ số.',targets:['echo7'],morse:'....- --...',answer:'47'},
 {id:'bearing',name:'Định hướng phao biển',duration:300,brief:'Dò ORPHEUS vùng 6.0–6.3 MHz. Tự căn anten đến khi tín hiệu đủ mạnh, giữ THU 3 giây, rồi báo hướng anten tối ưu (độ).',targets:['orpheus'],answer:'65'}
];
export function cleanFieldData(raw={}){
 const ids=['borealis','echo7','orpheus','k19','helios4'];
 const pinned=[...new Set((Array.isArray(raw?.pinned)?raw.pinned:[]).filter(id=>ids.includes(id)))].slice(0,5);
 const links=(Array.isArray(raw?.links)?raw.links:[]).filter(p=>Array.isArray(p)&&p.length===2&&p[0]!==p[1]&&p.every(id=>pinned.includes(id))).slice(0,10);
 const marks={};for(const id of ids)if(typeof raw?.marks?.[id]==='string')marks[id]=raw.marks[id].slice(0,120);
 const completed=[...new Set((Array.isArray(raw?.completed)?raw.completed:[]).filter(id=>CONTRACTS.some(c=>c.id===id)))];
 const c=CONTRACTS.find(c=>c.id===raw?.shift?.id);let shift=null;
 if(c){const elapsed=Number.isFinite(raw.shift.elapsed)?Math.max(0,Math.min(c.duration,raw.shift.elapsed)):0;
  const index=Number.isInteger(raw.shift.index)?Math.max(0,Math.min(c.targets.length,raw.shift.index)):0;
  const status=elapsed>=c.duration?'lost':['won','lost','awaiting'].includes(raw.shift.status)?raw.shift.status:'playing';
  const coherentStatus=(status==='won'||status==='awaiting')&&index!==c.targets.length?'playing':status;
  shift={id:c.id,status:coherentStatus,elapsed,index,progress:0};
 }
 return {pinned,links,marks,completed,shift};
}
export function startContract(data,id,unlocked){
 const c=CONTRACTS.find(c=>c.id===id);if(!unlocked||!c||data.shift?.status==='playing'||data.shift?.status==='awaiting')return false;
 data.shift={id,status:'playing',elapsed:0,index:0,progress:0};return true;
}
export function sideReception(shift,input){
 const c=CONTRACTS.find(c=>c.id===shift?.id);
 return Boolean(c&&shift.status==='playing'&&input.powerOn&&input.stationId===c.targets[shift.index]&&input.warmUpLevel>.85&&input.distance<=.032&&Math.abs(input.frequency-input.targetFrequency)<.005&&input.signal>=.68);
}
export function advanceContract(data,dt,input,continuous){
 const s=data.shift,c=CONTRACTS.find(c=>c.id===s?.id);if(!c||!['playing','awaiting'].includes(s.status)||!Number.isFinite(dt)||dt<=0)return;
 s.elapsed=Math.min(c.duration,s.elapsed+dt);
 if(s.elapsed>=c.duration){s.status='lost';s.progress=0;return;}
 if(s.status==='awaiting')return;
 if(dt<=2&&continuous&&input.holding&&sideReception(s,input))s.progress+=dt;else s.progress=0;
 if(s.progress>=3){s.progress=0;s.index++;if(s.index===c.targets.length){s.status=c.answer?'awaiting':'won';if(s.status==='won')complete(data,c.id);}}
}
function complete(data,id){if(!data.completed.includes(id))data.completed.push(id);}
export function answerContract(data,answer){
 const s=data.shift,c=CONTRACTS.find(c=>c.id===s?.id);if(!c||s.status!=='awaiting')return false;
 const ok=c.id==='bearing'?/^\d{1,3}$/.test(answer)&&Math.abs(Number(answer)-65)<=5:answer.trim()===c.answer;
 if(ok){s.status='won';complete(data,c.id);}return ok;
}
// Bounded ITU events used by the actual tape PCM renderer and the decoder display.
export function morseEvents(code,unit=.105){
 const events=[];for(const word of code.trim().split(/\s+/).slice(0,32)){
  const symbols=[...word].filter(c=>c==='.'||c==='-');
  symbols.forEach((c,i)=>{events.push({tone:true,duration:unit*(c==='-'?3:1)});if(i<symbols.length-1)events.push({tone:false,duration:unit});});
  events.push({tone:false,duration:unit*3});
 }return events;
}
export function receptionSound({frequency,targetFrequency,distance,signal,warmUpLevel},storm){
 const quality=Math.max(0,Math.min(1,signal*warmUpLevel));
 return {noise:Math.max(.018,.29*(1-quality)+ (storm?.active ? .07 : 0)),cutoff:700+(frequency-3)*100-quality*380,
  beat:160+Math.min(.3,Math.max(0,distance))*11800,whistle:distance<.14?.065*(1-quality)*Math.sin(Math.PI*Math.max(0,1-distance/.14)):0,
  movement:Math.min(1,Math.abs(targetFrequency-frequency)*12)};
}
export function roomWeather(mission,reducedMotion,blocked){
 const phase=mission.elapsed%90,storm=phase>=60&&phase<78,active=mission.status==='playing'&&!blocked;
 const pulse=active&&storm&&!reducedMotion?Math.max(0,Math.sin((phase-60)*1.6))**16:0;
 return {storm:active&&storm,flash:pulse*.35,lamp:active&&storm&&!reducedMotion?1-.09*Math.sin(phase*12)**2:1,rain:active&&storm?1.5:1};
}
