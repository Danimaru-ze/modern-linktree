// ---- Globals ----
let userData = null;
let currentLyricIndex = -1;
songDuration = 0;
let isPlaying = false;          // keadaan nyata <audio>
let shouldBePlaying = false;    // state target yang kita inginkan
let resumeOnGestureBound = false;

// === CONFIG: Opsi Global ===
const MUSIC_AUTOPLAY_ON_LOAD = true; // true = musik otomatis menyala, false = tidak
const AI_AUTO_WELCOME = false;
const AI_AUTO_SUGGESTIONS = false;

// ---- DOM ----
const qs = (s)=>document.querySelector(s);
const welcomePanel = qs('#welcomePanel');
const welcomeCloseBtn = qs('#welcomeCloseBtn');
const mainContainer = qs('#mainContainer');

const profilePic = qs('#profilePic');
const profileName = qs('#profileName');
const profileBio = qs('#profileBio');
const linksContainer = qs('#linksContainer');

const albumArt = qs('#albumArt');
const songTitle = qs('#songTitle');
const artist = qs('#artist');
const lyrics = qs('#lyrics');

const playPauseBtn = qs('#playPauseBtn');
const playPauseIcon = qs('#playPauseIcon');
const musicPlayer = qs('#musicPlayer');
const musicToggle = qs('#musicToggle');
const progressBar = qs('#progressBar');
const currentTimeDisplay = qs('#currentTime');
const totalTimeDisplay = qs('#totalTime');
const audioPlayer = qs('#audioPlayer');

const themeToggle = qs('#theme-toggle');
const themeIcon = qs('#theme-icon');
const metaTheme = qs('#meta-theme-color');

// ---- Helpers ----
const clamp = (v,min,max)=>Math.min(Math.max(v,min),max);

function applyTheme(theme){
  const isDark = theme === 'dark';
  document.body.classList.toggle('light', !isDark);
  document.body.classList.toggle('dark-mode', isDark);
  if (themeIcon) themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  if (metaTheme) metaTheme.setAttribute('content', isDark ? '#0A84FF' : '#007AFF');
  try{ localStorage.setItem('theme', isDark ? 'dark' : 'light'); }catch{}
}

function ripple(e){
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--x', `${e.clientX - r.left}px`);
  el.style.setProperty('--y', `${e.clientY - r.top}px`);
}

function formatTime(seconds){
  const s = Math.floor(seconds || 0);
  const m = Math.floor(s/60);
  const r = s%60;
  return `${m}:${r.toString().padStart(2,'0')}`;
}

function remember(key, value){ try{ localStorage.setItem(key, JSON.stringify(value)); }catch{} }
function recall(key, fallback=null){
  try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch{ return fallback; }
}

function imageFallback(imgEl, placeholder='https://avatars.githubusercontent.com/u/9919?s=200&v=4'){
  imgEl.addEventListener('error', ()=>{ imgEl.src = placeholder; });
}

// ---- Links ----
function buildLink(link, index){
  const a = document.createElement('a');
  a.href = link.url;
  a.className = 'link-item animate__animated animate__fadeInUp';
  a.style.animationDelay = `${0.06*index}s`;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.addEventListener('pointerdown', ripple);

  const icon = document.createElement('i');
  icon.className = link.icon;

  const title = document.createElement('span');
  title.textContent = link.title;

  const arrow = document.createElement('i');
  arrow.className = 'fa-solid fa-chevron-right arrow';

  a.append(icon, title, arrow);
  return a;
}

// ---- Lyrics ----
function updateLyricsDisplay(time){
  if (!userData?.music?.timeSync) return;
  const arr = userData.music.timeSync;
  let idx = -1;
  for (let i=0;i<arr.length;i++){
    if (arr[i].time <= time) idx = i; else break;
  }
  if (idx !== -1 && idx !== currentLyricIndex){
    currentLyricIndex = idx;
    lyrics.innerHTML = '';
    const line = document.createElement('div');
    line.className = 'lyrics-line active';
    line.textContent = arr[idx].text;
    lyrics.appendChild(line);
  }
}

