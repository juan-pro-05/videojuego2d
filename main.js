(() => {
  const ASSETS = {
    bg: 'assets/bg_halloween.jpg',
    sprites: [
      'assets/sprite_calavera1.png',
      'assets/sprite_calavera2.png',
      'assets/sprite_pumpkin1.png',
      'assets/sprite_fantasma1.png'
    ],
    music: 'assets/bg_music.mp3'
  };

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let score = 0;
  const scoreEl = document.getElementById('score');

  // Música
  const audio = new Audio(ASSETS.music);
  audio.loop = true;
  audio.volume = 0.45;
  const toggleMusicBtn = document.getElementById('toggleMusic');
  toggleMusicBtn.addEventListener('click', () => {
    if (audio.paused) audio.play().catch(()=>{}); else audio.pause();
  });

  // Ajustar canvas a tamaño real de ventana
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const images = {};
  const toLoad = [ASSETS.bg, ...ASSETS.sprites];
  let loaded = 0;
  toLoad.forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      loaded++;
      if (loaded === toLoad.length) startGame();
    };
    images[src] = img;
  });

  const objects = [];
  const spawnIntervalMs = 900;
  let lastSpawn = 0;
  const rand = (a,b) => Math.random()*(b-a)+a;
  const choice = arr => arr[Math.floor(Math.random()*arr.length)];
  const movementTypes = ['up','down','left','right','diag','diag2','circular','zigzag'];

  function spawnObject() {
    const imgSrc = choice(ASSETS.sprites);
    const img = images[imgSrc];
    const scale = rand(0.55,0.95);
    const w = Math.round(img.width * scale * 0.55);
    const h = Math.round(img.height * scale * 0.55);

    let x = rand(20, canvas.width-20);
    let y = rand(20, canvas.height-20);

    const movementType = choice(movementTypes);
    const speed = rand(0.25,1.6);
    let vx=0, vy=0, angle=0, radius=0, centerX=0, centerY=0;

    switch(movementType){
      case 'up': vy=-speed; break;
      case 'down': vy=speed; break;
      case 'left': vx=-speed; break;
      case 'right': vx=speed; break;
      case 'diag': vx=speed*0.8; vy=speed*0.6; break;
      case 'diag2': vx=-speed*0.9; vy=speed*0.5; break;
      case 'zigzag': vx=rand(-0.8,0.8); vy=rand(-0.8,0.8); break;
      case 'circular':
        centerX = x + rand(-60,60);
        centerY = y + rand(-40,40);
        angle = rand(0,Math.PI*2);
        radius = rand(30,110);
        break;
      default: vx=rand(-1,1); vy=rand(-1,1);
    }

    objects.push({img,w,h,x,y,movementType,vx,vy,speed,angle,radius,centerX,centerY,born:Date.now(),lifeMs:rand(7000,20000)});
  }

  function update(dt){
    const now = Date.now();
    for(let i=objects.length-1;i>=0;i--){
      const o = objects[i];
      switch(o.movementType){
        case 'circular':
          o.angle += 0.015*(o.speed*1.6);
          o.x = o.centerX + Math.cos(o.angle)*o.radius;
          o.y = o.centerY + Math.sin(o.angle)*o.radius;
          break;
        case 'zigzag':
          o.vx += Math.sin((now+i*100)/400)*0.02;
          o.vy += Math.cos((now+i*100)/350)*0.02;
          o.x += o.vx*(o.speed*1.2);
          o.y += o.vy*(o.speed*1.2);
          break;
        default:
          o.x += o.vx*(o.speed*1.8);
          o.y += o.vy*(o.speed*1.8);
      }
      if(Math.random()<0.01){ o.x+=rand(-0.8,0.8); o.y+=rand(-0.8,0.8); }
      if(now-o.born>o.lifeMs || o.x<-200 || o.x>canvas.width+200 || o.y<-200 || o.y>canvas.height+200) objects.splice(i,1);
    }
  }

  function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const bg = images[ASSETS.bg];
    if(bg) ctx.drawImage(bg,0,0,canvas.width,canvas.height);
    objects.forEach(o=>{
      ctx.save();
      ctx.globalAlpha=0.98;
      ctx.drawImage(o.img,o.x,o.y,o.w,o.h);
      ctx.restore();
    });
  }

  function getMousePos(evt){
    return {x: evt.clientX, y: evt.clientY};
  }

  canvas.addEventListener('click', evt=>{
    const m = getMousePos(evt);
    for(let i=objects.length-1;i>=0;i--){
      const o=objects[i];
      if(m.x>=o.x && m.x<=o.x+o.w && m.y>=o.y && m.y<=o.y+o.h){
        objects.splice(i,1);
        let delta = Math.round(5+(100-(o.w+o.h)/2)/8+(o.speed*6));
        score+=delta;
        scoreEl.textContent=score;
        animateClickFeedback(m.x,m.y);
        break;
      }
    }
  });

  const clickFeedbacks=[];
  function animateClickFeedback(x,y){ clickFeedbacks.push({x,y,r:6,alpha:1,born:Date.now()}); }
  function renderClickFeedbacks(){
    for(let i=clickFeedbacks.length-1;i>=0;i--){
      const f=clickFeedbacks[i],age=Date.now()-f.born;
      if(age>600){ clickFeedbacks.splice(i,1); continue; }
      ctx.save();
      ctx.beginPath();
      ctx.arc(f.x,f.y,f.r+(age/40),0,Math.PI*2);
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth=2;
      ctx.stroke();
      ctx.restore();
    }
  }

  let lastTime=performance.now();
  function loop(t){
    const dt=t-lastTime;
    lastTime=t;
    if(t-lastSpawn>spawnIntervalMs){
      const count = Math.random()<0.08?2:1;
      for(let i=0;i<count;i++) spawnObject();
      lastSpawn=t;
    }
    update(dt);
    render();
    renderClickFeedbacks();
    requestAnimationFrame(loop);
  }

  function startGame(){
    for(let i=0;i<6;i++) spawnObject();
    requestAnimationFrame(loop);
  }
})();