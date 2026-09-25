(function(){
  'use strict';
  const $ = s => document.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EXEC = window.EXEC_URL || '';
  let CFG = Object.assign({}, window.DEFAULT_CONFIG || {});
  let revealsStarted = false;

  const setText = (sel, v) => { const el = $(sel); if (el && v != null && v !== '') el.textContent = v; };

  /* ── config: Sheet wins, defaults are the safety net ── */
  async function loadConfig(){
    if (EXEC){
      try{
        const r = await fetch(EXEC + '?action=config', { redirect:'follow', cache:'no-store' });
        if (r.ok){ const j = await r.json(); if (j && j.brand) CFG = Object.assign(CFG, j); }
      }catch(e){ console.warn('[invite] config offline — using repo defaults.', e); }
    }
    apply();
  }

  function apply(){
    document.title = CFG.brand + ' ' + CFG.year + ' · ' + CFG.nameOne + ' & ' + CFG.nameTwo;
    setText('#coverWord .w', CFG.brand); setText('#coverWord .yr', CFG.year);
    setText('#siteWord .w', CFG.brand);  setText('#siteWord .yr', CFG.year);
    setText('#openBtn', CFG.coverHint);
    setText('#familyOne', CFG.familyOne); setText('#familyTwo', CFG.familyTwo);
    setText('#inviteLine', CFG.inviteLine); setText('#eventLine', CFG.eventLine); setText('#ofLine', CFG.ofLine);
    setText('#nameOne', CFG.nameOne); setText('#conj', CFG.conjunction); setText('#nameTwo', CFG.nameTwo);
    setText('#colorText', CFG.colorOfDay);
    setText('#venueOne', CFG.venueLineOne); setText('#venueTwo', CFG.venueLineTwo);
    setText('#rsvpBtn', CFG.rsvpButtonLabel);

    [['#coverLogo','#coverWord'],['#siteLogo','#siteWord']].forEach(([i,w])=>{
      const img = $(i), word = $(w);
      if (CFG.logoUrl){ img.src = CFG.logoUrl; img.hidden = false; word.style.display = 'none'; }
      else { img.hidden = true; word.style.display = ''; }
    });

    const t = CFG.countdownTarget ? new Date(CFG.countdownTarget) : null;
    if (t && !isNaN(t)){
      setText('#dateMo', t.toLocaleString('en',{month:'short',timeZone:CFG.timezone||'Africa/Lagos'}).toUpperCase());
      setText('#dateD', String(t.getDate())); setText('#dateYr', String(t.getFullYear()));
    }

    $('#countSection').style.display = (CFG.countdown === 'true') ? '' : 'none';

    const btn = $('#rsvpBtn'); btn.href = CFG.rsvpUrl || (EXEC + '?rsvp=1');
    const frame = $('#rsvpFrame');
    if (CFG.showRsvpIframe === 'true' && EXEC){ frame.src = CFG.rsvpUrl || (EXEC + '?rsvp=1'); }
    else { $('#frameWrap').style.display = 'none'; }

    buildMedia();
    startCountdown();
    
    // Fallback for music if config loads AFTER user already opened the wrapper
    if (document.body.classList.contains('opened') && CFG.musicAuto === 'true' && !audio) armGesture();
  }

  /* ── responsive media: image | Drive video | YouTube ── */
  function toYouTube(u){
    const m = u.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
    return m ? 'https://www.youtube-nocookie.com/embed/' + m[1] : u;
  }
  function buildMedia(){
    const wrap = $('#heroMedia'); wrap.innerHTML = '';
    const type = CFG.heroType, url = CFG.heroUrl;
    if (!type || type === 'none' || !url){ wrap.hidden = true; return; }
    wrap.hidden = false;
    if (type === 'image'){
      const im = new Image(); im.className = 'media-img'; im.src = url; im.alt = 'A wedding moment'; im.loading = 'lazy';
      wrap.appendChild(im);
    } else {
      const fr = document.createElement('iframe');
      fr.className = 'media-frame'; fr.loading = 'lazy'; fr.allowFullscreen = true;
      fr.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
      fr.src = (type === 'youtube') ? toYouTube(url) : url; 
      fr.title = 'Wedding media';
      wrap.appendChild(fr);
    }
  }

  /* ── countdown ── */
  let target = 0;
  function startCountdown(){
    if (CFG.countdown !== 'true' || !CFG.countdownTarget) return;
    target = new Date(CFG.countdownTarget).getTime();
    tick(); setInterval(tick, 1000);
  }
  function tick(){
    if (!target) return;
    let ms = target - Date.now(); if (ms < 0) ms = 0;
    const s = Math.floor(ms/1000);
    const vals = [Math.floor(s/86400), Math.floor(s%86400/3600), Math.floor(s%3600/60), s%60];
    document.querySelectorAll('#countGrid .num').forEach((n,i)=>{
      const v = String(vals[i]).padStart(2,'0');
      if (n.textContent !== v){ n.textContent = v; n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); }
    });
    if (ms === 0) setText('#countTitle', 'Celebrating today ✦');
  }

  /* ── Music Engine ── */
  let audio = null;
  function initMusicButton(){
    const b = document.createElement('button');
    b.id = 'musicBtn'; b.className = 'music-btn'; b.type = 'button';
    b.setAttribute('aria-label','Toggle music'); b.title = 'Music';
    b.innerHTML = '<span class="note">♪</span>'; b.hidden = true;
    b.addEventListener('click', toggleMusic);
    document.body.appendChild(b);
  }
  function startMusic(){
    if (audio){ audio.play().catch(()=>{}); return; }
    if (!CFG.musicUrl) return;
    audio = new Audio(CFG.musicUrl);
    audio.loop = true;          
    audio.volume = 0;           
    audio.preload = 'auto';
    const btn = $('#musicBtn');
    audio.addEventListener('playing', ()=>{
      btn.hidden = false; btn.classList.add('on');
      const t = setInterval(()=>{ if (!audio || audio.volume >= .7){ clearInterval(t); return; }
        audio.volume = Math.min(.7, audio.volume + .04); }, 70);
    });
    audio.addEventListener('pause', ()=> btn.classList.remove('on'));
    audio.addEventListener('error', ()=>{ btn.hidden = true; });
    audio.play().catch(armGesture);   
  }
  function armGesture(){
    const kick = ()=>{ startMusic(); };
    addEventListener('pointerdown', kick, {once:true});
    addEventListener('touchend',    kick, {once:true});
    addEventListener('keydown',     kick, {once:true});
  }
  function toggleMusic(){ if (!audio){ startMusic(); return; } audio.paused ? audio.play().catch(()=>{}) : audio.pause(); }

  /* ── the wrapper opens ── */
  const cover = $('#cover');
  function initReveals(){
    if (revealsStarted) return; revealsStarted = true;
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold:.12 });
    let i = 0;
    document.querySelectorAll('[data-reveal]').forEach(el => { el.style.setProperty('--d', (i++ % 5) * 110 + 'ms'); io.observe(el); });
  }
  function openInvite(){
    if (document.body.classList.contains('opened')) return;
    document.body.classList.add('opened');
    document.body.classList.remove('loading');
    cover.classList.add('opening');
    cover.setAttribute('aria-hidden','true');
    $('#invite').setAttribute('aria-hidden','false');
    sessionStorage.setItem('ibOpened','1');
    
    // Trigger music on the exact gesture of opening
    if (CFG.musicAuto === 'true') startMusic(); 
    
    setTimeout(()=>{ cover.style.display = 'none'; initReveals(); }, reduced ? 0 : 1400);
  }
  const skip = sessionStorage.getItem('ibOpened') === '1' && location.search.indexOf('replay') === -1;
  if (skip){
    cover.style.display = 'none';
    document.body.classList.add('opened','no-anim');
    document.body.classList.remove('loading');
    $('#invite').setAttribute('aria-hidden','false');
    initReveals();
  } else {
    cover.addEventListener('click', openInvite);           
  }

  addEventListener('message', e => {
    const d = e.data;
    if (d && d.ibukunayo === 'height' && typeof d.h === 'number'){
      const f = $('#rsvpFrame');
      if (f && e.source === f.contentWindow) f.style.height = Math.max(520, d.h + 24) + 'px';
    }
  });

  initMusicButton();
  loadConfig();
})();
