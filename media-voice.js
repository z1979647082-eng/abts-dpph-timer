(function(root){
  'use strict';
  class MediaVoice{
    constructor(player,sources,onStatus=()=>{}){this.player=player;this.sources=sources;this.onStatus=onStatus;this.current=null;player.preload='auto';player.muted=false;player.volume=1;player.setAttribute('playsinline','');if(sources.A)player.src=sources.A;}
    get busy(){return !!this.current;}
    play(type){
      if(this.current)return Promise.resolve(false);
      const src=this.sources[type];if(!src){this.onStatus('error','语音文件未加载，请刷新页面');return Promise.resolve(false);}
      const player=this.player;player.muted=false;player.volume=1;
      if(player.getAttribute('src')!==src)player.src=src;
      try{player.currentTime=0;}catch{}
      return new Promise(resolve=>{
        const job={type,started:false,finished:false,timer:null};this.current=job;
        const finish=(ok,message='')=>{if(job.finished)return;job.finished=true;clearTimeout(job.timer);for(const [event,handler]of listeners)player.removeEventListener(event,handler);if(this.current===job)this.current=null;if(!ok)player.pause();if(type==='unlock'&&this.sources.A)player.src=this.sources.A;this.onStatus(ok?'ready':'error',message,type);resolve(ok);};
        const started=()=>{job.started=true;this.onStatus('playing','',type);};
        const ended=()=>finish(true);
        const failed=()=>finish(false,'语音无法播放，请点试听重试或使用下方音频控件');
        const paused=()=>{if(job.started&&!player.ended)finish(false,'播放已中断，点按声音状态恢复');};
        const listeners=[['playing',started],['ended',ended],['error',failed],['pause',paused]];
        for(const [event,handler]of listeners)player.addEventListener(event,handler);
        job.cancel=()=>finish(false,'');
        job.timer=setTimeout(()=>finish(false,'播放未完成，请点试听重试并检查媒体音量'),8000);
        // Keep play() in the original click call stack: do not await loading,
        // decoding or another Promise before requesting mobile media playback.
        try{const promise=player.play();if(promise?.then)promise.then(()=>{if(!job.finished)started();},error=>finish(false,error?.name==='NotAllowedError'?'浏览器阻止了声音，点按这里重新启用':'语音播放失败，请使用下方音频控件重试'));}catch{failed();}
      });
    }
    stop(){this.current?.cancel();this.player.pause();try{this.player.currentTime=0;}catch{}}
  }
  root.MediaVoice=MediaVoice;if(typeof module!=='undefined')module.exports=MediaVoice;
})(typeof globalThis!=='undefined'?globalThis:this);
