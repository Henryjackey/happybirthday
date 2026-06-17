const cfg = window.BIRTHDAY_PAGE;
const pages = [...document.querySelectorAll('.page')];
const progress = document.getElementById('progress');
const player = document.getElementById('audioPlayer');
const toast = document.getElementById('toast');
const fx = document.getElementById('fx');
let pageIndex = 0;
let activeAudioKey = null;
let isSeeking = false;

function toastMsg(text){ toast.textContent = text; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),1800); }
function stopAudio(){ player.pause(); document.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing')); }
function showPage(i){ pageIndex = (i + pages.length) % pages.length; pages.forEach((p,idx)=>p.classList.toggle('active',idx===pageIndex)); progress.style.width = `${(pageIndex+1)/pages.length*100}%`; stopAudio(); }
function next(){ showPage(pageIndex+1); }
function prev(){ showPage(pageIndex-1); }

document.addEventListener('click', e => { if(e.target.closest('[data-next]')) next(); if(e.target.closest('[data-prev]')) prev(); });
let startX = 0;
let startY = 0;
document.addEventListener('touchstart', e => {
  startX = e.changedTouches[0].clientX;
  startY = e.changedTouches[0].clientY;
}, {passive:true});
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - startX;
  const dy = e.changedTouches[0].clientY - startY;
  // Only turn page on a clear horizontal swipe. Vertical scrolling should not flip pages.
  if(Math.abs(dx) > 78 && Math.abs(dx) > Math.abs(dy) * 1.35) dx < 0 ? next() : prev();
}, {passive:true});

document.querySelectorAll('[data-audio]').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.audio;
    const src = cfg.audio[key];
    if(!src) return;
    if(player.src.includes(src) && !player.paused){ stopAudio(); return; }
    stopAudio();
    activeAudioKey = key;
    player.src = src;
    player.play().then(()=>{
      btn.closest('.lux-card')?.classList.add('playing');
      btn.closest('.music-box')?.classList.add('playing');
      btn.closest('.recorder')?.classList.add('playing');
    }).catch(()=>toastMsg('音频还没放好，或者浏览器拦截了播放'));
  });
});

function fmtTime(sec){
  if(!Number.isFinite(sec)) return '--:--';
  const m = Math.floor(sec/60);
  const s = Math.floor(sec%60);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function updateSeekUI(){
  if(!activeAudioKey) return;
  const current = player.currentTime || 0;
  const duration = player.duration || 0;
  document.querySelectorAll(`[data-time-for="${activeAudioKey}"]`).forEach(el => el.textContent = fmtTime(current));
  document.querySelectorAll(`[data-duration-for="${activeAudioKey}"]`).forEach(el => el.textContent = fmtTime(duration));
  if(!isSeeking && duration){
    document.querySelectorAll(`[data-seek="${activeAudioKey}"]`).forEach(el => el.value = String(current / duration * 100));
  }
}
player.addEventListener('timeupdate', updateSeekUI);
player.addEventListener('loadedmetadata', updateSeekUI);
player.addEventListener('ended', () => {
  document.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing'));
  updateSeekUI();
});

document.querySelectorAll('[data-seek]').forEach(range => {
  range.addEventListener('pointerdown', () => isSeeking = true);
  range.addEventListener('pointerup', () => isSeeking = false);
  range.addEventListener('input', () => {
    const key = range.dataset.seek;
    const src = cfg.audio[key];
    if(!src) return;
    if(activeAudioKey !== key || !player.src.includes(src)){
      stopAudio();
      activeAudioKey = key;
      player.src = src;
    }
    const applySeek = () => {
      if(Number.isFinite(player.duration) && player.duration > 0){
        player.currentTime = Number(range.value) / 100 * player.duration;
        updateSeekUI();
      }
    };
    if(player.readyState >= 1) applySeek();
    else player.addEventListener('loadedmetadata', applySeek, {once:true});
  });
  range.addEventListener('change', () => isSeeking = false);
});

function buildWaves(){
  document.querySelectorAll('[data-wave]').forEach(w => {
    w.innerHTML='';
    for(let i=0;i<46;i++){
      const bar = document.createElement('i');
      bar.style.setProperty('--h', `${18 + Math.random()*76}px`);
      bar.style.setProperty('--d', `${i*.025}s`);
      w.appendChild(bar);
    }
  });
}
buildWaves();

const cake = document.getElementById('cake');
const wishText = document.getElementById('wishText');
cake?.addEventListener('click', () => { cake.classList.add('wished'); wishText.textContent='好，愿望已经藏起来了。'; burst('heart',24); });
document.getElementById('cutCake')?.addEventListener('click', () => { cake?.classList.add('cut'); wishText.textContent='切好啦，第一块给小寿星。'; burst('confetti',48); });
document.getElementById('confettiBtn')?.addEventListener('click', () => burst('confetti',90));
document.getElementById('fireworkBtn')?.addEventListener('click', () => burst('firework',120));


document.getElementById('potions')?.addEventListener('click', e => {
  const btn = e.target.closest('.potion'); if(!btn) return;
  const key = btn.dataset.potion;
  document.getElementById('potionText').textContent = cfg.potionText[key] || '女巫说：这瓶还没写说明书。';
  if(key === cfg.potionWin){
    stopAudio();
    burst('heart',42);
    burst('confetti',36);
    document.getElementById('dropCard')?.classList.add('show');
  }
  else {
    document.getElementById('dropCard')?.classList.remove('show');
    burst('confetti',24);
  }
});

function burst(type, count){
  const palette = ['#d85d87','#ffadc7','#f6d27a','#d9d4ff','#ff9b85'];
  for(let i=0;i<count;i++){
    const el = document.createElement('span');
    el.className = type;
    if(type === 'heart') el.textContent = ['♡','❤','✦','✧'][Math.floor(Math.random()*4)];
    const color = palette[Math.floor(Math.random()*palette.length)];
    el.style.left = `${50 + Math.random()*44 - 22}vw`;
    el.style.top = `${48 + Math.random()*30 - 15}vh`;
    el.style.color = color;
    el.style.background = type === 'confetti' ? color : type === 'firework' ? color : 'transparent';
    el.style.setProperty('--x', `${Math.random()*620-310}px`);
    el.style.setProperty('--y', `${Math.random()*560-260}px`);
    fx.appendChild(el); setTimeout(()=>el.remove(),1800);
  }
}

// soft sparkle background
const canvas = document.getElementById('sparkleCanvas');
const ctx = canvas.getContext('2d');
let stars=[];
function resize(){ canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px'; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); stars = Array.from({length: Math.min(120, Math.floor(innerWidth/9))},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.8+.4,a:Math.random(),v:Math.random()*.018+.006})); }
function draw(){ ctx.clearRect(0,0,innerWidth,innerHeight); stars.forEach(st=>{ st.a += st.v; const alpha = .18 + Math.sin(st.a)*.16; ctx.globalAlpha = Math.max(.05, alpha); ctx.fillStyle = '#d85d87'; ctx.beginPath(); ctx.arc(st.x,st.y,st.r,0,Math.PI*2); ctx.fill(); }); requestAnimationFrame(draw); }
addEventListener('resize',resize); resize(); draw();
showPage(0);