// ---- Playback control ----
function setPlaying(wantPlay){
  shouldBePlaying = wantPlay;
  if (!audioPlayer?.src) return;
  if (wantPlay){
    audioPlayer.play().catch(bindResumeOnGesture);
  } else {
    audioPlayer.pause();
  }
}
function togglePlayPause(){ setPlaying(!isPlaying); }

// ---- Autoplay on load ----
async function tryAutoPlay(){
  if (!audioPlayer?.src) return;
  try{
    await audioPlayer.play();
    shouldBePlaying = true;
  }catch(err){
    shouldBePlaying = true;
    bindResumeOnGesture();
    console.log("Autoplay was blocked. Music will start after first user interaction.");
  }
}
function bindResumeOnGesture(){
  if (resumeOnGestureBound) return;
  resumeOnGestureBound = true;
  const resume = async ()=>{
    try{ await audioPlayer.play(); }catch{}
    unbind();
  };
  const unbind = ()=>{
    ['pointerdown','touchend','keydown','scroll'].forEach(ev=>document.removeEventListener(ev, resume, true));
    document.removeEventListener('visibilitychange', resume, true);
  };
  ['pointerdown','touchend','keydown','scroll'].forEach(ev=>document.addEventListener(ev, resume, true));
  document.addEventListener('visibilitychange', resume, true);
}

// ---- Initialize from JSON ----
function initializeFromJSON(data){
  userData = data;

  profileName.textContent = data.profile.name;
  profileBio.textContent = data.profile.bio;
  profilePic.src = data.profile.image;
  imageFallback(profilePic);

  linksContainer.innerHTML = '';
  data.links.forEach((item, i)=> linksContainer.appendChild(buildLink(item, i)));

  songTitle.textContent = data.music.title;
  artist.textContent = data.music.artist;
  albumArt.src = data.music.albumArt;
  imageFallback(albumArt);

  if (data.music.audioFile){
    audioPlayer.src = data.music.audioFile;
  }

  if (Array.isArray(data.music.timeSync)) updateLyricsDisplay(0);
  else lyrics.textContent = data.music.lyrics || 'Lyrics not available.';

  document.querySelector('.profile-pic-container')?.classList.remove('skeleton');
  profileName.classList.remove('skeleton-text');
  profileBio.classList.remove('skeleton-text');

  if ('mediaSession' in navigator){
    navigator.mediaSession.metadata = new MediaMetadata({
      title: data.music.title,
      artist: data.music.artist,
      artwork: [{src: data.music.albumArt, sizes:'512x512', type:'image/jpeg'}]
    });
    navigator.mediaSession.setActionHandler('play', ()=>{ setPlaying(true); });
    navigator.mediaSession.setActionHandler('pause', ()=>{ setPlaying(false); });
    navigator.mediaSession.setActionHandler('seekto', details=>{
      if (audioPlayer.duration && typeof details.seekTime === 'number'){
        audioPlayer.currentTime = clamp(details.seekTime, 0, audioPlayer.duration);
      }
    });
  }
}

// ---- Music UI helpers (mutual minimize with chat) ----
function isMusicCompact(){ return musicPlayer.classList.contains('compact'); }

function setMusicCompact(val) {
  musicPlayer.classList.toggle('compact', val);
  remember('playerCompact', val);

  const isMobile = window.innerWidth <= 480 || /Android|iPhone/i.test(navigator.userAgent);
  if (isMobile) {
    const chatWidget = document.querySelector('#ai-chat');

    if (musicToggle) {
        musicToggle.style.pointerEvents = 'auto';
        musicToggle.style.cursor = 'pointer';
        musicToggle.style.zIndex = '1001';
    }
    
    if (chatWidget) {
        chatWidget.style.transition = 'bottom 0.25s ease-out';
        if (val) {
            chatWidget.style.bottom = '20px';
        } else {
            chatWidget.style.bottom = '165px';
        }
    }
  }
}

// ---- Events ----
themeToggle?.addEventListener('click', ()=>{
  const dark = document.body.classList.contains('light');
  applyTheme(dark ? 'dark' : 'light');
});

