(()=>{
  'use strict';
  const KEY='reaction-clock-view-v1',viewport=document.getElementById('app-viewport'),note=document.getElementById('view-note');
  const buttons=Array.from(document.querySelectorAll('[data-view]'));
  let mode='auto',lastWidth=0,lastHeight=0,frame=0;
  try{const saved=localStorage.getItem(KEY);if(['auto','portrait','landscape'].includes(saved))mode=saved;}catch{}
  function update(){
    frame=0;
    const width=window.innerWidth,height=window.innerHeight;
    // Mobile keyboards change height without rotating the device. Keep the
    // existing canvas while editing; a genuine rotation also changes width.
    if(document.activeElement?.matches('input,select,textarea')&&lastWidth===width&&lastHeight&&lastHeight!==height)return;
    lastWidth=width;lastHeight=height;
    const rotate=mode==='landscape'?height>width:mode==='portrait'?width>height:false;
    const viewWidth=rotate?height:width,viewHeight=rotate?width:height;
    document.body.classList.toggle('page-rotated',rotate);
    document.documentElement.style.setProperty('--view-width',viewWidth+'px');
    document.documentElement.style.setProperty('--view-height',viewHeight+'px');
    viewport.style.width=viewWidth+'px';viewport.style.height=viewHeight+'px';
    viewport.style.transform=rotate?`translateX(${width}px) rotate(90deg)`:'none';
    viewport.dataset.view=mode;viewport.dataset.rotated=String(rotate);
    viewport.dataset.compact=String(viewWidth>viewHeight&&viewHeight<=540);
    for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.view===mode));
    note.textContent=mode==='auto'?'跟随设备方向':`${mode==='landscape'?'横屏':'竖屏'}模式${rotate?(mode==='landscape'?' · 可横放设备查看':' · 可竖放设备查看'):''}`;
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  for(const button of buttons)button.addEventListener('click',()=>{
    mode=button.dataset.view;
    try{localStorage.setItem(KEY,mode);}catch{}
    update();viewport.scrollTo({top:0,left:0,behavior:'instant'});
  });
  window.addEventListener('resize',schedule);
  window.addEventListener('pageshow',schedule);
  window.visualViewport?.addEventListener('resize',schedule);
  document.addEventListener('focusout',schedule);
  update();
})();
