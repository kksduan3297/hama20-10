/* A single, bounded particle canvas. Nothing here intercepts a touch. */
(() => {
  'use strict';
  let canvas,ctx,width=1,height=1,dpr=1,ready=false,frame=0,last=0,particles=[],pointerDown=false,lastTrail=0,flash=null,scene='wake';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cap=reduced?70:360;
  const colors=['#f784b0','#ffb4ce','#e95b96','#fff3d1','#b5eff1','#f8bdd6'];
  const sprites={};
  const rand=(a,b)=>a+Math.random()*(b-a);
  function heartPath(c,x,y,s) { c.beginPath(); c.moveTo(x,y+s*.3);c.bezierCurveTo(x-s*.65,y-s*.28,x-s*.42,y-s*.72,x,y-s*.37);c.bezierCurveTo(x+s*.42,y-s*.72,x+s*.65,y-s*.28,x,y+s*.3);c.fill(); }
  function sprite(type,color) {
    const key=type+color;if(sprites[key])return sprites[key];
    const b=document.createElement('canvas');b.width=b.height=80;const c=b.getContext('2d');c.translate(40,40);
    c.fillStyle=color;
    if(type==='heart') {c.shadowColor=color;c.shadowBlur=8;heartPath(c,0,0,47);c.shadowBlur=0;c.fillStyle='#ffffff77';c.beginPath();c.ellipse(-10,-14,4,7,-.6,0,Math.PI*2);c.fill();}
    else if(type==='flower') {
      const rose=Math.random()>.58;
      if(rose){for(let k=0;k<3;k++){for(let j=0;j<6;j++){c.save();c.rotate(j*Math.PI/3+k*.4);c.fillStyle=k===0?color:k===1?'#ffd0e0':'#fff0f4';c.beginPath();c.ellipse(0,12-k*3,15-k*3,20-k*4,0,0,Math.PI*2);c.fill();c.restore();}}c.fillStyle='#ed9cb6';c.beginPath();c.arc(0,0,5,0,Math.PI*2);c.fill();}
      else {for(let j=0;j<8;j++){c.save();c.rotate(j*Math.PI/4);c.fillStyle=color==='#fff3d1'?'#fffdf5':color;c.beginPath();c.ellipse(0,16,7,15,0,0,Math.PI*2);c.fill();c.restore();}c.fillStyle='#f1c472';c.beginPath();c.arc(0,0,7,0,Math.PI*2);c.fill();c.fillStyle='#fff8c9';c.beginPath();c.arc(-2,-2,2,0,Math.PI*2);c.fill();}
    } else {
      c.shadowColor=color;c.shadowBlur=10;c.beginPath();for(let i=0;i<8;i++){let a=i*Math.PI/4,r=i%2?6:25;let x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}c.closePath();c.fill();
    }
    sprites[key]=b;return b;
  }
  function resize(){if(!canvas)return;width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}
  function init(){
    if(ready)return;ready=true;
    canvas=document.getElementById('fx-canvas')||document.createElement('canvas');canvas.id='fx-canvas';canvas.setAttribute('aria-hidden','true');
    Object.assign(canvas.style,{position:'fixed',inset:'0',pointerEvents:'none',zIndex:'60',display:'block'});
    if(!canvas.parentNode)document.body.append(canvas);ctx=canvas.getContext('2d',{alpha:true});resize();
    addEventListener('resize',resize,{passive:true});
    document.addEventListener('pointerdown',e=>{pointerDown=true;trail(e.clientX,e.clientY);const target=e.target.closest('button');if(target&&!target.closest('dialog')&&(target.matches('.primary-button,.primary,[data-next],#wake-btn,#decode-btn,#bouquet-open,#bow-btn,#clover-charge')||target.dataset.burst!==undefined))burst(e.clientX,e.clientY,{type:'heart',count:reduced?4:10});},{passive:true});
    document.addEventListener('pointermove',e=>{if(pointerDown)trail(e.clientX,e.clientY);},{passive:true});
    ['pointerup','pointercancel','blur'].forEach(name=>addEventListener(name,()=>{pointerDown=false;},{passive:true}));
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else if(particles.length||flash)run();});
  }
  function run(){if(!frame&&!document.hidden)frame=requestAnimationFrame(draw);}
  function trail(x,y){const now=performance.now();if(now-lastTrail<(reduced?160:45))return;lastTrail=now;for(let i=0;i<(reduced?1:2);i++)add({x:x+rand(-6,6),y:y+rand(-5,5),vx:rand(-18,18),vy:rand(-60,-25),size:rand(13,24),life:rand(.65,1.05),gravity:-8,type:'heart',color:colors[Math.floor(rand(0,3))],spin:rand(-1,1)});run();}
  function add(p){if(particles.length>=cap)particles.shift();p.age=0;p.angle=rand(-.5,.5);p.max=p.life;particles.push(p);}
  function burst(x,y,options={}){
    if(!ready)init();x=Number.isFinite(x)?x:width/2;y=Number.isFinite(y)?y:height/2;
    const type=options.type||'heart';const n=Math.min(options.count||18,reduced?15:240);
    for(let i=0;i<n;i++){const a=rand(-Math.PI,Math.PI),speed=rand(65,240);add({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-60,size:rand(type==='flower'?17:9,type==='flower'?37:26),life:rand(.7,1.7),gravity:80,type,color:colors[Math.floor(rand(0,colors.length))],spin:rand(-3,3)});}run();
  }
  function flowerRain(){
    if(!ready)init();const n=reduced?35:Math.min(290,Math.round(width*height/1800));
    burst(width/2,height*.44,{type:'flower',count:reduced?20:95});
    for(let i=0;i<n;i++)add({x:rand(-40,width+40),y:rand(-height*.8,height*.65),vx:rand(-35,35),vy:rand(45,145),size:rand(22,52),life:rand(3.5,6.5),gravity:16,type:'flower',color:colors[Math.floor(rand(0,4))],spin:rand(-1.6,1.6),sway:rand(10,35)});
    flash={type:'flowers',age:0,duration:1.1};run();
  }
  function supernova(){
    if(!ready)init();
    const field=document.createElement('canvas');field.width=Math.max(2,width);field.height=Math.max(2,height);const s=field.getContext('2d');
    for(let i=0;i<(reduced?180:1900);i++){const angle=rand(0,Math.PI*2),r=Math.pow(Math.random(),.55)*Math.hypot(width,height)*.63;const x=width/2+Math.cos(angle)*r,y=height*.43+Math.sin(angle)*r;const sz=rand(.4,2.1);s.fillStyle=colors[i%colors.length];s.globalAlpha=rand(.2,1);s.fillRect(x,y,sz,sz);}
    flash={type:'nova',image:field,age:0,duration:reduced?1:2.7};
    const n=reduced?35:250;for(let i=0;i<n;i++){const a=rand(0,Math.PI*2),speed=rand(65,420);add({x:width/2,y:height*.43,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,size:rand(5,19),life:rand(1.5,3.3),gravity:0,type:'star',color:colors[i%colors.length],spin:rand(-1,1)});}run();
  }
  function transition(){if(!ready)init();flash={type:'transition',age:0,duration:reduced?.18:.58};run();}
  function setScene(name){scene=name||'wake';if(canvas)canvas.dataset.scene=scene;}
  function draw(time){
    frame=0;const dt=last?Math.min((time-last)/1000,.04):.016;last=time;ctx.clearRect(0,0,width,height);
    if(flash){flash.age+=dt;const t=flash.age/flash.duration;if(t>=1)flash=null;else{
      ctx.save();if(flash.type==='nova'){const scale=.08+1.6*Math.min(1,t*1.8);ctx.translate(width/2,height*.43);ctx.scale(scale,scale);ctx.globalAlpha=Math.sin(Math.PI*Math.min(1,t*1.15))*.9;ctx.drawImage(flash.image,-width/2,-height*.43,width,height);ctx.restore();ctx.save();const g=ctx.createRadialGradient(width/2,height*.43,0,width/2,height*.43,Math.max(width,height)*.45);g.addColorStop(0,`rgba(255,250,240,${Math.max(0,1-t*3)*.9})`);g.addColorStop(.3,`rgba(241,166,222,${Math.max(0,1-t*2)*.35})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
      }else if(flash.type==='transition'){ctx.globalAlpha=Math.sin(t*Math.PI)*.28;ctx.fillStyle='#ffe8ee';ctx.fillRect(0,0,width,height);}else{ctx.globalAlpha=Math.sin(t*Math.PI)*.3;ctx.fillStyle='#ffe3ed';ctx.fillRect(0,0,width,height);}ctx.restore();
    }}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;if(p.age>=p.max){particles.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.gravity||0)*dt;p.angle+=p.spin*dt;const fade=Math.min(1,p.age*8,Math.max(0,(p.max-p.age)*1.8));const x=p.x+(p.sway?Math.sin(p.age*1.8)*p.sway:0);ctx.save();ctx.globalAlpha=fade;ctx.translate(x,p.y);ctx.rotate(p.angle);const sz=p.size;ctx.drawImage(sprite(p.type,p.color),-sz/2,-sz/2,sz,sz);ctx.restore();}
    if(particles.length||flash)run();else last=0;
  }
  window.FX=Object.freeze({init,burst,supernova,flowerRain,transition,setScene});
})();