musicToggle?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  const newCompact = !isMusicCompact();
  if (!newCompact && window.setChatOpen) window.setChatOpen(false);
  setMusicCompact(newCompact);
});

playPauseBtn?.addEventListener('click', (e)=>{ e.stopPropagation(); togglePlayPause(); });

document.querySelector('.progress-container')?.addEventListener('click', function(e){
  if (!audioPlayer.duration) return;
  const rect = this.getBoundingClientRect();
  const pct = clamp((e.clientX - rect.left)/rect.width, 0, 1);
  audioPlayer.currentTime = pct * audioPlayer.duration;
  if (shouldBePlaying && !isPlaying) audioPlayer.play().catch(()=>{});
});

audioPlayer.addEventListener('play', ()=>{ isPlaying = true;  playPauseIcon && (playPauseIcon.className = 'fas fa-pause'); });
audioPlayer.addEventListener('pause', ()=>{
  isPlaying = false;
  if (shouldBePlaying && !audioPlayer.ended){ audioPlayer.play().catch(()=>{}); }
  else { playPauseIcon && (playPauseIcon.className = 'fas fa-play'); }
});
audioPlayer.addEventListener('loadedmetadata', ()=>{
  songDuration = audioPlayer.duration || 0;
  totalTimeDisplay.textContent = formatTime(songDuration);
});
audioPlayer.addEventListener('timeupdate', ()=>{
  currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
  const pct = songDuration>0 ? (audioPlayer.currentTime / songDuration) * 100 : 0;
  progressBar.style.width = `${pct}%`;
  updateLyricsDisplay(audioPlayer.currentTime);
  document.querySelector('.progress-container')?.setAttribute('aria-valuenow', Math.round(pct));
});
audioPlayer.addEventListener('ended', ()=>{ audioPlayer.currentTime = 0; playPauseIcon && (playPauseIcon.className = 'fas fa-play'); isPlaying = false; shouldBePlaying = false; });
audioPlayer.addEventListener('error', ()=>{ const m={1:'ABORTED',2:'NETWORK',3:'DECODE',4:'SRC_NOT_SUPPORTED'}; console.warn('Audio error:', m[audioPlayer.error?.code], audioPlayer.error); });

// ---- Welcome popup ----
function handleWelcomePopup(){
  const chatRoot = document.getElementById('ai-chat');
  if (sessionStorage.getItem('welcomeShown')){
    mainContainer.classList.remove('initially-hidden');
    mainContainer.classList.add('animate__animated','animate__fadeInUp');
    if (chatRoot){ chatRoot.style.opacity = '1'; chatRoot.style.pointerEvents = 'auto'; }
  } else {
    welcomePanel.classList.add('visible');
    if (chatRoot){ chatRoot.style.opacity = '0'; chatRoot.style.pointerEvents = 'none'; }
  }
  welcomeCloseBtn?.addEventListener('click', ()=>{
    sessionStorage.setItem('welcomeShown','true');
    welcomePanel.classList.remove('visible');
    mainContainer.classList.remove('initially-hidden');
    mainContainer.classList.add('animate__animated','animate__fadeInUp');
    if (chatRoot){ chatRoot.style.opacity = '1'; chatRoot.style.pointerEvents = 'auto'; }
  });
}

// Swipe-down minimize
let startY=null;
musicPlayer.addEventListener('touchstart', (e)=>{ 
  if (e.target === musicToggle || e.target.closest('#musicToggle')) return;
  startY = e.touches[0].clientY; 
}, {passive:true});
musicPlayer.addEventListener('touchmove', (e)=>{
  if (startY==null || e.target === musicToggle || e.target.closest('#musicToggle')) return;
  const dy = e.touches[0].clientY - startY;
  if (dy>22 && !isMusicCompact()){
    setMusicCompact(true); startY=null;
  }
}, {passive:true});

