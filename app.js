/* Hà My ♡ A little universe, made by Duẫn. Static, offline-ready, no trackers. */
(() => {
  'use strict';
  const C = window.HMY_CONTENT;
  if (!C) { console.error('Missing content.js'); return; }
  const $ = id => document.getElementById(id);
  const all = sel => Array.from(document.querySelectorAll(sel));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sequence = ['wake','bouquet','profile','hearts','quiz','meadow','wishes','puzzle','planet','letter','ending'];
  const done = new Set();
  let current = 'wake', navigationLock = false, wakeDone = false, runToken = 0;
  const later = (fn, ms) => {const token=runToken;return setTimeout(()=>{if(token===runToken)fn();}, reduced ? Math.min(ms, 100) : ms);};
  const show = (id, value = true) => { const el = $(id); if(el) el.hidden = !value; };
  const text = (id, value) => { if ($(id)) $(id).textContent = value; };
  const on = (id, ev, fn, opts) => { if ($(id)) $(id).addEventListener(ev, fn, opts); };
  const say = (s, ms = 6500) => window.Tiny?.say(s, ms);
  const mood = m => window.Tiny?.mood(m);
  const emit = (el, type = 'heart', count = 28) => {
    const r = el?.getBoundingClientRect();
    if(r) window.FX?.burst(r.left+r.width/2, r.top+r.height/2, {type,count});
  };
  let toastTimer;
  function toast(s) { text('toast',s); show('toast'); clearTimeout(toastTimer); toastTimer = setTimeout(()=>show('toast',false),3600); }
  function mark(scene, nextId) { done.add(scene); if(nextId) show(nextId); }
  function navigate(name, {force=false} = {}) {
    if(!sequence.includes(name) || navigationLock) return;
    const target = document.querySelector(`.scene[data-scene="${name}"]`);
    if(!target) return;
    navigationLock = true;
    closeAllDialogs();
    stopHeartMotion();
    window.FX?.transition();
    all('.scene[data-scene]').forEach(el => { const active = el===target; el.hidden=!active; el.classList.toggle('active',active); });
    current=name; document.body.dataset.scene=name;
    const dock=$('tiny-dock');dock?.classList.toggle('hero', name==='wake');
    const dockHome=name==='wake'?document.querySelector('.cover-hero-space'):document.body;
    if(dock&&dockHome)dockHome.append(dock);
    show('back-btn', name!=='wake');
    window.FX?.setScene(name);
    mood(name==='wake'&&!wakeDone?'sleep':name==='letter'?'love':'happy');
    const sceneLine = C.sceneLines?.[name]; if(sceneLine) say(sceneLine);
    window.scrollTo({top:0,behavior:'instant'});
    if(name==='hearts'&&!done.has('hearts')) startHeartMotion();
    if(name==='wishes'&&wishIndex===0&&!wishStarted) { wishStarted=true; landWish(0); }
    if(name==='planet') prepareOrbit();
    if(name==='letter') prepareLetterPhotos();
    if(name==='ending') window.FX?.burst(innerWidth/2,innerHeight*.32,{type:'heart',count:70});
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', ['wishes','planet'].includes(name)?'#211630':name==='meadow'?'#123f3b':'#fff4f1');
    const heading=target.querySelector('h1,h2');
    if(heading&&name!=='wake') { heading.tabIndex=-1; heading.focus({preventScroll:true}); }
    setTimeout(()=>navigationLock=false,120);
  }
  document.addEventListener('click', e => {
    const next=e.target.closest('[data-next]');
    if(next) { const explicit=next.dataset.next; const name=sequence.includes(explicit)?explicit:sequence[sequence.indexOf(current)+1]; navigate(name); }
    if(e.target.closest('[data-back]')) navigate(sequence[Math.max(0,sequence.indexOf(current)-1)]);
    const close=e.target.closest('[data-close]');
    if(close) { const d=close.closest('dialog,[role="dialog"]'); if(d) closeDialog(d); }
  });
  on('back-btn','click',()=>navigate(sequence[Math.max(0,sequence.indexOf(current)-1)]));

  // Native top-layer dialogs stay outside all animated/transformed scene wrappers.
  let dialogOpener=null, scrollBeforeDialog=0;
  function openDialog(id) {
    const d=$(id); if(!d)return;
    dialogOpener=document.activeElement; scrollBeforeDialog=scrollY;
    d.hidden=false;
    if(typeof d.showModal==='function') { if(!d.open) d.showModal(); }
    else { d.setAttribute('open',''); d.setAttribute('aria-modal','true'); d.classList.add('dialog-fallback'); }
    document.body.classList.add('modal-open');
    d.querySelector('button,input,textarea')?.focus({preventScroll:true});
  }
  function closeDialog(d) {
    if(!d)return;
    if(typeof d.close==='function'&&d.open)d.close();
    d.removeAttribute('open');d.classList.remove('dialog-fallback');d.hidden=true;
    if(d.id==='media-dialog') { const v=d.querySelector('video'); if(v)v.pause(); resumeAfterVideo(); }
    if(!all('dialog[open],.dialog-fallback').length)document.body.classList.remove('modal-open');
    dialogOpener?.focus?.({preventScroll:true});
  }
  function closeAllDialogs(){all('dialog[open],.dialog-fallback').forEach(closeDialog);}
  for(const id of ['radio','album','media','notebook']) {
    on(`${id}-close`,'click',()=>closeDialog($(`${id}-dialog`)));
    const d=$(`${id}-dialog`);
    if(d){
      d.addEventListener('cancel',e=>{e.preventDefault();closeDialog(d);});
      d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))closeDialog(d);});
      d.addEventListener('close',()=>{d.hidden=true;if(!all('dialog[open]').length)document.body.classList.remove('modal-open');});
    }
  }

  // One audio element, one graph. Safari play/resume are both initiated in a user gesture.
  const tracks=C.playlist||[];
  let trackIndex=0, audioContext=null, gain=null, graphAttempted=false, switching=0, wasPlayingForVideo=false;
  const audio=$('radio-audio')||Object.assign(document.body.appendChild(document.createElement('audio')),{id:'radio-audio'});
  audio.preload='metadata'; audio.setAttribute('playsinline','');
  const storage={get:(k)=>{try{return localStorage.getItem(k);}catch(_){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);return true;}catch(_){return false;}}};
  let volume=Math.max(0,Math.min(1,Number(storage.get('hmy-volume')??0.55)));
  function graph(){
    if(graphAttempted)return;graphAttempted=true;
    try { const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      audioContext=new AC();const source=audioContext.createMediaElementSource(audio);gain=audioContext.createGain();
      gain.gain.value=volume;source.connect(gain).connect(audioContext.destination);audio.volume=1;
    }catch(_){gain=null;audioContext=null;audio.volume=volume;}
  }
  function syncPlay(){
    const playing=!audio.paused;
    text('play-toggle',playing?'Ⅱ':'▶');
    $('play-toggle')?.setAttribute('aria-label',playing?'Tạm dừng nhạc':'Phát nhạc');
    $('radio-open')?.classList.toggle('is-playing',playing);
    $('radio-open')?.setAttribute('aria-label',playing?'HMY Radio đang phát · Mở chọn nhạc':'Mở HMY Radio chọn nhạc');
    all('[data-track]').forEach((b,i)=>{b.classList.toggle('is-selected',i===trackIndex);b.setAttribute('aria-pressed',String(i===trackIndex));});
  }
  function playMusic(){
    if(!tracks.length)return;
    graph();
    if(audioContext?.state==='suspended') audioContext.resume().catch(()=>{});
    if(!audio.src)selectTrack(trackIndex,false);
    const ticket=switching;
    const p=audio.play();
    if(p?.then)p.then(()=>{if(ticket===switching){text('audio-status','Nhạc đang phát · Dành riêng cho hà mãaa');syncPlay();}}).catch(err=>{if(err.name!=='AbortError'){text('audio-status','Chạm Phát nhạc để nghe nha.');syncPlay();}});
  }
  function selectTrack(i, play=true){
    if(!tracks.length)return;
    switching++; trackIndex=(i+tracks.length)%tracks.length;
    const t=tracks[trackIndex];audio.pause();audio.src=t.src;audio.load();
    text('track-title',t.title||t.name);if($('seek'))$('seek').value=0;
    text('audio-status',`${t.artist||'HMY Radio'} · Chạm để nghe`);syncPlay();
    if(play)playMusic();
  }
  function setVolume(v){volume=Math.max(0,Math.min(1,Number(v)));if(gain&&audioContext)gain.gain.setTargetAtTime(volume,audioContext.currentTime,.025);else audio.volume=volume;
    if($('volume'))$('volume').value=volume;text('volume-label',`${Math.round(volume*100)}%`);storage.set('hmy-volume',volume);
  }
  const list=$('track-list');
  tracks.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.dataset.track=i;b.className='track-option';
    const num=document.createElement('span');num.className='track-number';num.textContent='♫';
    const info=document.createElement('span');info.className='track-info';const name=document.createElement('strong');name.textContent=t.title||t.name;
    const artist=document.createElement('small');artist.textContent=t.artist||'HMY Radio';info.append(name,artist);b.append(num,info);
    b.addEventListener('click',()=>{selectTrack(i);emit(b,'heart',10);});list?.append(b);
  });
  on('radio-open','click',()=>openDialog('radio-dialog'));
  on('play-toggle','click',()=>audio.paused?playMusic():audio.pause());
  on('next-track','click',()=>selectTrack(trackIndex+1));on('prev-track','click',()=>selectTrack(trackIndex-1));
  on('volume','input',e=>setVolume(e.target.value));
  on('seek','input',e=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=Number(e.target.value)/100*audio.duration;});
  audio.addEventListener('timeupdate',()=>{if(Number.isFinite(audio.duration)&&$('seek'))$('seek').value=audio.currentTime/audio.duration*100;});
  audio.addEventListener('ended',()=>selectTrack(trackIndex+1));
  audio.addEventListener('play',syncPlay);audio.addEventListener('pause',syncPlay);
  audio.addEventListener('error',()=>text('audio-status','Bài này chưa tải được. Em thử bấm lại hoặc chọn bài kế nha.'));
  if(tracks.length)selectTrack(0,false);setVolume(volume);

  // Wake up + scattered glyphs gather into a real, readable message.
  function wake(){
    if(wakeDone)return;wakeDone=true;window.Tiny?.awake();playMusic();emit($('tiny-companion'),'heart',36);
    say(C.afterAwake||'Hà My tới rồi! Tiny có đồ anh Duẫn nhờ giao nè.');
    show('wake-btn',false);show('decode-btn');buildLetters();
  }
  on('wake-btn','click',wake);document.addEventListener('tiny:wake',wake);
  let decoding=false;
  function buildLetters(){
    const field=$('decode-field');if(!field||field.children.length)return;
    show('decode-field');
    const message='CHÚC MỪNG 20/10 HÀ MY YÊU DẤU';
    for(const char of Array.from(message)){
      const span=document.createElement('span');span.className='decode-letter';span.textContent=char===' '?'\u00a0':char;span.setAttribute('aria-hidden','true');
      span.style.setProperty('--float-delay',`${-Math.random()*5}s`);
      span.dataset.dx=(Math.random()-.5)*Math.min(innerWidth*.7,480);span.dataset.dy=(Math.random()-.5)*180;span.dataset.rot=(Math.random()-.5)*150;
      span.style.setProperty('--scatter-x',`${span.dataset.dx}px`);span.style.setProperty('--scatter-y',`${span.dataset.dy}px`);span.style.setProperty('--scatter-rot',`${span.dataset.rot}deg`);
      span.style.transform=`translate(${span.dataset.dx}px,${span.dataset.dy}px) rotate(${span.dataset.rot}deg)`;field.append(span);
    }
    field.classList.add('is-scattered');
  }
  on('decode-btn','click',()=>{
    if(decoding)return;decoding=true;buildLetters();$('decode-btn').disabled=true;
    const field=$('decode-field');field?.classList.remove('is-scattered');field?.classList.add('is-decoding');
    all('#decode-field .decode-letter').forEach((el,i)=>{
      if(!reduced&&el.animate)el.animate([{transform:el.style.transform,opacity:.55},{transform:'translate(0,0) rotate(0)',opacity:1}],{duration:1250,delay:i*20,easing:'cubic-bezier(.2,.8,.15,1)',fill:'both'});
      el.style.transform='none';
    });
    later(()=>{show('decode-message');text('decode-message','CHÚC MỪNG 20/10 HÀ MY YÊU DẤU');field?.setAttribute('aria-hidden','true');
      field?.classList.add('gathered');show('decode-field',false);emit($('decode-message'),'star',70);mark('wake','wake-next');show('decode-btn',false);mood('love');say('Thông điệp giải mã xong. Còn món quà này… em nhận giúp anh nha?');},1900);
  });

  // A gold drawn bouquet reveals the real meaning of today's gift.
  let bouquetOpened=false;
  on('bouquet-open','click',()=>{
    if(bouquetOpened)return;bouquetOpened=true;
    $('bouquet-stage')?.classList.add('bouquet-bloomed');
    window.FX?.flowerRain();emit($('bouquet-open'),'flower',120);mood('excited');
    text('bouquet-message','Hôm nay anh chưa đưa hoa tận tay em được. Anh gửi tạm cả vườn ở đây; bó hoa thật, để hôm gặp nhau anh bù nha.');
    say('Bó này không cần tưới đâu. Chỉ cần em cười một chút là nở thêm rồi 🌷');mark('bouquet','bouquet-next');
  });

  // Identity, bow and little honest answers.
  if($('profile-photo'))$('profile-photo').src=C.profilePhoto||'assets/hmy-id.jpg';
  text('profile-name',C.name);text('profile-nick',C.nickname);
  on('scan-btn','click',()=>{
    $('scan-btn').disabled=true;$('profile-photo')?.closest('.identity-card,.profile-card')?.classList.add('scanning');text('scan-result','Đang quét… Tiny hơi hồi hộp rồi đó.');
    later(()=>{text('scan-result','Độ dễ thương: vượt mức Tiny đếm được ♡');$('scan-btn').disabled=false;emit($('profile-photo'));mood('surprised');say('Ủa, sao đo hoài mà vẫn chưa tới giới hạn vậy ta?');},1000);
  });
  on('bow-btn','click',()=>{window.Tiny?.bow(true);mood('love');emit($('tiny-companion'));text('bow-btn','Nơ xinh đã lên đầu Tiny ♡');say('Tiny đeo nơ xong rồi nè. Hà My chấm mấy điểm?');});
  (C.reasons||[]).forEach((r,i)=>{
    const b=document.createElement('button');b.type='button';b.className='reason-card';b.setAttribute('aria-expanded','false');
    const icon=document.createElement('span');icon.className='reason-icon';icon.textContent=r.icon||'♡';
    const label=document.createElement('strong');label.textContent=r.front;const hint=document.createElement('small');hint.textContent='chạm để nghe anh kể';b.append(icon,label,hint);
    b.addEventListener('click',()=>{all('.reason-card').forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-expanded','false');});b.classList.add('selected');b.setAttribute('aria-expanded','true');text('reason-answer',r.back);$('reason-answer')?.classList.add('has-answer');emit(b,'heart',12);mood(i===1?'surprised':'love');});$('reason-grid')?.append(b);
  });

  // Smooth random heart paths, then their energy grows into a whole tree.
  let heartCount=0, heartRAF=0, heartTime=0, heartNodes=[];
  function makeHeart(){
    const field=$('heart-field');if(!field||heartCount>=6)return;
    const el=document.createElement('button');el.className='heart-target';el.type='button';el.textContent=['💗','💖','💕'][Math.floor(Math.random()*3)];el.setAttribute('aria-label','Bắt trái tim');
    const seed=Math.random()*Math.PI*2;const o={el,seed,speed:.4+Math.random()*.35,x:0,y:0};
    el.addEventListener('click',()=>{
      if(!el.isConnected||current!=='hearts')return;
      emit(el,'heart',18);el.remove();heartNodes=heartNodes.filter(h=>h!==o);heartCount++;text('heart-status',`Đã giữ được ${heartCount} trái tim cho tụi mình ♡`);
      if(heartCount===6)growTree();else if(heartNodes.length<3)makeHeart();
    });field.append(el);heartNodes.push(o);
  }
  function startHeartMotion(){
    if(!heartNodes.length)for(let i=0;i<3;i++)makeHeart();if(heartRAF)return;
    let prev=performance.now();
    const frame=now=>{
      if(current!=='hearts'||document.hidden){heartRAF=0;return;}
      heartTime+=Math.min(now-prev,40)/1000;prev=now;
      const field=$('heart-field');if(!field)return;
      const w=Math.max(1,field.clientWidth-62),h=Math.max(1,field.clientHeight-62);
      heartNodes.forEach(o=>{
        const t=reduced?o.seed:heartTime*o.speed+o.seed;
        const x=(.5+.33*Math.sin(t*1.61)+.13*Math.sin(t*3.7+o.seed))*w;
        const y=(.5+.32*Math.cos(t*1.27)+.14*Math.sin(t*2.9))*h;
        o.el.style.transform=`translate3d(${x}px,${y}px,0) rotate(${Math.sin(t*2)*13}deg)`;
      });heartRAF=requestAnimationFrame(frame);
    };heartRAF=requestAnimationFrame(frame);
  }
  function stopHeartMotion(){cancelAnimationFrame(heartRAF);heartRAF=0;}
  function growTree(){
    stopHeartMotion();heartNodes.forEach(h=>h.el.remove());heartNodes=[];
    $('heart-field')?.classList.add('complete');show('tree-stage');
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 640 540');svg.setAttribute('role','img');svg.setAttribute('aria-label','Cây tình yêu với hàng trăm chiếc lá trái tim');
    const title=document.createElementNS(ns,'title');title.textContent='Từ những trái tim nhỏ, tụi mình có cả một tán cây.';svg.append(title);
    const branches=document.createElementNS(ns,'g');branches.setAttribute('fill','none');branches.setAttribute('stroke','#a56a76');branches.setAttribute('stroke-linecap','round');
    const paths=[['M320 505 Q286 424 321 345 Q346 283 316 196',19],['M315 398 Q242 347 206 263',12],['M316 358 Q397 328 434 246',11],['M311 323 Q254 278 247 202',9],['M325 301 Q381 255 374 181',8],['M290 365 Q193 348 157 300',7],['M345 344 Q443 350 487 298',7]];
    paths.forEach(([d,w],i)=>{const p=document.createElementNS(ns,'path');p.setAttribute('d',d);p.setAttribute('stroke-width',w);p.classList.add('tree-branch');p.style.setProperty('--branch-delay',`${i*.15}s`);branches.append(p);});svg.append(branches);
    const leaves=document.createElementNS(ns,'g');const colors=['#ef7497','#f6a1b8','#ec5c87','#d899c1','#ffbfd1','#f29185','#dc7da5'];
    let seed=3297;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
    for(let i=0;i<280;i++){
      const a=rand()*Math.PI*2,rad=Math.sqrt(rand());
      const x=320+Math.cos(a)*225*rad,y=232+Math.sin(a)*166*rad;
      const g=document.createElementNS(ns,'g');g.setAttribute('transform',`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rand()*70-35})`);
      const p=document.createElementNS(ns,'path');p.setAttribute('d','M0 4 C-17 -8 -16 -19 -6 -18 C-2 -18 0 -15 0 -12 C2 -20 14 -20 17 -11 C20 -3 8 5 0 12Z');p.setAttribute('fill',colors[i%colors.length]);p.classList.add('heart-leaf');p.style.setProperty('--leaf-delay',`${.6+rand()*1.8}s`);p.style.setProperty('--leaf-scale',`${.42+rand()*.55}`);g.append(p);leaves.append(g);
    }svg.append(leaves);
    const stage=$('tree-stage');stage.replaceChildren(svg);svg.style.opacity='0';
    const seedSequence=document.createElement('div');seedSequence.className='seed-sequence';
    Object.assign(seedSequence.style,{position:'absolute',inset:'0',pointerEvents:'none'});
    for(let i=0;i<6;i++){
      const h=document.createElement('span');h.textContent='♥';
      Object.assign(h.style,{position:'absolute',left:'50%',top:'40%',fontSize:'24px',color:colors[i],filter:'drop-shadow(0 0 12px #ef8eab)'});seedSequence.append(h);
      const a=i*Math.PI/3;
      if(!reduced&&h.animate)h.animate([{transform:`translate(${Math.cos(a)*120}px,${Math.sin(a)*100}px) scale(1)`,opacity:1},{transform:'translate(0,0) scale(.25)',opacity:0}],{duration:700,fill:'forwards',easing:'ease-in'});
    }
    const seedElement=document.createElement('span');seedElement.textContent='♥';seedElement.setAttribute('aria-hidden','true');
    Object.assign(seedElement.style,{position:'absolute',left:'50%',top:'40%',fontSize:'28px',color:'#db4e7e',opacity:'0',filter:'drop-shadow(0 0 16px #e66c99)'});seedSequence.append(seedElement);stage.append(seedSequence);
    if(!reduced&&seedElement.animate)seedElement.animate([{top:'40%',transform:'translate(-50%,-50%) scale(.8)',opacity:0},{offset:.05,top:'40%',opacity:1},{top:'88%',transform:'translate(-50%,-50%) scale(.4)',opacity:1}],{delay:550,duration:750,fill:'forwards',easing:'cubic-bezier(.5,0,.7,.6)'});
    later(()=>{seedSequence.remove();svg.style.opacity='1';stage.classList.add('tree-growing');document.body.classList.add('daybreak');},1350);
    text('heart-status','Một chút thương mỗi ngày… rồi thành cả một tán cây.');say('Tim em vừa nhặt mọc thành cây luôn rồi. Mát một góc trời của hai đứa nè.');mood('love');
    window.FX?.burst(innerWidth/2,innerHeight*.4,{type:'heart',count:60});later(()=>mark('hearts','heart-next'),3900);
  }

  // The teasing button runs only before a deliberate answer is possible.
  let dodges=0;
  const teasing=['Ơ kìa, đáp án này biết chạy =)))','Hà My nhanh mà Tiny còn nhanh hơn xíu.','Thử nữa hong? Tiny giấu hơi kỹ rồi.','Thôi Tiny đầu hàng. Anh Duẫn tự ghi đáp án luôn kìa.'];
  on('hmy-choice','click',e=>{
    dodges++;const field=$('quiz-field'),b=$('hmy-choice');
    const w=Math.max(1,field.clientWidth-b.offsetWidth-24),h=Math.max(1,field.clientHeight-b.offsetHeight-90);
    b.style.position='absolute';b.style.transform='none';b.style.left=`${12+(dodges%2?w*.82:w*.08)}px`;b.style.top=`${12+((dodges*47)%(Math.max(1,h)))}px`;
    text('quiz-message',teasing[Math.min(dodges-1,3)]);mood('excited');emit(b,'heart',8);
    if(dodges>=4){$('duan-choice')?.classList.add('unlocked');$('duan-choice')?.setAttribute('aria-disabled','false');text('quiz-message','Tiny thú nhận: đề này do anh Duẫn ra. Còn người anh thấy đáng yêu nhất thì vẫn là em.');}
  });
  on('duan-choice','click',()=>{
    if(dodges<4){say('Từ từ, thử chạm đáp án Hà My trước đi nè.');return;}
    mood('excited');emit($('duan-choice'),'heart',55);text('quiz-message','Đức Duẫn đẹp trai được rồi. Còn Hà My là người anh thương nhất, khỏi cần thi ♡');mark('quiz','quiz-next');
  });

  // Three taps grow flowers; clover supports hold, taps and keyboard alike.
  let flowers=0,charge=0,charging=false,chargeRAF=0,chargeStart=0,chargeBase=0;
  on('meadow-field','click',e=>{
    if(flowers>=3)return;flowers++;
    const field=$('meadow-field'),r=field.getBoundingClientRect();
    const f=document.createElement('span');f.className='meadow-flower';f.setAttribute('aria-hidden','true');f.innerHTML='<span class="flower-stem"></span><span class="flower-head">✿</span>';
    let x=e.clientX?r.width?e.clientX-r.left:0:r.width*(.2+flowers*.15);x=Math.max(35,Math.min(r.width-35,x));
    f.style.left=`${x}px`;f.style.bottom=`${20+(flowers%2)*20}px`;f.style.setProperty('--flower-color',['#ffc9d7','#fff1b5','#c7efff'][flowers-1]);field.append(f);emit(f,'flower',22);
    text('meadow-message',flowers<3?'Một bông hoa vừa thức dậy. Chạm thêm chút nữa nha.':'Đủ ba bông rồi. Tiny còn giữ một chút may mắn cho em nè.');
    if(flowers===3){show('clover-wrap');say('Chiếc cỏ này sạc bằng ngón tay Hà My. Giữ một chút là đầy nè 🍀');}
  });
  on('meadow-field','keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('meadow-field').click();}});
  function setCharge(v){
    charge=Math.min(1,v);$('clover-charge')?.style.setProperty('--charge',charge);
    if($('clover-fill'))$('clover-fill').style.width=`${charge*100}%`;
    $('clover-charge')?.setAttribute('aria-label',`Giữ để tích may mắn, ${Math.round(charge*100)} phần trăm`);
    if(charge===1&&!done.has('meadow')){
      charging=false;cancelAnimationFrame(chargeRAF);$('clover-charge')?.classList.add('charged');
      text('clover-message','Mong em gặp những điều dịu dàng. Mọi nỗ lực đều được đền đáp, và những ngày mệt vẫn có người ở bên.');
      emit($('clover-charge'),'star',85);mark('meadow','meadow-next');mood('love');say('Tiny bỏ thêm may mắn vào túi em rồi. Không cần trả lại đâu.');
    }
  }
  function beginCharge(e){if(charge>=1)return;if(e?.button>0)return;charging=true;chargeBase=charge;chargeStart=performance.now();
    if(e?.pointerId!==undefined)try{$('clover-charge').setPointerCapture(e.pointerId);}catch(_){}
    const frame=t=>{if(!charging)return;setCharge(chargeBase+(t-chargeStart)/1500);if(charge<1)chargeRAF=requestAnimationFrame(frame);};chargeRAF=requestAnimationFrame(frame);
  }
  const endCharge=()=>{charging=false;cancelAnimationFrame(chargeRAF);};
  on('clover-charge','pointerdown',beginCharge);on('clover-charge','pointerup',endCharge);on('clover-charge','pointercancel',endCharge);
  on('clover-charge','click',()=>setCharge(charge+.12));
  on('clover-charge','keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();beginCharge();}});
  on('clover-charge','keyup',e=>{if(e.key===' '||e.key==='Enter'){endCharge();setCharge(charge+.12);}});

  // Each wish arrives only after the previous one has opened.
  let wishIndex=0,wishStarted=false,wishRead=new Set();
  function landWish(i){
    const field=$('wish-sky');if(!field||i>=3)return;
    const b=document.createElement('button');b.type='button';b.className='wish-star meteor';b.dataset.wish=i;b.setAttribute('aria-label',`Mở điều ước ${i+1}`);b.innerHTML='<span aria-hidden="true">✦</span><small>chạm ngôi sao</small>';
    const pos=[[23,56],[53,25],[78,55]][i];b.style.left=`${pos[0]}%`;b.style.top=`${pos[1]}%`;b.disabled=true;field.append(b);
    later(()=>{b.classList.add('landed');b.disabled=false;},650);
    b.addEventListener('click',()=>{
      text('wish-text',C.wishes[i]);b.classList.add('opened');emit(b,'star',40);mood('love');
      if(wishRead.has(i))return;wishRead.add(i);wishIndex=i+1;
      if(i<2)later(()=>landWish(i+1),550);
      else {field.classList.add('constellation-complete');
        const ns='http://www.w3.org/2000/svg';let lines=$('constellation');
        if(!lines){lines=document.createElementNS(ns,'svg');lines.id='constellation';lines.setAttribute('viewBox','0 0 100 100');lines.setAttribute('preserveAspectRatio','none');field.prepend(lines);}
        lines.replaceChildren();lines.setAttribute('viewBox','0 0 100 100');lines.setAttribute('preserveAspectRatio','none');
        const path=document.createElementNS(ns,'path');path.setAttribute('d','M23 56 L53 25 L78 55 Z');path.setAttribute('fill','none');path.setAttribute('stroke','#ffeab5');path.setAttribute('stroke-width','.6');lines.append(path);
        later(()=>{window.FX?.supernova();mark('wishes','wish-next');say('Ba ngôi sao, ba điều thật lòng. Em có thể chạm lại bất cứ ngôi sao nào để đọc nha.');},650);
      }
    });
  }

  // Photo puzzle: select any two squares to swap. No impossible sliding states.
  let pieces=[4,0,7,2,8,1,5,3,6],selectedSlot=null,puzzleDone=false;
  const puzzleSrc=typeof C.puzzlePhoto==='number'?C.album[C.puzzlePhoto].src:(C.puzzlePhoto?.src||C.puzzlePhoto||C.album?.[0]?.src);
  function renderPuzzle(){
    const board=$('puzzle-board');if(!board)return;board.replaceChildren();
    pieces.forEach((piece,slot)=>{
      const b=document.createElement('button');b.type='button';b.className='puzzle-tile';b.dataset.slot=slot;b.dataset.piece=piece;
      b.setAttribute('aria-label',`Mảnh ảnh ở hàng ${Math.floor(slot/3)+1}, cột ${slot%3+1}`);b.setAttribute('aria-pressed',String(slot===selectedSlot));b.classList.toggle('selected',slot===selectedSlot);
      b.style.backgroundImage=`url("${puzzleSrc}")`;b.style.backgroundSize='300% 300%';b.style.backgroundPosition=`${piece%3*50}% ${Math.floor(piece/3)*50}%`;
      b.disabled=puzzleDone;
      b.addEventListener('click',()=>{
        if(selectedSlot===null){selectedSlot=slot;renderPuzzle();return;}
        [pieces[selectedSlot],pieces[slot]]=[pieces[slot],pieces[selectedSlot]];selectedSlot=null;
        puzzleDone=pieces.every((p,i)=>p===i);renderPuzzle();
        if(puzzleDone){board.classList.add('solved');text('puzzle-message','Ghép xong rồi. Có một chiếc két đang chờ em mở nè.');emit(board,'heart',65);show('vault-wrap');$('vault-wrap')?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'center'});say('Ghép đúng người thương rồi. Giờ tìm bốn con số quen thuộc nha.');}
      });board.append(b);
    });
  }renderPuzzle();
  let previewTimer;
  on('puzzle-help','click',()=>{
    const board=$('puzzle-board');board.style.backgroundImage=`url("${puzzleSrc}")`;board.classList.add('show-preview');text('puzzle-message','Nhìn kỹ nha, rồi chạm hai mảnh để đổi chỗ cho nhau.');clearTimeout(previewTimer);previewTimer=setTimeout(()=>board.classList.remove('show-preview'),2200);
  });
  let pin='',hintLevel=0,vaultOpen=false;
  function updatePin(){
    all('#pin-dots span').forEach((s,i)=>{s.classList.toggle('filled',i<pin.length);s.textContent=i<pin.length?'♥':'';});
    $('pin-dots')?.setAttribute('aria-label',`Đã nhập ${pin.length} trên 4 số`);
  }
  function inputPin(key){
    if(vaultOpen||!puzzleDone)return;
    if(key==='clear')pin='';else if(key==='back')pin=pin.slice(0,-1);else if(/^\d$/.test(key)&&pin.length<4)pin+=key;
    updatePin();
    if(pin.length===4){
      if(pin===String(C.vaultCode||'3297')){
        vaultOpen=true;mark('puzzle','vault-next');$('vault-wrap')?.classList.add('vault-unlocked');text('vault-status','Đúng rồi. Kỷ niệm của tụi mình mở cửa ♡');emit($('pin-dots'),'star',70);say('Bíp bíp! Xe của Tiny sẵn sàng đưa em tới hành tinh rồi.');
      }else {text('vault-status','Chưa đúng rồi. Thử lại nha, Tiny không khóa két đâu.');$('vault-wrap')?.classList.add('shake');setTimeout(()=>{$('vault-wrap')?.classList.remove('shake');pin='';updatePin();},550);}
    }
  }
  on('keypad','click',e=>{const b=e.target.closest('[data-key]');if(b)inputPin(b.dataset.key);});
  document.addEventListener('keydown',e=>{if(current==='puzzle'&&puzzleDone&&!all('dialog[open]').length&&!/INPUT|TEXTAREA/.test(e.target.tagName)){if(/^\d$/.test(e.key))inputPin(e.key);if(e.key==='Backspace')inputPin('back');}});
  on('vault-hint','click',()=>{const hints=['Bốn con số quen thuộc của hai đứa đó.','Bắt đầu bằng 3, kết thúc bằng 7.','Tiny nói nhỏ nha: 3 · 2 · 9 · 7.'];text('vault-status',hints[Math.min(hintLevel++,2)]);});

  // Orbital memory theatre + all story assets in a separate gallery.
  const album=C.album||[];let mediaIndex=0,planetReady=false,curtainOpened=false;
  function imageButton(item,index,className){
    const b=document.createElement('button');b.type='button';b.className=className;b.dataset.photo=index;b.setAttribute('aria-label',`Xem ${item.kind==='video'?'video':'ảnh'}: ${item.alt||item.caption}`);
    const img=document.createElement('img');img.src=item.kind==='video'?(item.poster||''):item.src;img.alt=item.alt||item.caption||'Kỷ niệm của tụi mình';img.loading='lazy';img.decoding='async';b.append(img);
    const cap=document.createElement('span');cap.textContent=item.kind==='video'?'▶ Một đoạn của tụi mình':(item.shortCaption||item.caption);b.append(cap);
    b.addEventListener('click',()=>openMedia(index));return b;
  }
  function prepareOrbit(){
    if(planetReady)return;planetReady=true;
    const n=Math.min(8,album.filter(x=>x.kind!=='video').length);const preferred=C.orbitPhotos||[0,8,9,10,11,5,6,15];
    for(let i=0;i<n;i++){
      const index=preferred[i]??i,item=album[index]||album[i];
      const b=imageButton(item,index,'orbit-photo');b.style.setProperty('--angle',`${i*360/n}deg`);b.style.setProperty('--i',i);b.style.setProperty('--tilt',`${i%2?-7:6}deg`);
      const angle=(i/n)*Math.PI*2-Math.PI/2;
      b.style.setProperty('--ox',`${50+Math.cos(angle)*37}%`);b.style.setProperty('--oy',`${50+Math.sin(angle)*39}%`);$('orbit-photos')?.append(b);
    }
  }
  on('curtain-open','click',()=>{
    curtainOpened=true;$('planet-stage')?.classList.add('curtain-open','awake');$('curtain-left')?.classList.add('open');$('curtain-right')?.classList.add('open');show('curtain-open',false);
    emit($('planet-core'),'star',100);say('Chào mừng em tới chỗ anh cất những điều không muốn quên. Chạm từng tấm ảnh thử nha.');
  });
  let soundContext;
  function beep(){
    try{soundContext=audioContext||soundContext||new (window.AudioContext||window.webkitAudioContext)();soundContext.resume();
      for(let i=0;i<2;i++){const o=soundContext.createOscillator(),g=soundContext.createGain();o.type='sine';o.frequency.value=i?880:660;g.gain.setValueAtTime(0,soundContext.currentTime+i*.17);g.gain.linearRampToValueAtTime(.07,soundContext.currentTime+i*.17+.015);g.gain.exponentialRampToValueAtTime(.001,soundContext.currentTime+i*.17+.12);o.connect(g).connect(soundContext.destination);o.start(soundContext.currentTime+i*.17);o.stop(soundContext.currentTime+i*.17+.14);}
    }catch(_){}
  }
  on('rover-btn','click',()=>{beep();$('rover-btn')?.classList.add('rover-go');setTimeout(()=>$('rover-btn')?.classList.remove('rover-go'),900);say('Bíp bíp! Hành khách hà mãaa nhớ mang theo nụ cười nha.');emit($('rover-btn'),'star',18);});
  album.forEach((item,i)=>$('album-grid')?.append(imageButton(item,i,'gallery-photo')));
  for(const id of ['album-open','revisit-album'])on(id,'click',()=>openDialog('album-dialog'));
  function openMedia(index){
    mediaIndex=(index+album.length)%album.length;const item=album[mediaIndex];if(!item)return;
    const old=$('media-content')?.querySelector('video');if(old)old.pause();
    $('media-content')?.replaceChildren();
    let el;
    if(item.kind==='video'){
      wasPlayingForVideo=wasPlayingForVideo||!audio.paused;audio.pause();el=document.createElement('video');el.src=item.src;el.controls=true;el.playsInline=true;el.preload='metadata';if(item.poster)el.poster=item.poster;
      el.addEventListener('play',()=>{wasPlayingForVideo=wasPlayingForVideo||!audio.paused;audio.pause();});
      el.addEventListener('ended',resumeAfterVideo);
    }else{resumeAfterVideo();el=document.createElement('img');el.src=item.src;el.alt=item.alt||item.caption;}
    $('media-content')?.append(el);text('media-caption',item.caption);if(!$('media-dialog')?.open)openDialog('media-dialog');
  }
  function resumeAfterVideo(){if(wasPlayingForVideo){wasPlayingForVideo=false;playMusic();}}
  on('media-prev','click',()=>openMedia(mediaIndex-1));on('media-next','click',()=>openMedia(mediaIndex+1));
  document.addEventListener('keydown',e=>{if($('media-dialog')?.open){if(e.key==='ArrowRight')openMedia(mediaIndex+1);if(e.key==='ArrowLeft')openMedia(mediaIndex-1);}});

  // A handwritten booklet, with floating snapshots and no forced forgiveness.
  let page=0,letterPhotosReady=false,turning=false;
  const pages=C.letterPages||[];
  function prepareLetterPhotos(){
    if(letterPhotosReady)return;letterPhotosReady=true;
    (C.letterPhotos||[0,6,8,12]).slice(0,6).forEach((n,i)=>{const b=imageButton(album[n]||album[i],n,'letter-photo');b.style.setProperty('--i',i);b.style.setProperty('--tilt',`${i%2?8:-9}deg`);$('letter-surround')?.append(b);});
  }
  function renderPage(){
    const p=pages[page];if(!p)return;
    const wrap=$('letter-page');wrap?.replaceChildren();
    const h=document.createElement('h3');h.textContent=p.title||'Gửi hà mãaa của anh';wrap?.append(h);
    let paragraphs=p.paragraphs||(Array.isArray(p.body)?p.body:[p.body||'']);
    paragraphs.forEach(s=>{const el=document.createElement('p');el.textContent=s;wrap?.append(el);});
    if(page===pages.length-1){const sig=document.createElement('p');sig.className='letter-signature';sig.textContent=C.letterSignature||'Anh Duẫn ♡';wrap?.append(sig);show('letter-finish');}
    $('letter-prev').disabled=page===0;$('letter-next').disabled=page>=pages.length-1;text('letter-position',`${page+1} / ${pages.length}`);
  }
  on('envelope-open','click',()=>{show('envelope-open',false);show('letter-book');renderPage();mood('love');say('Tới đây Tiny nói nhỏ thôi. Anh Duẫn để lại vài lời cho em.');});
  function turn(delta){if(turning)return;const next=page+delta;if(next<0||next>=pages.length)return;turning=true;
    const book=$('letter-book');book?.classList.add('page-turn');later(()=>{page=next;renderPage();book?.classList.remove('page-turn');turning=false;},260);
  }
  on('letter-prev','click',()=>turn(-1));on('letter-next','click',()=>turn(1));
  on('letter-page','click',e=>{if(!e.target.closest('a,button')&&page<pages.length-1)turn(1);});
  on('revisit-letter','click',()=>navigate('letter',{force:true}));on('revisit-wishes','click',()=>navigate('wishes',{force:true}));
  text('ending-title',C.ending||'Sắp được gặp em rồi, hà mãaa ♡');

  // Optional local notebook. Explicit copy/share only; no hidden submissions.
  const key='hmy-tiny-notebook-v22';let saved={};try{saved=JSON.parse(storage.get(key)||'{}');}catch(_){}
  (C.notebookQuestions||[]).forEach((q,i)=>{const label=document.createElement('label');label.className='notebook-question';label.htmlFor=`answer-${i}`;label.textContent=q;
    const area=document.createElement('textarea');area.id=`answer-${i}`;area.name=`answer-${i}`;area.rows=2;area.placeholder='Em thích thì kể Tiny nghe nè…';area.value=saved[`answer-${i}`]||'';
    $('question-form')?.append(label,area);
  });
  if($('reply-message'))$('reply-message').value=saved.message||'';
  function notebookData(){const d={};(C.notebookQuestions||[]).forEach((q,i)=>d[`answer-${i}`]=$(`answer-${i}`)?.value||'');d.message=$('reply-message')?.value||'';return d;}
  function saveNotebook(){const ok=storage.set(key,JSON.stringify(notebookData()));text('reply-status',ok?'Tiny cất trong trình duyệt này rồi. Em muốn gửi anh thì bấm Chia sẻ hoặc Sao chép nha.':'Trình duyệt chưa lưu được. Em có thể sao chép hoặc tải lời nhắn nha.');}
  on('question-form','submit',e=>e.preventDefault());on('question-form','input',saveNotebook);on('reply-message','input',saveNotebook);
  on('save-reply','click',saveNotebook);
  function notebookText(){const d=notebookData();return 'Sổ nhỏ của Hà My ♡\n\n'+(C.notebookQuestions||[]).map((q,i)=>`${q}\n${d[`answer-${i}`]||'(Em để dành câu này)'}`).join('\n\n')+'\n\nLời nhắn cho anh:\n'+d.message;}
  on('copy-reply','click',async()=>{try{await navigator.clipboard.writeText(notebookText());text('reply-status','Đã sao chép. Em dán vào tin nhắn cho anh được rồi nè.');}catch(_){text('reply-status','Em tải lời nhắn bằng nút bên dưới nha.');downloadReply();}});
  function downloadReply(){const url=URL.createObjectURL(new Blob([notebookText()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Loi-nhan-cua-Ha-My.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);}
  on('share-reply','click',async()=>{if(navigator.share){try{await navigator.share({title:'Lời nhắn của Hà My ♡',text:notebookText()});text('reply-status','Lời nhắn đã được chia sẻ theo lựa chọn của em.');}catch(e){if(e.name!=='AbortError')downloadReply();}}else{downloadReply();text('reply-status','Đã tải lời nhắn. Em có thể gửi tệp cho anh.');}});
  on('notebook-open','click',()=>openDialog('notebook-dialog'));

  function reset(){
    runToken++;closeAllDialogs();endCharge();stopHeartMotion();navigationLock=false;done.clear();
    wakeDone=false;decoding=false;bouquetOpened=false;
    $('decode-field')?.replaceChildren();$('decode-field')?.classList.remove('gathered','is-scattered','is-decoding');
    show('decode-field',false);show('decode-message',false);show('decode-btn',false);show('wake-btn');if($('decode-btn'))$('decode-btn').disabled=false;
    $('bouquet-stage')?.classList.remove('bouquet-bloomed');
    heartCount=0;heartTime=0;heartNodes.forEach(h=>h.el.remove());heartNodes=[];
    $('heart-field')?.classList.remove('complete');$('tree-stage')?.replaceChildren();$('tree-stage')?.classList.remove('tree-growing');show('tree-stage',false);document.body.classList.remove('daybreak');
    text('heart-status','Những trái tim nhỏ này đều đang tìm về phía em.');
    dodges=0;const runaway=$('hmy-choice');if(runaway)for(const k of ['position','transform','left','top'])runaway.style.removeProperty(k);
    $('duan-choice')?.classList.remove('unlocked');$('duan-choice')?.setAttribute('aria-disabled','true');text('quiz-message','Tiny đứng đây làm chứng. Em cứ chọn tự nhiên =)))');
    flowers=0;charge=0;all('.meadow-flower').forEach(x=>x.remove());show('clover-wrap',false);setCharge(0);$('clover-charge')?.classList.remove('charged');
    text('meadow-message','Chạm vào đồng cỏ ba lần, gọi những bông hoa thức dậy nha.');text('clover-message','Chạm và giữ, hoặc chạm nhiều lần, để sạc đầy may mắn.');
    wishIndex=0;wishStarted=false;wishRead.clear();all('#wish-sky button[data-wish]').forEach(x=>x.remove());$('constellation')?.replaceChildren();$('wish-sky')?.classList.remove('constellation-complete');text('wish-text','Ngôi sao đầu tiên sắp tới rồi. Em đợi Tiny chút nha.');
    pieces=[4,0,7,2,8,1,5,3,6];selectedSlot=null;puzzleDone=false;renderPuzzle();$('puzzle-board')?.classList.remove('solved','show-preview');clearTimeout(previewTimer);
    pin='';hintLevel=0;vaultOpen=false;updatePin();show('vault-wrap',false);$('vault-wrap')?.classList.remove('vault-unlocked');text('vault-status','Bốn con số quen thuộc của hai đứa.');text('puzzle-message','Chạm hai mảnh ảnh để đổi chỗ cho nhau.');
    curtainOpened=false;$('planet-stage')?.classList.remove('curtain-open','awake');$('curtain-left')?.classList.remove('open');$('curtain-right')?.classList.remove('open');show('curtain-open');
    page=0;turning=false;show('letter-book',false);show('envelope-open');$('letter-book')?.classList.remove('page-turn');
    for(const id of ['wake-next','bouquet-next','heart-next','quiz-next','meadow-next','wish-next','vault-next','letter-finish'])show(id,false);
    window.Tiny?.bow(false);mood('sleep');
    navigate('wake',{force:true});
    say(C.greeting||'Tiny ngủ một xíu rồi. Em chạm nhẹ để gọi Tiny dậy nha.');
  }
  for(const id of ['restart-btn','replay-btn'])on(id,'click',reset);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&current==='hearts'&&!done.has('hearts'))startHeartMotion();});
  window.FX?.init();window.Tiny?.init();
  mood('sleep');say(C.greeting||'Suỵt… Tiny đang ngủ. Em chạm nhẹ để gọi Tiny dậy nha.');
  document.body.dataset.scene='wake';
  all('.scene[data-scene]').forEach(el=>{el.hidden=el.dataset.scene!=='wake';el.classList.toggle('active',el.dataset.scene==='wake');});
  show('back-btn',false);window.FX?.setScene('wake');
  // A read-only status accessor helps diagnosis without exposing a skip/solve API.
  window.HMY_STATUS=()=>({scene:current,hearts:heartCount,wishes:wishRead.size,puzzle:puzzleDone,vault:vaultOpen,track:trackIndex,completed:Array.from(done)});
})();
