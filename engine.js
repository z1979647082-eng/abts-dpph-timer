(function(root){
  'use strict';
  const nameFor=t=>typeof t.name==='string'&&t.name.trim()?t.name.trim():`第 ${t.id} 管`;
  const create=(config,start)=>({version:1,config:{...config},start,pausedAt:null,tubes:Array.from({length:config.count},(_,i)=>({id:i+1,name:typeof config.names?.[i]==='string'?config.names[i].trim().slice(0,40):'',start:start+i*config.interval,test:start+i*config.interval+config.duration,started:false,due:false})),alerts:[]});
  function advance(state,now){
    const events=[];
    for(const t of state.tubes){
      if(!t.started&&state.pausedAt===null&&now>=t.start){t.started=true;events.push({key:`${t.id}-A`,id:t.id,type:'A',at:t.start,seen:now});}
      if(t.started&&!t.due&&now>=t.test){t.due=true;events.push({key:`${t.id}-B`,id:t.id,type:'B',at:t.test,seen:now});}
    }
    events.sort((a,b)=>a.at-b.at||(a.type===b.type?a.id-b.id:a.type==='B'?-1:1));
    state.alerts.push(...events);return events;
  }
  function pause(s,now){const events=advance(s,now);if(s.pausedAt===null&&s.tubes.some(t=>!t.started))s.pausedAt=now;return events;}
  function resume(s,now){if(s.pausedAt===null)return [];const delta=Math.max(0,now-s.pausedAt);for(const t of s.tubes)if(!t.started){t.start+=delta;t.test+=delta;}s.pausedAt=null;return advance(s,now);}
  function effective(t,s,now){const d=!t.started&&s.pausedAt!==null?Math.max(0,now-s.pausedAt):0;return {...t,start:t.start+d,test:t.test+d};}
  const api={create,advance,pause,resume,effective,nameFor};root.TimerCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