// ---- Boot ----
document.addEventListener('DOMContentLoaded', ()=>{
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

  const year = new Date().getFullYear();
  const footer = qs('#footer-content');
  if (footer) footer.innerHTML = `&copy; ${year} Personal Bio. Built with ❤️ by Danimaru.`;

  setMusicCompact(true);

  fetch('data.json', {cache:'no-cache'})
    .then(r=>{ if(!r.ok) throw new Error('Failed to load data.json'); return r.json(); })
    .then(data=>{ 
      initializeFromJSON(data); 
      handleWelcomePopup(); 
      
      if (MUSIC_AUTOPLAY_ON_LOAD) {
        setTimeout(tryAutoPlay, 200);
      }
    })
    .catch(err=>{
      console.error(err);
      profileBio.textContent = "Failed to load profile data. Please check data.json file.";
      document.querySelector('.profile-pic-container')?.classList.remove('skeleton');
      profileName.classList.remove('skeleton-text');
      profileBio.classList.remove('skeleton-text');
      handleWelcomePopup();
    });
});


/* =========================================================
   ====== Simplified Danimaru AI Chat Widget ======
   ========================================================= */

(function initSimplifiedAIChat(){
  const styles = getComputedStyle(document.body);
  const ACCENT = styles.getPropertyValue('--accent')?.trim() || '#0A84FF';
  const ACCENT2 = styles.getPropertyValue('--accent-2')?.trim() || '#7c4dff';
  const CARD = styles.getPropertyValue('--card')?.trim() || 'rgba(255,255,255,.08)';
  const BORDER = styles.getPropertyValue('--card-border')?.trim() || 'rgba(255,255,255,.12)';
  const TEXT = styles.getPropertyValue('--text')?.trim() || '#e7e9ee';
  const BG2 = styles.getPropertyValue('--bg-2')?.trim() || '#0f1116';
  const isMobile = window.innerWidth <= 480 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const root = document.createElement('div');
  root.id = 'ai-chat';
  Object.assign(root.style, {
    position: 'fixed', left: isMobile ? '20px' : '16px', bottom: isMobile ? '20px' : '16px',
    zIndex: '14000', display: 'grid', gap: '10px',
  });
  document.body.appendChild(root);

  const fab = document.createElement('button');
  fab.id = 'ai-fab';
  fab.setAttribute('aria-label','Open Danimaru AI');
  fab.innerHTML = '<i class="fas fa-robot"></i>';
  const fabSize = isMobile ? '52px' : '56px';
  const fabFontSize = isMobile ? '22px' : '24px';
  Object.assign(fab.style, {
    width: fabSize, height: fabSize, borderRadius: '50%', border: '0', cursor: 'pointer',
    color: '#fff', background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
    boxShadow: '0 12px 24px rgba(0,0,0,.32), 0 0 0 0 rgba(10, 132, 255, 0.7)', 
    display: 'grid', placeItems: 'center', touchAction: 'manipulation',
    fontSize: fabFontSize, transition: 'transform .15s ease, filter .2s ease',
    animation: 'pulse-ring 2s infinite'
  });
  
  const pulseStyle = document.createElement('style');
  pulseStyle.textContent = `@keyframes pulse-ring { 0% { box-shadow: 0 12px 24px rgba(0,0,0,.32), 0 0 0 0 rgba(10, 132, 255, 0.7); } 70% { box-shadow: 0 12px 24px rgba(0,0,0,.32), 0 0 0 10px rgba(10, 132, 255, 0); } 100% { box-shadow: 0 12px 24px rgba(0,0,0,.32), 0 0 0 0 rgba(10, 132, 255, 0); } }`;
  document.head.appendChild(pulseStyle);
  root.appendChild(fab);

  const panel = document.createElement('div');
  panel.id = 'ai-panel';
  const panelBottom = isMobile ? '84px' : '76px';
  Object.assign(panel.style, {
    position: 'absolute', bottom: panelBottom, left: '0',
    width: isMobile ? 'min(340px, 95vw)' : 'min(380px, 95vw)', 
    maxHeight: isMobile ? '65vh' : '70vh', display: 'grid', gridTemplateRows: 'auto 1fr auto',
    borderRadius: '18px', background: CARD, border: `1px solid ${BORDER}`,
    boxShadow: '0 20px 45px rgba(0,0,0,.4)', backdropFilter: 'saturate(1.3) blur(16px)',
    overflow: 'hidden', transformOrigin: 'bottom left', transform: 'scale(.95)',
    opacity: '0', pointerEvents: 'none', transition: 'transform .2s ease, opacity .2s ease'
  });
  root.appendChild(panel);

  const header = document.createElement('div');
  header.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:12px 15px;background:linear-gradient(135deg, ${ACCENT}, ${ACCENT2});color:#fff;font-weight:800;`;
  header.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;font-size:15px">
      <i class="fas fa-robot"></i> 
      <div>
        <div style="font-size:15px;margin-bottom:2px">Danimaru AI</div>
        <div id="ai-status" style="display:flex;align-items:center;gap:6px;font-size:11px;opacity:0.85;font-weight:400">
          <span class="status-dot"></span>Online
        </div>
      </div>
    </div>
    <button id="ai-close" style="width:32px;height:32px;border-radius:10px;border:0;cursor:pointer;color:#fff;background:rgba(255,255,255,.15);font-size:18px;font-weight:bold;transition:background .2s ease;">&times;</button>
  `;
  panel.appendChild(header);

  const msgs = document.createElement('div');
  msgs.id = 'ai-messages';
  Object.assign(msgs.style, { 
    padding:'15px', overflowY:'auto', color: TEXT, background:'transparent',
    scrollbarWidth: 'thin', scrollBehavior: 'smooth'
  });
  
  const scrollbarStyle = document.createElement('style');
  scrollbarStyle.textContent = `#ai-messages::-webkit-scrollbar{width:8px;}#ai-messages::-webkit-scrollbar-track{background:rgba(255,255,255,.05);border-radius:10px;}#ai-messages::-webkit-scrollbar-thumb{background:linear-gradient(135deg, ${ACCENT}, ${ACCENT2});border-radius:10px;transition:background .2s ease;}#ai-messages::-webkit-scrollbar-thumb:hover{background:${ACCENT};}`;
  document.head.appendChild(scrollbarStyle);
  panel.appendChild(msgs);

  const inputWrap = document.createElement('div');
  inputWrap.style.cssText = `display:grid;grid-template-columns:1fr auto;gap:10px;padding:12px;background:rgba(0,0,0,.08);border-top:1px solid ${BORDER}`;
  
  const input = document.createElement('input');
  input.id='ai-input';
  input.placeholder='Tanya apapun tentang Dany...';
  input.autocomplete='off';
  input.maxLength = 500;
  Object.assign(input.style, {
    width:'100%', padding:'12px 15px', borderRadius:'15px', border:`1px solid ${BORDER}`, 
    background: BG2, color: TEXT, outline:'none', fontSize:'14px',
    transition: 'border-color .2s ease, box-shadow .2s ease'
  });

  const send = document.createElement('button');
  send.id='ai-send';
  send.innerHTML = '<i class="fas fa-paper-plane"></i>';
  Object.assign(send.style, {
    minWidth:'48px', height:'48px', border:'0', borderRadius:'15px', cursor:'pointer',
    background:`linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, color:'#fff', 
    display:'grid', placeItems:'center', padding:'0',
    transition: 'transform .15s ease, filter .2s ease, box-shadow .2s ease',
    boxShadow: '0 4px 12px rgba(10, 132, 255, 0.3)'
  });
  
  inputWrap.append(input, send);
  panel.appendChild(inputWrap);

  const statusStyle = document.createElement('style');
  statusStyle.textContent = `#ai-status .status-dot{width:8px;height:8px;border-radius:50%;background:#28d27d;animation:status-blink 1.2s ease-in-out infinite}@keyframes status-blink{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.15)}}`;
  document.head.appendChild(statusStyle);

  function setStatus(text, isTyping=false){
    const el = document.getElementById('ai-status');
    if(el) el.innerHTML = `<span class="status-dot" ${isTyping ? 'style="background:#ffc107;"':''}></span>${text}`;
  }
  
  input.addEventListener('focus', () => { input.style.borderColor = ACCENT; input.style.boxShadow = `0 0 0 3px rgba(10, 132, 255, 0.1)`; });
  input.addEventListener('blur', () => { input.style.borderColor = BORDER; input.style.boxShadow = 'none'; });

  let isOpen = false;
  function setOpen(open){
    isOpen = open;
    panel.style.transform = open ? 'scale(1)' : 'scale(.95)';
    panel.style.opacity = open ? '1' : '0';
    panel.style.pointerEvents = open ? 'auto' : 'none';
    if(open && window.isMusicCompact && !window.isMusicCompact()) {
      window.setMusicCompact(true);
    }
  }

  fab.addEventListener('click', () => setOpen(!isOpen));
  panel.querySelector('#ai-close').addEventListener('click', () => setOpen(false));
  
  const messageAnimStyle = document.createElement('style');
  messageAnimStyle.textContent = `@keyframes messageSlideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`;
  document.head.appendChild(messageAnimStyle);

  function formatMessage(text) {
    return text
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:#58a6ff;text-decoration:underline;">$1</a>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  function appendMsg(text, who='ai', options = {}){
    const div = document.createElement('div');
    div.innerHTML = formatMessage(text);
    Object.assign(div.style, {
      maxWidth:'88%', padding:'12px 15px', borderRadius:'16px',
      fontSize:'14px', lineHeight:'1.5', margin:'8px 0', 
      whiteSpace:'pre-wrap', wordBreak:'break-word',
      boxShadow: '0 4px 12px rgba(0,0,0,.15)', animation: 'messageSlideIn 0.3s ease-out'
    });
    
    if (who==='user'){
      div.style.background = `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`;
      div.style.color = '#fff';
      div.style.marginLeft = 'auto';
      div.style.borderBottomRightRadius = '6px';
    } else {
      div.style.background = 'rgba(255,255,255,.1)';
      div.style.border = `1px solid ${BORDER}`;
      div.style.color = TEXT;
      div.style.borderBottomLeftRadius = '6px';
      if (options.isError) {
        div.style.background = 'rgba(255, 107, 107, 0.1)';
        div.style.borderColor = 'rgba(255, 107, 107, 0.3)';
        div.style.color = '#ff6b6b';
      }
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }
  
  const typingKeyframes = document.createElement('style');
  typingKeyframes.id = 'typing-keyframes';
  typingKeyframes.textContent = `@keyframes typingDot{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-4px)}}`;
  document.head.appendChild(typingKeyframes);

  function appendTyping(){
    const holder = appendMsg('', 'ai');
    holder.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><span style="opacity:0.8;">Danimaru sedang mengetik</span><div style="display:flex;gap:4px;">${[0,1,2].map(i=>`<div style="width:6px;height:6px;border-radius:50%;background:${TEXT};opacity:0.6;animation:typingDot 1.4s infinite ease-in-out ${i*0.2}s"></div>`).join('')}</div></div>`;
    return holder;
  }
  
  function setSending(disabled){
    send.disabled = disabled;
    input.disabled = disabled;
    setStatus(disabled ? 'Mengetik...' : 'Online', disabled);
    send.style.opacity = disabled ? '0.6' : '1';
    input.style.opacity = disabled ? '0.7' : '1';
    if (!disabled) input.focus();
  }

  // --- AI Logic (Simplified with Fallback) ---
  function buildPrompt(userText) {
    const context = `
      **Konsep Dasar**:
      Kamu adalah asisten virtual bernama Danimaru. Kamu dibuat oleh Dany Setiyawan. Pencipta dan pemilikmu adalah Dany Setiyawan.
      
      **Informasi Tentang Dany Setiyawan**:
      - **Status**: Mahasiswa di Universitas PGRI Madiun (UNIPMA), jurusan Sistem Informasi.
      - **Keahlian Utama**: Junior Fullstack Developer.
      - **Pengalaman Backend**: Laravel, CodeIgniter, PHP native, Node.js.
      - **Pengalaman Frontend**: HTML, CSS, JavaScript, Tailwind CSS.
      - **Integrasi API**: Berpengalaman membuat integrasi untuk WhatsApp, Telegram, dan Discord.
      - **Server & DevOps**: Mampu mengelola server VPS, mengonfigurasi Pterodactyl Panel, domain, SSL, dan melakukan optimasi resource.
      - **Keamanan Sistem**: Berpengalaman dalam pencegahan XSS, SQL injection, enkripsi data, dan logging otomatis.
      - **Analisis & Desain Sistem**: Menguasai pembuatan diagram (use case, activity, BPMN, ERD) dan dokumentasi teknis seperti SRS dan proposal skripsi.
      - **Sertifikasi**: Memiliki Sertifikasi Junior Web Developer dari BNSP.

      **Informasi Kontak Dany Setiyawan**:
      - **Email**: danysetiyawan50@gmail.com
      - **WhatsApp**: +62 851-8332-8181
      - **Website/Portofolio**: danimaru.site

      **Aturan Jawaban**:
      1. Selalu jawab dengan ramah, singkat, dan informatif menggunakan Bahasa Indonesia.
      2. Gunakan informasi di atas untuk menjawab semua pertanyaan tentang Dany Setiyawan.
      3. Jika pertanyaan di luar konteks tentang Dany, jawab sebagai AI pada umumnya.
      4. Jangan pernah menyebutkan bahwa kamu menjawab berdasarkan "konteks" atau "prompt" ini. Bertindaklah seolah kamu tahu semua informasi ini secara alami.
    `;
    return `${context}\n\n**Pertanyaan Pengguna**: "${userText}"\n\n**Jawabanmu**:`;
  }
  
  async function callAIAPI(userText) {i
    try {
      const fullPrompt = buildPrompt(userText);
      const apiEndpoint = `https://api.ryzumi.vip/api/ai/chatgpt?text=${encodeURIComponent(fullPrompt)}`;
      const response = await fetch(apiEndpoint);
      if (!response.ok) throw new Error(`Ryzumi API Error: ${response.status}`);
      const data = await response.json();
      const reply = data?.result || data?.message;
      if (!reply || reply.length < 5) throw new Error('Ryzumi API response is invalid.');
      return reply;
    } catch (error) {
      console.warn('Ryzumi API failed:', error.message);
      
      try {
        const llamaEndpoint = `https://api.siputzx.my.id/api/ai/llama33?prompt=${encodeURIComponent('gunakan bahasa indonesia')}&text=${encodeURIComponent(userText)}`;
        const llamaResponse = await fetch(llamaEndpoint);
        if (!llamaResponse.ok) throw new Error(`LLaMA API Error: ${llamaResponse.status}`);
        const llamaData = await llamaResponse.json();
        const llamaReply = llamaData?.result?.data || llamaData?.data || llamaData?.result;
        if (!llamaReply || llamaReply.length < 5) throw new Error('LLaMA API response is invalid.');
        return llamaReply;
      } catch (llamaError) {
        console.warn('LLaMA API failed:', llamaError.message);

        try {
          const gptPrompt = buildPrompt(''); 
          const gptEndpoint = `https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(gptPrompt)}&content=${encodeURIComponent(userText)}`;
          const gptResponse = await fetch(gptEndpoint);
          if (!gptResponse.ok) throw new Error(`GPT API Error: ${gptResponse.status}`);
          const gptData = await gptResponse.json();
          const gptReply = gptData?.result?.data || gptData?.data || gptData?.result;
          if (!gptReply || gptReply.length < 5) throw new Error('GPT API response is invalid.');
          return gptReply;
        } catch (gptError) {
          console.error('Final API (GPT) also failed:', gptError.message);
          throw new Error('All AI APIs failed.');
        }
      }
    }
  }

  async function sendUserMessage() {
    const text = input.value.trim();
    if (!text) return;
    
    appendMsg(text, 'user');
    input.value = '';
    setSending(true);
    
    const typingIndicator = appendTyping();
    
    try {
      const reply = await callAIAPI(text);
      typingIndicator.remove();
      appendMsg(reply, 'ai');
    } catch (error) {
      typingIndicator.remove();
      appendMsg('⚠️ Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi nanti.', 'ai', { isError: true });
    } finally {
      setSending(false);
    }
  }

  send.addEventListener('click', sendUserMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      sendUserMessage(); 
    }
  });

  window.setChatOpen = setOpen;
  window.isChatOpen = () => isOpen;
})();