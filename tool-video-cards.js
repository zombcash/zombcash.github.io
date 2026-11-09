(()=>{'use strict';
const cards=[...document.querySelectorAll('[data-video-card]')];
if(!cards.length)return;
const isFinePointer=()=>window.matchMedia('(hover:hover) and (pointer:fine)').matches;
const reduceMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function setState(card,label,error=false){const state=card.querySelector('.tool-video-state');if(state)state.textContent=label;card.classList.toggle('is-error',error);}
function ensureSource(video){
 if(!video.dataset.loaded){video.src=video.dataset.src;video.dataset.loaded='1';video.load();}
}
async function play(card,locked){
 cards.filter(other=>other!==card).forEach(other=>pause(other));
 const video=card.querySelector('video');if(!video)return;
 ensureSource(video);
 try{
  video.muted=true;video.playsInline=true;
  await video.play();
  card.classList.add('is-playing');
  card.dataset.locked=locked?'1':'0';
  const button=card.querySelector('.tool-video-trigger');
  if(button){button.setAttribute('aria-pressed','true');button.setAttribute('aria-label','Pause '+card.dataset.videoCard.replaceAll('-',' ')+' video');const label=button.querySelector('.tool-video-trigger-label');if(label)label.textContent='TAP TO PAUSE';}
  setState(card,'LIVE TRANSMISSION // MUTED');
 }catch(error){
  card.classList.remove('is-playing');
  setState(card,'VIDEO COULD NOT LOAD — RETRY',true);
 }
}
function pause(card,reset=true){
 const video=card.querySelector('video');if(!video)return;
 video.pause();if(reset&&video.readyState>0){try{video.currentTime=0;}catch(e){}}
 card.classList.remove('is-playing');card.dataset.locked='0';
 const button=card.querySelector('.tool-video-trigger');
 if(button){button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','Play '+card.dataset.videoCard.replaceAll('-',' ')+' video');const label=button.querySelector('.tool-video-trigger-label');if(label)label.textContent='HOVER OR TAP TO PLAY';}
 setState(card,'VIDEO TRANSMISSION READY');
}
cards.forEach(card=>{
 const button=card.querySelector('.tool-video-trigger');
 if(!button)return;
 button.addEventListener('click',()=>{
  if(card.classList.contains('is-playing')&&card.dataset.locked==='1'){pause(card);return;}
  play(card,true);
 });
 card.addEventListener('pointerenter',event=>{
  if(event.pointerType==='mouse'&&isFinePointer()&&!reduceMotion()&&card.dataset.locked!=='1')play(card,false);
 });
 card.addEventListener('pointerleave',event=>{
  if(event.pointerType==='mouse'&&card.dataset.locked!=='1')pause(card);
 });
 card.addEventListener('keydown',event=>{
  if((event.key==='Enter'||event.key===' ')&&event.target===card){event.preventDefault();button.click();}
 });
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)cards.forEach(card=>pause(card,false));
});
})();