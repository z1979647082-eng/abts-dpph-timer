const assert=require('node:assert/strict'),MediaVoice=require('../media-voice.js');
class Player{
 constructor(){this.listeners={};this.paused=true;this.ended=false;this.currentTime=0;this.calls=[];this.gesture=false;this.allowed=false;this.fail=false;}
 setAttribute(){}getAttribute(name){return this[name];}
 addEventListener(name,cb){(this.listeners[name]??=new Set()).add(cb);}removeEventListener(name,cb){this.listeners[name]?.delete(cb);}
 emit(name){for(const cb of [...this.listeners[name]||[]])cb();}
 play(){this.calls.push({src:this.src,inGesture:this.gesture});if(this.fail||(!this.allowed&&!this.gesture))return Promise.reject({name:'NotAllowedError'});this.allowed=true;this.paused=false;this.ended=false;this.emit('playing');return Promise.resolve();}
 pause(){this.paused=true;this.emit('pause');}
 end(){this.currentTime=.7;this.paused=true;this.ended=true;this.emit('ended');}
}
(async()=>{
 const player=new Player(),statuses=[],voice=new MediaVoice(player,{A:'add.wav',B:'test.wav',unlock:'silent.wav'},(...s)=>statuses.push(s));
 player.gesture=true;const unlock=voice.play('unlock');assert.equal(player.calls.length,1,'play must be called synchronously inside the gesture');assert.equal(player.calls[0].inGesture,true);player.gesture=false;player.end();assert.equal(await unlock,true);assert.equal(player.src,'add.wav','native diagnostic controls must not be left on the silent unlock clip');
 const a=voice.play('A');assert.equal(player.calls.at(-1).src,'add.wav');assert.equal(voice.busy,true);let resolved=false;a.then(()=>resolved=true);await Promise.resolve();assert.equal(resolved,false,'play promise acceptance must not mark a reminder finished');player.end();assert.equal(await a,true);
 const b=voice.play('B');assert.equal(player.calls.at(-1).src,'test.wav');player.end();assert.equal(await b,true,'reuse the unlocked media element across different prompts');
 player.fail=true;assert.equal(await voice.play('A'),false);assert.equal(voice.busy,false);assert.match(statuses.at(-1)[1],/阻止/,'expose autoplay failure instead of reporting success');
 player.fail=false;const stopped=voice.play('A');voice.stop();assert.equal(await stopped,false,'reset must cancel a playing prompt without marking it completed');assert.equal(voice.busy,false);
 console.log('PASS media playback is synchronous, completes on ended, reuses activation, reports rejection and cancels cleanly.');
})().catch(error=>{console.error(error);process.exitCode=1;});
