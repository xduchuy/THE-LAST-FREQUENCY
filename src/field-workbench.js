import {CONTRACTS,startContract,answerContract,sideReception,advanceContract} from './field-operations.js';
import {TapeDeck} from './tape-deck.js';
export function setupFieldWorkbench({audio,stations,getData,getMission,getInput,save,closeJournal,release}){
 const $=id=>document.getElementById(id),deck=new TapeDeck(audio);let lastNow=null,lastActive=false,evidence=false,lastIndex=-1,lastPaint=0,lastTapeIds='',lastRecords='';
 for(const id of ['tape-play','tape-stop','tape-rewind'])$(id).addEventListener('click',()=>{audio.init();audio.playMechanicalClick(180);});
 const message=text=>{$('side-feedback').textContent=text;};
 function text(id,value){if($(id).textContent!==String(value))$(id).textContent=String(value);}
 function option(select,value,label){const el=document.createElement('option');el.value=value;el.textContent=label;select.append(el);}
 function known(){return stations.filter(s=>getMission().collected.includes(s.id));}
 function tapes(){const ids=known().map(s=>s.id).join(',');if(ids===lastTapeIds)return;lastTapeIds=ids;const selected=$('tape-station').value;$('tape-station').replaceChildren();
  for(const s of known())option($('tape-station'),s.id,`${s.freq.toFixed(2)} MHz / ${s.id.toUpperCase()}`);
  if(known().some(s=>s.id===selected))$('tape-station').value=selected;
  $('tape-play').disabled=!ids;
 }
 function selectTape(){const station=known().find(s=>s.id===$('tape-station').value);if(station)deck.select(station);return station;}
 $('tape-station').addEventListener('change',()=>{deck.stop();selectTape();});
 $('tape-play').addEventListener('click',()=>{if(!selectTape())return;if(deck.source)deck.pause();else if(!audio.muted){deck.play();}});
 $('tape-stop').addEventListener('click',()=>deck.stop());
 $('tape-rewind').addEventListener('click',()=>deck.seek(deck.position-2));
 $('tape-speed').addEventListener('change',e=>deck.speed(Number(e.target.value)));
 $('tape-position').addEventListener('input',e=>deck.seek(Number(e.target.value)));
 for(const c of CONTRACTS)option($('side-contract'),c.id,c.name);
 function description(){const c=CONTRACTS.find(c=>c.id===$('side-contract').value);text('side-brief',c.brief);}
 $('side-contract').addEventListener('change',description);description();
 $('side-start').addEventListener('click',()=>{
  if(startContract(getData(),$('side-contract').value,getMission().status==='won')){lastNow=null;evidence=false;$('side-answer').value='';message('');release();save(true);closeJournal();}
  else message('Hoàn tất CHRONOS trước khi nhận ca phụ. Kết thúc ca phụ hiện tại trước khi nhận ca khác.');
 });
 $('side-abort').addEventListener('click',()=>{const s=getData().shift;if(s&&['playing','awaiting'].includes(s.status)){s.status='lost';s.progress=0;release();save(true);message('Đã kết thúc ca phụ. Ca CHRONOS giữ nguyên.');}});
 $('side-submit').addEventListener('click',()=>{const ok=answerContract(getData(),$('side-answer').value);message(ok?'ĐIỆN BÁO ĐÃ XÁC NHẬN · HOÀN TẤT CA PHỤ':'Chưa đúng. Đối chiếu băng thu hoặc tìm hướng có S-Meter mạnh nhất.');save(true);});
 function board(){
  const data=getData(),list=known();
  for(const id of ['board-station','board-from','board-to']){const value=$(id).value;$(id).replaceChildren();for(const s of list.filter(s=>id==='board-station'||data.pinned.includes(s.id)))option($(id),s.id,s.id.toUpperCase());if([...$(id).options].some(o=>o.value===value))$(id).value=value;}
  $('board-cards').replaceChildren();
  for(const id of data.pinned){const s=list.find(s=>s.id===id);if(!s)continue;const card=document.createElement('article');card.className='evidence-card';
   const heading=document.createElement('h5');heading.textContent=s.clueTitle;card.append(heading);
   const clue=document.createElement('p'),mark=data.marks[id];
   if(mark&&s.clueText.includes(mark)){const parts=s.clueText.split(mark);parts.forEach((part,i)=>{if(i){const el=document.createElement('mark');el.textContent=mark;clue.append(el);}clue.append(document.createTextNode(part));});}else clue.textContent=s.clueText;
   card.append(clue);const remove=document.createElement('button');remove.textContent='GỠ GHIM';remove.className='room-button';remove.addEventListener('click',()=>{data.pinned=data.pinned.filter(v=>v!==id);data.links=data.links.filter(p=>!p.includes(id));save(true);board();});card.append(remove);$('board-cards').append(card);
  }
  $('board-links').replaceChildren();for(const pair of data.links.filter(p=>p.every(id=>list.some(s=>s.id===id)))){const li=document.createElement('li');li.textContent=`${pair[0].toUpperCase()} ─── ${pair[1].toUpperCase()} `;
   const remove=document.createElement('button');remove.textContent='GỠ DÂY';remove.className='room-button';remove.addEventListener('click',()=>{data.links=data.links.filter(p=>p!==pair);save(true);board();});li.append(remove);$('board-links').append(li);}
  text('board-empty',list.length?'Chọn phiếu để ghim, khoanh dữ kiện rồi nối các trạm liên quan.':'Thu bản tin đầu tiên để lập bảng điều tra.');
 }
 $('board-pin').addEventListener('click',()=>{const id=$('board-station').value,data=getData();if(!known().some(s=>s.id===id))return;if(!data.pinned.includes(id))data.pinned.push(id);save(true);board();});
 $('board-highlight').addEventListener('click',()=>{const id=$('board-station').value;if(!known().some(s=>s.id===id))return;getData().marks[id]=$('board-mark').value.slice(0,120);save(true);board();});
 $('board-connect').addEventListener('click',()=>{const a=$('board-from').value,b=$('board-to').value,data=getData();if(a&&b&&a!==b&&!data.links.some(p=>p.includes(a)&&p.includes(b))){data.links.push([a,b]);save(true);board();}});
 function syncSide(){const data=getData(),s=data.shift,c=CONTRACTS.find(c=>c.id===s?.id);$('side-start').disabled=getMission().status!=='won'||Boolean(s&&['playing','awaiting'].includes(s.status));
  $('side-abort').disabled=!s||!['playing','awaiting'].includes(s.status);$('side-submit').disabled=s?.status!=='awaiting';
  text('side-state',c?`${c.name} · ${s.status==='won'?'HOÀN TẤT':s.status==='lost'?'MẤT LIÊN LẠC':s.status==='awaiting'?'CHỜ BÁO CÁO':'ĐANG TRỰC'} · ${Math.ceil(c.duration-s.elapsed)}s · ${s.index}/${c.targets.length}`:'Chỉ mở sau khi hoàn tất CHRONOS.');
  text('side-telegram',s?.id==='telegram'&&s.index>0?'ĐIỆN BÁO: ....-   --...':'');
  text('side-completed',`Hồ sơ ca phụ: ${data.completed.length}/3 hoàn tất`);
  const recordKey=JSON.stringify([data.completed,s?.id,s?.status]);
  if(recordKey!==lastRecords){
   lastRecords=recordKey;$('side-records').replaceChildren();
   const reports={relay:'Đã nối lại hai đài tiếp sức BOREALIS và K-19.',telegram:'Đã xác nhận điện báo 47.',bearing:'Đã xác nhận hướng phao biển trong khoảng 60–70°.'};
   for(const contract of CONTRACTS){
    const row=document.createElement('li');row.dataset.contract=contract.id;
    const complete=data.completed.includes(contract.id);
    const status=complete?'HOÀN TẤT':s?.id===contract.id?(s.status==='lost'?'MẤT LIÊN LẠC':s.status==='awaiting'?'CHỜ BÁO CÁO':'ĐANG TRỰC'):'CHƯA NHẬN CA';
    row.textContent=`${contract.name} · ${status}${complete?' — '+reports[contract.id]:''}`;
    $('side-records').append(row);
   }
  }
 }
 return {
  deck,open(){tapes();board();syncSide();},
  isActive:()=>getMission().status==='won'&&['playing','awaiting'].includes(getData().shift?.status),
  syncAudio(volume,muted,allowed){deck.volume=volume;audio.muted=muted;if(muted||!allowed)deck.pause();if(deck.gain)deck.gain.gain.setTargetAtTime(volume*.7,audio.ctx.currentTime,.03);},
  update(now,active){
   active=active&&getMission().status==='won';
   const s=getData().shift,running=getMission().status==='won'&&s&&['playing','awaiting'].includes(s.status);
   if(!running&&$('journal-drawer').hidden&&!deck.source){$('side-live').hidden=true;lastNow=now;lastActive=false;evidence=false;return;}
   const input=running?getInput():{};
   if(lastNow!==null&&lastActive){const oldStatus=s?.status,oldIndex=s?.index;advanceContract(getData(),(now-lastNow)/1000,input,active&&evidence&&lastIndex===s?.index);if(s?.status!==oldStatus||s?.index!==oldIndex){release();save(true);}}
   lastNow=now;lastActive=active;lastIndex=s?.index;evidence=active&&input.holding&&sideReception(s,input);
   if(now-lastPaint<100)return;lastPaint=now;syncSide();tapes();
   text('side-live',this.isActive()?`${CONTRACTS.find(c=>c.id===s.id).name} · ${Math.ceil(CONTRACTS.find(c=>c.id===s.id).duration-s.elapsed)}s · ${s.status==='awaiting'?'MỞ BẢN ĐỒ ĐỂ BÁO CÁO':`${Math.round(s.progress/3*100)}%`}`:'');
   $('side-live').hidden=!this.isActive();
   text('tape-play',deck.source?'TẠM DỪNG':'PHÁT BĂNG');text('tape-time',`${deck.position.toFixed(1)} / ${deck.duration.toFixed(1)} s`);
   $('tape-position').max=String(deck.duration||1);if(document.activeElement!==$('tape-position'))$('tape-position').value=String(deck.position);
   const reel=$('tape-reels');reel.classList.toggle('turning',Boolean(deck.source));reel.style.setProperty('--tape-turn',`${deck.position*90}deg`);
  }
 };
}
