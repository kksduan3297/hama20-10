/* Tiny — a little friend who travels through the entire gift. */
(() => {
  'use strict';
  let initialized = false, sleeping = true, bowed = false, moodName = 'sleep';
  let companion, art, speech, dock, speechTimer, moodTimer, bounceTimer, petIndex = 0, lastPet = 0;
  const gentleMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fallbackLines = [
    'Á! Nhột quá nha~ Hihi, đừng chọc Tiny nữa mà!',
    'Ui… được Hà My xoa đầu là Tiny hết pin buồn luôn á.',
    'Tiny đang làm nhiệm vụ màaa. Cơ mà… xoa thêm chút cũng được.',
    'Anh Duẫn gửi một cái ôm. Tiny giao hàng hơi vụng, em nhận giùm nha.',
    'Má Tiny hồng là tại em đó, không phải máy bị nóng đâu nha!'
  ];
  const robotSVG = `<svg class="tiny-robot" viewBox="0 0 360 350" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="tiny-shell" x1="80" y1="55" x2="285" y2="265" gradientUnits="userSpaceOnUse"><stop stop-color="#fffefc"/><stop offset=".48" stop-color="#f9f4f2"/><stop offset=".75" stop-color="#e6dce4"/><stop offset="1" stop-color="#fff6fa"/></linearGradient>
      <linearGradient id="tiny-body" x1="154" y1="225" x2="199" y2="316" gradientUnits="userSpaceOnUse"><stop stop-color="#fff9fc"/><stop offset="1" stop-color="#dddae9"/></linearGradient>
      <linearGradient id="tiny-screen" x1="113" y1="99" x2="248" y2="217" gradientUnits="userSpaceOnUse"><stop stop-color="#18333e"/><stop offset=".52" stop-color="#111d2a"/><stop offset="1" stop-color="#07121b"/></linearGradient>
      <linearGradient id="tiny-pink" x1="155" y1="18" x2="211" y2="84" gradientUnits="userSpaceOnUse"><stop stop-color="#ff9fbd"/><stop offset=".5" stop-color="#ef6799"/><stop offset="1" stop-color="#ca3c77"/></linearGradient>
      <linearGradient id="tiny-heart" x1="170" y1="266" x2="189" y2="289"><stop stop-color="#ff9bbe"/><stop offset="1" stop-color="#e94f89"/></linearGradient>
      <filter id="tiny-cyan"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id="tiny-shadow" x="-40%" y="-30%" width="180%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#ac7598" flood-opacity=".24"/></filter>
      <radialGradient id="tiny-cheek"><stop stop-color="#ff79a7" stop-opacity=".85"/><stop offset="1" stop-color="#ff85ae" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse class="tiny-ground" cx="180" cy="324" rx="69" ry="10" fill="#cda4bc" opacity=".2"/>
    <g class="tiny-bob">
      <g class="tiny-left-arm"><path d="M121 251c-18-12-34-3-38 11-4 16 8 25 18 19l30-17" fill="url(#tiny-shell)" stroke="#cfc4d5" stroke-width="2"/><path d="M87 265l12-5" stroke="white" stroke-width="4" stroke-linecap="round"/></g>
      <g class="tiny-right-arm"><path d="M239 251c18-12 34-3 38 11 4 16-8 25-18 19l-30-17" fill="url(#tiny-shell)" stroke="#cfc4d5" stroke-width="2"/><path d="M273 265l-12-5" stroke="white" stroke-width="4" stroke-linecap="round"/></g>
      <path d="M148 301c-2 3-9 9-9 14 0 8 25 8 29 0l5-13M212 301c2 3 9 9 9 14 0 8-25 8-29 0l-5-13" fill="#e2dae9" stroke="#bfb6ce" stroke-width="2"/>
      <path d="M136 235c-14 19-17 51-4 65 16 16 80 16 96 0 13-14 10-46-4-65" fill="url(#tiny-body)" stroke="#d0c4d9" stroke-width="2"/>
      <path d="M143 247c12 8 61 9 74 0" stroke="white" stroke-width="4" stroke-linecap="round" opacity=".8"/>
      <circle cx="180" cy="276" r="18" fill="#f3e9f1" stroke="#dfd2e3" stroke-width="1.4"/>
      <path class="tiny-heart-light" d="M180 285s-11-6.6-11-13a6 6 0 0 1 11-3 6 6 0 0 1 11 3c0 6.4-11 13-11 13Z" fill="url(#tiny-heart)"/>
      <path d="M160 295h40" stroke="#c7bbd2" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 5"/>
      <g class="tiny-head" filter="url(#tiny-shadow)">
        <path class="tiny-antenna" d="M181 74V48" stroke="#d6becf" stroke-width="7" stroke-linecap="round"/>
        <circle class="tiny-antenna-light" cx="181" cy="42" r="9" fill="#f8a9ca" stroke="white" stroke-width="3"/>
        <rect x="67" y="123" width="23" height="58" rx="11.5" fill="#e5dce7" stroke="#c8bfce" stroke-width="2"/>
        <rect x="270" y="123" width="23" height="58" rx="11.5" fill="#e5dce7" stroke="#c8bfce" stroke-width="2"/>
        <path d="M82 111c6-26 34-39 98-39s92 13 98 39c7 29 6 77-3 100-10 26-39 36-95 36s-85-10-95-36c-9-23-10-71-3-100Z" fill="url(#tiny-shell)" stroke="#d4c7d8" stroke-width="2"/>
        <path d="M99 107c17-18 129-28 156 1" stroke="white" stroke-width="6" stroke-linecap="round" opacity=".88"/>
        <path d="M104 121c4-18 29-27 76-27s72 9 76 27c5 21 4 51-3 70-7 17-29 24-73 24s-66-7-73-24c-7-19-8-49-3-70Z" fill="url(#tiny-screen)" stroke="#6b7384" stroke-width="2.4"/>
        <path d="M115 119c19-12 71-18 100-11" stroke="#bdd1d9" stroke-opacity=".2" stroke-width="4" stroke-linecap="round"/>
        <g class="tiny-eyes-glow" filter="url(#tiny-cyan)" stroke="#48e6ef" stroke-width="12" stroke-linecap="round">
          <path class="tiny-eye tiny-eye-left" d="M143 139v20"/><path class="tiny-eye tiny-eye-right" d="M217 139v20"/>
        </g>
        <g class="tiny-eyes" stroke="#7df6fa" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
          <path class="tiny-eye tiny-eye-left" d="M143 139v20"/><path class="tiny-eye tiny-eye-right" d="M217 139v20"/>
        </g>
        <g class="tiny-cheeks"><ellipse cx="123" cy="182" rx="21" ry="13" fill="url(#tiny-cheek)"/><ellipse cx="237" cy="182" rx="21" ry="13" fill="url(#tiny-cheek)"/><g stroke="#ff9ebd" stroke-width="1.8" stroke-linecap="round"><path d="m113 181 3-7m2 10 3-7m2 10 3-7m2 10 3-7m97 4 3-7m2 10 3-7m2 10 3-7m2 10 3-7"/></g></g>
        <path class="tiny-mouth" d="M171 181q9 10 18 0" stroke="#77e9ed" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="180" cy="230" r="4" fill="#d0bfd2"/><circle cx="180" cy="230" r="2" fill="white"/>
      </g>
      <g class="tiny-ribbon" transform="rotate(-8 185 65)">
        <path d="m172 76-22 34 22-5 12 11 8-37m-6-2 25 30 2-21 17-12-35-8" fill="#ec77a2" stroke="#cc5584" stroke-width="1.2"/>
        <path d="M177 62c-13-18-45-31-51-21-8 13-6 42 3 49 9 8 36-1 51-13M188 60c13-18 45-31 51-21 8 13 6 42-3 49-9 8-36-1-51-13" fill="url(#tiny-pink)" stroke="#ce5684" stroke-width="2"/>
        <path d="m136 49 32 19m-34 11 34-7m61-25-32 20m32 10-32-6" stroke="#ffd1e2" stroke-width="3" stroke-linecap="round" opacity=".65"/>
        <path d="M174 57c4-4 15-4 20 0 6 5 6 20 1 24-4 4-17 4-21 0-5-4-5-19 0-24Z" fill="#f79dbd" stroke="#d35a8b" stroke-width="2"/><path d="m179 60-1 13" stroke="#ffe5ed" stroke-width="3" stroke-linecap="round"/>
      </g>
    </g>
    <g class="tiny-sleep-z" fill="#a0a5c5" font-family="ui-rounded,system-ui,sans-serif" font-weight="700"><text x="278" y="90" font-size="22">z</text><text x="298" y="65" font-size="29">z</text><text x="320" y="33" font-size="34">z</text></g>
  </svg>`;

  const eyePaths = {
    normal: ['M143 139v20', 'M217 139v20'],
    sleep: ['M132 152q11 9 22 0', 'M206 152q11 9 22 0'],
    happy: ['M131 155q12-23 24 0', 'M205 155q12-23 24 0'],
    excited: ['m134 139 13 11-13 11', 'm226 139-13 11 13 11'],
    sad: ['m131 151 23 6', 'm205 157 23-6'],
    love: ['M143 160s-14-8-14-17a7 7 0 0 1 14-2 7 7 0 0 1 14 2c0 9-14 17-14 17Z', 'M217 160s-14-8-14-17a7 7 0 0 1 14-2 7 7 0 0 1 14 2c0 9-14 17-14 17Z'],
    surprised: ['M143 136v27', 'M217 136v27']
  };
  function init() {
    if (initialized) return;
    companion = document.getElementById('tiny-companion');
    art = document.getElementById('tiny-art');
    speech = document.getElementById('tiny-speech');
    dock = document.getElementById('tiny-dock');
    if (!companion || !art) return;
    initialized = true;
    art.innerHTML = robotSVG;
    companion.setAttribute('aria-label', 'Chạm để đánh thức Tiny');
    companion.setAttribute('type', 'button');
    mood('sleep');
    companion.addEventListener('click', () => {
      if (sleeping) document.dispatchEvent(new CustomEvent('tiny:wake'));
      else pet();
    });
    let pointerStart = null;
    companion.addEventListener('pointerdown', e => { pointerStart = {x:e.clientX,y:e.clientY}; }, {passive:true});
    companion.addEventListener('pointermove', e => {
      if (!pointerStart || sleeping) return;
      if (Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>10 && performance.now()-lastPet>600) {
        pet(); pointerStart = {x:e.clientX,y:e.clientY};
      }
    }, {passive:true});
    ['pointerup','pointercancel','pointerleave'].forEach(name=>companion.addEventListener(name,()=>{pointerStart=null;},{passive:true}));
  }
  function mood(value) {
    if (!art) return;
    if(value==='sleep'){sleeping=true;clearTimeout(moodTimer);art.classList.remove('tiny-awake','tiny-jump','tiny-petted');}
    clearTimeout(moodTimer);
    if (value === 'sleep') sleeping = true;
    moodName = eyePaths[value] ? value : 'normal';
    art.dataset.mood = moodName;
    if (dock) dock.dataset.mood = moodName;
    art.querySelectorAll('.tiny-eye-left').forEach(el=>el.setAttribute('d',eyePaths[moodName][0]));
    art.querySelectorAll('.tiny-eye-right').forEach(el=>el.setAttribute('d',eyePaths[moodName][1]));
    const mouth=art.querySelector('.tiny-mouth');
    mouth.setAttribute('d', moodName==='sleep' ? 'M174 182h12' : moodName==='sad' ? 'M171 187q9-10 18 0' : moodName==='surprised' ? 'M177 181a4 6 0 1 0 7 0a4 6 0 1 0-7 0' : 'M171 181q9 10 18 0');
    companion.setAttribute('aria-label',sleeping?'Chạm để đánh thức Tiny':'Vuốt ve Tiny');
  }
  function say(text, ms = 6500) {
    if (!speech) return;
    clearTimeout(speechTimer);
    speech.textContent = String(text || '');
    speech.hidden = !text;
    speech.classList.remove('tiny-speech-in');
    void speech.offsetWidth;
    speech.classList.add('tiny-speech-in');
    if (ms > 0) speechTimer=setTimeout(()=>{speech.hidden=true;},ms);
  }
  function bow(value = true) {
    bowed = Boolean(value);
    if (!art) return;
    art.classList.toggle('has-bow',bowed);
    if (bowed) {
      art.classList.remove('tiny-jump'); void art.offsetWidth; art.classList.add('tiny-jump');
    }
  }
  function pet() {
    if (!initialized || sleeping || performance.now()-lastPet < 300) return;
    lastPet=performance.now();
    const lines=window.HMY_CONTENT?.petLines?.length?window.HMY_CONTENT.petLines:fallbackLines;
    say(lines[petIndex++%lines.length]);
    clearTimeout(moodTimer); clearTimeout(bounceTimer);
    mood(petIndex%3===0?'excited':'happy');
    art.classList.remove('tiny-jump'); void art.offsetWidth; art.classList.add('tiny-jump','tiny-petted');
    const box=companion.getBoundingClientRect();
    window.FX?.burst(box.x+box.width/2,box.y+box.height*.35,{type:petIndex%3===0?'flower':'heart',count:gentleMotion?5:15});
    bounceTimer=setTimeout(()=>art.classList.remove('tiny-jump','tiny-petted'),1700);
    moodTimer=setTimeout(()=>mood('normal'),3000);
  }
  function awake() {
    if (!initialized) init();
    sleeping=false;
    art.classList.add('tiny-awake');
    mood('surprised');
    clearTimeout(moodTimer);
    moodTimer=setTimeout(()=>mood('happy'),700);
    companion.setAttribute('aria-label','Vuốt ve Tiny');
  }
  window.Tiny=Object.freeze({init,mood,say,bow,pet,awake});
})();
