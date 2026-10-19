(()=>{
  'use strict';
  const $=id=>document.getElementById(id),Core=TimerCore,KEY='reaction-clock-v1';
  let method='DPPH',state=null,preview=null,lastTable='',lastAlert='',storageOK=true,audio=null,wake=null,wakeBusy=false,draining=false,generation=0;
  const soundQueue=[],nodes=new Set(),methodValues={DPPH:{value:'30',unit:'60000'},ABTS:{value:'',unit:'60000'}};
  const pad=n=>String(n).padStart(2,'0');
  const time=ms=>{const d=new Date(ms);return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;};
  const date=ms=>{const d=new Date(ms);return `${d.getMonth()+1}月${d.getDate()}日`;};
  const sameDay=(a,b)=>new Date(a).toDateString()===new Date(b).toDateString();
  const countdown=ms=>{let s=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(s/3600);return h?`${pad(h)}:${pad(Math.floor(s/60)%60)}:${pad(s%60)}`:`${pad(Math.floor(s/60))}:${pad(s%60)}`;};
  function save(){try{if(state)localStorage.setItem(KEY,JSON.stringify(state));else localStorage.removeItem(KEY);}catch{storageOK=false;$('session-note').hidden=false;$('session-note').textContent='此浏览器无法保存进度，请勿刷新或关闭页面。';}}
  function config(){return {method,duration:Number($('duration').value)*Number($('duration-unit').value),count:Number($('count').value),interval:Number($('interval').value)*Number($('interval-unit').value)};}
  function valid(c){return Number.isFinite(c.duration)&&c.duration>=10&&c.duration<=1e10&&Number.isInteger(c.count)&&c.count>=1&&c.count<=500&&Number.isFinite(c.interval)&&c.interval>=0&&c.interval<=1e10;}
  function startTime(now){if(document.querySelector('[name="start-mode"]:checked').value==='now')return now;const v=$('start-time').value;if(!v)return NaN;const [h,m,s=0]=v.split(':').map(Number),d=new Date(now);d.setHours(h,m,s,0);if(d.getTime()<now)d.setDate(d.getDate()+1);return d.getTime();}
  function buildPreview(){if(state)return;const c=config(),now=Date.now(),start=startTime(now);preview=valid(c)&&Number.isFinite(start)?Core.create(c,start):null;lastTable='';render(now);}
  function setMethod(next){methodValues[method]={value:$('duration').value,unit:$('duration-unit').value};method=next;$('duration').value=methodValues[next].value;$('duration-unit').value=methodValues[next].unit;document.querySelectorAll('[data-method]').forEach(b=>{b.classList.toggle('selected',b.dataset.method===next);b.setAttribute('aria-pressed',String(b.dataset.method===next));});$('duration-help').textContent=next==='ABTS'?'请按你的 ABTS 实验方案填写反应时长。':'DPPH 默认 30 分钟，可按实验方案修改。';buildPreview();}
  function soundStatus(){const on=audio&&audio.state==='running';$('sound-status').innerHTML=`<i class="dot ${on?'green':'amber'}"></i><span>${on?'声音已启用 · 可试听':audio?'声音中断 · 点按恢复':'声音待启用 · 点按开启'}</span>`;}
  async function enableAudio(){
    try{if(!audio){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('unsupported');audio=new AC();audio.onstatechange=()=>{soundStatus();if(audio.state==='running')drain();};}
      await audio.resume();soundStatus();if(audio.state==='running'){drain();return true;}return false;
    }catch{$('sound-status').innerHTML='<i class="dot amber"></i><span>声音不可用 · 请检查浏览器</span>';return false;}
  }
  // Two low chimes for addition; three higher alternating pulses for testing.
  function play(type){return new Promise(resolve=>{
    if(!audio||audio.state!=='running'){resolve(false);return;}
    const pattern=type==='A'?[[0,523,.17],[.24,659,.23]]:[[0,880,.2],[.27,1175,.2],[.54,880,.30]];
    const base=audio.currentTime+.02;
    pattern.forEach(([offset,freq,duration])=>{const osc=audio.createOscillator(),gain=audio.createGain();osc.type=type==='A'?'sine':'triangle';osc.frequency.value=freq;gain.gain.setValueAtTime(0,base+offset);gain.gain.linearRampToValueAtTime(.3,base+offset+.015);gain.gain.exponentialRampToValueAtTime(.001,base+offset+duration);osc.connect(gain);gain.connect(audio.destination);nodes.add(osc);osc.onended=()=>{nodes.delete(osc);osc.disconnect();gain.disconnect();};osc.start(base+offset);osc.stop(base+offset+duration+.02);});
    setTimeout(()=>resolve(audio.state==='running'),type==='A'?680:1080);
  });}
  async function drain(){if(draining||!audio||audio.state!=='running'||document.hidden)return;draining=true;const token=generation;
    try{while(soundQueue.length&&token===generation&&audio.state==='running'&&!document.hidden){const job=soundQueue[0],ok=await play(job.type);if(token!==generation)break;if(!ok)break;soundQueue.shift();if(job.event){job.event.played=true;save();}}}finally{draining=false;if(soundQueue.length&&token!==generation)drain();}
  }
  function receive(events){if(!events.length)return;for(const e of events)soundQueue.push({type:e.type,event:e});save();drain();}
  function active(){return state&&state.tubes.some(t=>!t.due);}
  async function requestWake(){if(!active()||document.hidden||wake||wakeBusy)return;if(!('wakeLock' in navigator)){$('wake-status').innerHTML='<i class="dot amber"></i>请手动设置屏幕常亮';return;}wakeBusy=true;try{wake=await navigator.wakeLock.request('screen');$('wake-status').innerHTML='<i class="dot green"></i>屏幕常亮已申请';wake.addEventListener('release',()=>{wake=null;$('wake-status').innerHTML='<i class="dot amber"></i>常亮已释放 · 请保持亮屏';});}catch{$('wake-status').innerHTML='<i class="dot amber"></i>常亮未启用 · 请手动保持亮屏';}finally{wakeBusy=false;}}
  function releaseWake(){if(wake)wake.release().catch(()=>{});}
  function clock(now){const t=time(now);$('clock').innerHTML=`${t.slice(0,5)}<span>${t.slice(5)}</span>`;$('today').textContent=`${new Date(now).getFullYear()}年${date(now)}  ${['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][new Date(now).getDay()]}`;}
  function timedLabel(ms,now){return time(ms)+(sameDay(ms,now)?'':` · ${date(ms)}`);}
  function card(type,now){const s=state||preview,p=type==='a'?'A':'B',t=s?.tubes.find(t=>p==='A'?!t.started:!t.due);if(!t){$('next-'+type+'-tube').textContent=state?'全部已到时':preview?'—':'请先完成设置';$('next-'+type+'-time').textContent='--:--:--';$('next-'+type+'-count').textContent='--:--';$('next-'+type+'-caption').textContent=state?(p==='A'?'所有反应管已开始反应':'所有测试提醒已发出，未记录测试完成'):'根据设置自动生成时间表';return;}
    const et=Core.effective(t,s,now),at=p==='A'?et.start:et.test,paused=state&&state.pausedAt!==null&&!t.started;
    $('next-'+type+'-tube').textContent=`第 ${t.id} 管`;$('next-'+type+'-time').textContent=timedLabel(at,now);
    $('next-'+type+'-count').textContent=!state?'待开始':paused?'已暂停':countdown(at-now);
    $('next-'+type+'-caption').textContent=!state?'计划时间 · 开始后锁定':paused?'此管尚未加液，时间随暂停顺延':`距${p==='A'?'加液':'测试'}还有${at-now>=3600000?'（时:分:秒）':'（分:秒）'}`;
  }
  function renderTable(s,now,hot){if(!s){$('schedule-body').innerHTML='<tr><td colspan="4">填写有效参数后，这里将自动生成时间表。</td></tr>';return;}const base=new Date(s.start).toDateString();
    const html=s.tubes.map(t=>{const e=Core.effective(t,s,now),status=!state?'尚未开始':t.due?'已到测试时间':t.started?'反应中':s.pausedAt!==null?'尚未开始 · 暂停':'尚未开始',cl=hot.has(`${t.id}-B`)?'hot-b':hot.has(`${t.id}-A`)?'hot-a':t.due?'due':t.started?'reacting':'';const stamp=x=>`${time(x)}${new Date(x).toDateString()!==base?`<small>${date(x)}</small>`:''}`;return `<tr class="${cl}"><td>${pad(t.id)}</td><td>${stamp(e.start)}</td><td>${stamp(e.test)}</td><td><span class="row-status"><i></i>${status}</span></td></tr>`;}).join('');if(html!==lastTable){$('schedule-body').innerHTML=html;lastTable=html;}}
  function render(now){clock(now);document.body.classList.toggle('running',!!state);const s=state||preview,paused=state&&state.pausedAt!==null,done=state&&state.tubes.every(t=>t.due);
    $('run-state').textContent=!state?'等待开始':done?'所有提醒已发出':paused?'后续加液已暂停':state.tubes.some(t=>t.started)?'实验进行中':'等待定时开始';
    $('fields').disabled=!!state;$('start').disabled=!!state;const buttonMode=state?'running':'ready';if($('start').dataset.mode!==buttonMode){$('start').dataset.mode=buttonMode;$('start').innerHTML=state?'<span class="button-text">实验已开始</span><span class="icon" aria-hidden="true">✓</span>':'<span class="button-text">开始实验</span><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span>';}$('setup-note').textContent=state?`${state.config.method} · ${state.config.count} 管 · 设置已锁定`:'开始后，所有加液与测试提醒自动进行。';$('pause').hidden=!!paused;$('resume').hidden=!paused;$('pause').disabled=!state||!state.tubes.some(t=>!t.started);$('reset').disabled=!state;
    $('table-tag').textContent=!state?'预览':paused?'顺延中':'自动计时';$('progress').textContent=state?`${state.tubes.filter(t=>t.due).length} / ${state.config.count} 管已到测试时间`:`共 ${s?.config.count||0} 管`;
    $('schedule-info').textContent=s?`${s.config.method} · ${date(s.start)} ${time(s.start)} ${state?'开始':'预计开始'}${paused?' · 尚未开始的管按暂停时长顺延':!state?' · 实际时间以点击开始为准':''}`:'请填写反应时长与管数。';
    const alerts=state?state.alerts.filter(e=>now-e.seen<30000||!e.played):[],hot=new Set(alerts.map(e=>e.key));
    const html=alerts.map(e=>`<div class="alert ${e.type==='B'?'alert-b':''}">第 ${e.id} 管：${e.type==='A'?'请加液，开始反应':'反应时间到，请测试'}<small>${timedLabel(e.at,now)}${e.seen-e.at>2000?' · 返回页面后补发':''}${!e.played?' · 等待声音播放':''}</small></div>`).join('');
    $('alerts').hidden=!alerts.length;if(html!==lastAlert){$('alerts').innerHTML=html;lastAlert=html;}
    card('a',now);card('b',now);renderTable(s,now,hot);if(done)releaseWake();
  }
  function tick(){const now=Date.now();if(state)receive(Core.advance(state,now));render(now);}
  function setError(msg){$('error').hidden=!msg;$('error').textContent=msg;}
  document.querySelectorAll('[data-method]').forEach(b=>b.addEventListener('click',()=>setMethod(b.dataset.method)));
  $('fields').addEventListener('input',()=>{setError('');buildPreview();});$('fields').addEventListener('change',()=>{$('scheduled-fields').hidden=document.querySelector('[name="start-mode"]:checked').value!=='scheduled';$('start-time').required=!$('scheduled-fields').hidden;buildPreview();});
  $('setup').addEventListener('submit',event=>{event.preventDefault();if(state)return;const c=config(),now=Date.now(),start=startTime(now);if(!valid(c)||!Number.isFinite(start)){setError('请填写有效反应时长、管数（1–500）和开始时间。');return;}setError('');enableAudio();state=Core.create(c,start);save();requestWake();tick();document.querySelector('.monitor').scrollIntoView({block:'start'});});
  for(const type of ['A','B'])$('test-'+type.toLowerCase()).addEventListener('click',()=>{soundQueue.push({type});enableAudio();});
  $('sound-status').addEventListener('click',()=>{enableAudio();requestWake();});
  $('pause').addEventListener('click',()=>{if(!state)return;enableAudio();receive(Core.pause(state,Date.now()));save();tick();});
  $('resume').addEventListener('click',()=>{if(!state)return;enableAudio();receive(Core.resume(state,Date.now()));save();requestWake();tick();});
  $('reset').addEventListener('click',()=>{if(state)$('reset-dialog').showModal();});
  $('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());
  $('confirm-reset').addEventListener('click',()=>{$('reset-dialog').close();generation++;soundQueue.length=0;for(const osc of nodes){try{osc.stop();}catch{}}state=null;save();releaseWake();$('session-note').hidden=true;$('wake-status').innerHTML='<i class="dot"></i>开始后申请常亮';lastTable='';lastAlert='';buildPreview();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(state){const now=Date.now();for(const e of state.alerts)if(!e.played)e.seen=now;tick();requestWake();}if(audio){audio.resume().then(drain).catch(()=>{});}soundStatus();}});
  window.addEventListener('pageshow',()=>{tick();requestWake();});
  const now=new Date();now.setMinutes(now.getMinutes()+5);$('start-time').value=`${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
  try{const raw=JSON.parse(localStorage.getItem(KEY));if(raw&&raw.version===1&&valid(raw.config)&&Number.isFinite(raw.start)&&Array.isArray(raw.tubes)&&raw.tubes.length===raw.config.count&&raw.tubes.every(t=>Number.isFinite(t.start)&&Number.isFinite(t.test)&&typeof t.started==='boolean'&&typeof t.due==='boolean')&&Array.isArray(raw.alerts)&&(raw.pausedAt===null||Number.isFinite(raw.pausedAt))){state=raw;method=raw.config.method;$('duration').value=raw.config.duration/60000;$('count').value=raw.config.count;$('interval').value=raw.config.interval/60000;document.querySelectorAll('[data-method]').forEach(b=>{b.classList.toggle('selected',b.dataset.method===method);b.setAttribute('aria-pressed',String(b.dataset.method===method));});for(const e of state.alerts)if(!e.played){e.seen=Date.now();soundQueue.push({type:e.type,event:e});}$('session-note').hidden=false;$('session-note').textContent='已恢复本机实验。请点按上方声音状态启用声音；离开页面期间的提醒将补发。';}}catch{storageOK=false;}
  if(!state)buildPreview();tick();setInterval(tick,250);soundStatus();
})();
