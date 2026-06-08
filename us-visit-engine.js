/* ════════════════════════════════════════════════════════════════
   SMARTWAY STORE-VISIT LP — ENGINE  (hosted on GitHub / jsDelivr)
   Reads <script id="visit-data" type="application/json"> from the
   Webflow embed, builds the whole page into <div id="app">, then
   wires up all interactions.
   ──────────────────────────────────────────────────────────────
   DYNAMIC per visit : retailer, city, date, stores, logos, vimeoId,
                       problems[], gallery[]
   STATIC (same for all): rep = Christophe, calendar, demo visuals,
                       GPS markers, simulator, Vallarta, deploy, footer
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── asset base ─── */
  var IC = 'https://25665345.fs1.hubspotusercontent-eu1.net/hubfs/25665345/ABM%20Productions/';
  var ICN = IC + 'Smartway%20Icons/';
  var SW_WHITE = IC + 'Smartway%20logo%20whit%20epng.png';

  /* ─── static config (rep is always Christophe on US visits) ─── */
  var REP_NAME = 'Christophe';
  var CALENDAR = 'https://meetings-eu1.hubspot.com/christophe-menez?embed=true';
  var AISLE_IMG = IC + 'rayon%20png.png';
  var DEPLOY_BG = IC + 'image%203%20sedt.png';
  var CTA_BG = IC + 'Background%20spain.png';
  var VALLARTA_LOGO = IC + 'Vallarta%20logo%20black.png';
  var VALLARTA_VIDEO = IC + 'Steve%20video%20Vallarta%20loop.mp4';
  var STEVE_AVATAR = IC + 'steve%20vallarta.png';
  var ZEBRA = IC + 'zebra%20png.png';
  var TRANSFORM_VIDEO = IC + 'video%20hero%20hanshow.mp4';

  /* ─── read CMS data ───
     Each field lives in a hidden <div id="cms-xxx"> inside the Webflow embed.
     textContent is HTML-entity-decoded by the browser, so JSON survives. */
  function cms(id) { var e = document.getElementById('cms-' + id); return e ? e.textContent.trim() : ''; }
  function cmsJSON(id) { var t = cms(id); if (!t) return []; try { return JSON.parse(t); } catch (e) { console.error('[Smartway] JSON invalid in cms-' + id + ':', e); return []; } }

  var d = {
    retailer: cms('retailer') || 'your store',
    city: cms('city'),
    date: cms('date'),
    stores: cms('stores'),
    logoWhite: cms('logo-white') || SW_WHITE,
    logoBlack: cms('logo-black'),
    vimeoId: cms('vimeo-id'),
    problems: cmsJSON('problems'),
    gallery: cmsJSON('gallery')
  };

  /* featured proof = gallery item flagged featured, else first */
  var featured = d.gallery.filter(function (g) { return g && g.featured; })[0] || d.gallery[0] || {};
  var galleryRest = d.gallery.filter(function (g) { return g !== featured; });

  /* ─── static lists ─── */
  var DEPTS = [
    { name: 'DAIRY', c: '8 · 3', hl: true },
    { name: 'MEAT', c: '7 · 6' },
    { name: 'DELI', c: '0 · 0' },
    { name: 'READY MEALS', c: '231 · 3' }
  ];
  var PRODUCTS = [
    { emoji: '🧀', name: 'Fresh Cheese', exp: 'today', pos: { top: '28%', left: '10%' } },
    { emoji: '🥛', name: 'Whole Milk', exp: 'j3', pos: { top: '52%', left: '16%' } },
    { emoji: '🧈', name: 'Butter', exp: 'j3', pos: { top: '33%', left: '25%' } },
    { emoji: '🥓', name: 'Bacon', exp: 'j3', pos: { top: '42%', left: '34%' } },
    { emoji: '🥧', name: 'Pork Pie', exp: 'today', pos: { top: '32%', right: '8%' } },
    { emoji: '🥗', name: 'Mixed Salad', exp: 'j3', pos: { top: '52%', right: '18%' } },
    { emoji: '🍰', name: 'Trifle', exp: 'today', pos: { top: '38%', right: '28%' } },
    { emoji: '🍗', name: 'Roast Chicken', exp: 'j3', pos: { top: '48%', right: '36%' } }
  ];
  var DEPLOY = [
    { icon: 'clock', title: 'Setup in 2 hours. No IT integration.', desc: 'Just 2 hours per department with a single initial inventory pass. No technical project, your team is live the same day.' },
    { icon: 'users', title: 'On-site experts', desc: 'Our team stays on the ground with your staff throughout launch.' },
    { icon: 'device', title: 'Use your own hardware', desc: 'Runs perfectly on your existing Zebra PDAs. No new devices.' }
  ];
  var dcIcons = {
    clock: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    users: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    device: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>'
  };
  var statusSVG = {
    critical: '<svg class="ps-icon" viewBox="0 0 16 16" fill="none"><path d="M8 1L1 14h14L8 1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><line x1="8" y1="6" x2="8" y2="9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.5" r=".8" fill="currentColor"/></svg>',
    warning: '<svg class="ps-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="5" x2="8" y2="8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="10.8" r=".8" fill="currentColor"/></svg>'
  };
  var statusLabel = { critical: 'To address', warning: 'Watch' };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function attr(s) { return esc(s).replace(/"/g, '&quot;'); }

  /* ─── build dynamic chunks ─── */
  var problemCards = d.problems.map(function (c, i) {
    return '<div class="prob-card r d' + (i + 1) + '"><img class="prob-card-img" src="' + attr(c.img) + '" alt="' + attr(c.cat) + '">'
      + '<div class="prob-card-body"><div class="prob-status ' + (c.status === 'warning' ? 'warning' : 'critical') + '">'
      + (statusSVG[c.status] || statusSVG.critical) + ' ' + (statusLabel[c.status] || 'To address') + '</div>'
      + '<div class="prob-card-cat">' + esc(c.cat) + '</div><div class="prob-card-title">' + esc(c.title) + '</div>'
      + '<div class="prob-card-text">' + esc(c.text) + '</div></div></div>';
  }).join('');

  var galleryItems = galleryRest.map(function (g, i) {
    return '<div class="gallery-item r d' + (i % 4 + 1) + '" data-url="' + attr(g.url) + '" data-cap="' + attr(g.caption) + '">'
      + '<img src="' + attr(g.url) + '" alt="' + attr(g.caption) + '"><div class="gi-caption">' + esc(g.caption) + '</div></div>';
  }).join('');

  var deployCards = DEPLOY.map(function (c, i) {
    return '<div class="deploy-card r d' + (i + 1) + '"><div class="dc-icon">' + (dcIcons[c.icon] || dcIcons.clock) + '</div>'
      + '<div class="dc-title">' + esc(c.title) + '</div><div class="dc-desc">' + esc(c.desc) + '</div></div>';
  }).join('');

  var depts = DEPTS.map(function (x) {
    return '<div class="pda-ws-card' + (x.hl ? ' highlight' : '') + '"><span class="ws-name">' + x.name + '</span><span class="ws-count">' + x.c + '</span></div>';
  }).join('');

  /* transform-left hover photos = first 3 gallery images */
  function gImg(i) { return (d.gallery[i] && d.gallery[i].url) || ''; }
  function gCap(i) { return (d.gallery[i] && d.gallery[i].caption) || ''; }

  /* ════════════════ PAGE HTML ════════════════ */
  var html = '';

  /* NAV */
  html +=
    '<nav class="nav" id="nav"><div class="nav-left">'
    + '<img src="' + SW_WHITE + '" alt="Smartway"><span class="nav-x">×</span>'
    + '<img src="' + attr(d.logoWhite) + '" alt="' + attr(d.retailer) + '" style="height:26px;object-fit:contain">'
    + '<span class="nav-sep">|</span><span class="nav-meta">Store visit · ' + esc(d.city) + ' · ' + esc(d.date) + '</span>'
    + '</div><div class="nav-right"><a href="#calendar" class="nav-cta">Let\'s talk →</a></div></nav>';

  /* HERO */
  html +=
    '<section class="s-hero" id="hero"><div class="hero-inner"><div class="hero-left">'
    + '<div class="hero-logos"><img src="' + SW_WHITE + '" alt="Smartway" style="filter:brightness(0) saturate(100%)">'
    + '<span class="hx" style="color:rgba(36,60,54,.35)">×</span>'
    + '<img src="' + attr(d.logoBlack) + '" alt="' + attr(d.retailer) + '" style="height:38px;object-fit:contain"></div>'
    + '<h1 class="hero-h1">We visited ' + esc(d.retailer) + ', and we see real room to <em>protect your margin</em>.</h1>'
    + '<p class="hero-sub">Our team spent time in your store. Here\'s what we observed, the proof we gathered, and how a few changes to date management could give your team time back and recover margin, every single day.</p>'
    + '<div class="hero-meta">'
    + '<div class="hero-meta-item"><img src="' + ICN + 'Signage-5--Streamline-Core.svg" alt=""> <b>' + esc(d.city) + '</b></div>'
    + '<div class="hero-meta-item"><img src="' + ICN + 'Watch-1--Streamline-Core.svg" alt=""> <b>' + esc(d.date) + '</b></div>'
    + '<div class="hero-meta-item"><img src="' + ICN + 'Mall--Streamline-Core.svg" alt=""> <b>' + esc(d.stores) + '</b> stores</div>'
    + '</div><div class="hero-ctas"><a href="#calendar" class="btn btn-g">Debrief this visit</a>'
    + '<a href="#problem" class="btn btn-o">See what we found ↓</a></div></div>'
    + '<div class="hero-right"><div class="hero-video-card"><div class="hero-video-frame">'
    + (d.vimeoId
        ? '<iframe id="heroVimeo" src="https://player.vimeo.com/video/' + attr(d.vimeoId) + '&badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&muted=1&loop=1&background=1&playsinline=1" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" title="Store visit"></iframe>'
        : '')
    + '</div><div class="hero-video-label"><span>A word from ' + REP_NAME + '</span>'
    + '<span class="hvl-date">Visit of ' + esc(d.date) + '</span></div></div></div></div></section>';

  /* PROBLEM */
  html +=
    '<section class="s-problem" id="problem"><div class="inner"><div class="prob-head">'
    + '<div class="r" style="display:flex;justify-content:center;margin-bottom:18px"><img src="' + attr(d.logoBlack) + '" alt="' + attr(d.retailer) + '" style="height:34px;object-fit:contain"></div>'
    + '<div class="prob-line r">From our visit · ' + esc(d.retailer) + ', ' + esc(d.city) + ' · ' + esc(d.date) + '</div>'
    + '<h2 class="s-title r">Three things we saw on the shelves</h2>'
    + '<p class="s-desc c r">None of this is unusual for a store managing dates manually. But each one quietly costs a little margin and a lot of time, every day.</p>'
    + '</div><div class="prob-grid">' + problemCards + '</div></div></section>';

  /* PROOF */
  html +=
    '<section class="s-proof" id="proof"><div class="inner"><div class="proof-head">'
    + '<div class="s-tag light r">● The evidence</div><h2 class="s-title r">What the photos show</h2>'
    + '<p class="s-desc c r">All taken during our visit on ' + esc(d.date) + '. Tap any photo to enlarge.</p></div>'
    + '<div class="proof-feature r" data-url="' + attr(featured.url) + '" data-cap="' + attr(featured.caption || featured.title) + '">'
    + '<div class="proof-feature-img"><span class="proof-feature-tag">● Photo evidence</span>'
    + '<img src="' + attr(featured.url) + '" alt="' + attr(featured.title || featured.caption) + '"></div>'
    + '<div class="proof-feature-body"><div class="pf-eyebrow">The clearest example</div>'
    + '<h3>' + esc(featured.title || 'What we found on the shelf') + '</h3>'
    + '<p>' + esc(featured.text || featured.caption || '') + '</p></div></div>'
    + '<div class="gallery-grid">' + galleryItems + '</div></div></section>';

  /* TRANSFORM */
  html +=
    '<section class="s-transform" id="transform"><div class="inner"><div class="tr-head">'
    + '<span class="tr-label r">From problem to advantage</span>'
    + '<h2 class="tr-title r">The same three points, <span class="accent">turned around</span></h2></div>'
    + '<div class="tr-stakes">'
    /* left */
    + '<div class="tr-col r d1"><div class="tr-col-head"><div class="ico"><img src="' + IC + 'Target--Streamline-Core@4x.png" alt=""></div>'
    + '<div class="ttl"><span>What we saw</span><h3>Today · by hand</h3></div></div>'
    + '<div class="tr-photo" id="trPhoto" data-tag="' + attr(gCap(0)) + '"><img id="trPhotoImg" src="' + attr(gImg(0)) + '" alt=""><span class="tr-photo__zoom" aria-hidden="true">⤢</span></div>'
    + '<ul class="tr-list">'
    + '<li data-photo="' + attr(gImg(0)) + '" data-tag="' + attr(gCap(0)) + '"><div><strong>Every product checked, aisle by aisle.</strong><span>One person\'s full day spent walking the shelves for date checks.</span></div></li>'
    + '<li data-photo="' + attr(gImg(1)) + '" data-tag="' + attr(gCap(1)) + '"><div><strong>Expired stock reaches the shelf.</strong><span>A product one day past Best Before, still on sale at full price.</span></div></li>'
    + '<li data-photo="' + attr(gImg(2)) + '" data-tag="' + attr(gCap(2)) + '"><div><strong>Markdowns run on the clock.</strong><span>Fixed 50% / 75% / 90%, applied by hand. Margin given away too early.</span></div></li>'
    + '</ul></div>'
    /* right */
    + '<div class="tr-col tr-col--dark r d2"><div class="tr-col-head"><div class="ico"><img src="' + IC + 'Ai-Upscale-Spark--Streamline-Core.png" alt=""></div>'
    + '<div class="ttl"><span>What changes with Smartway</span><h3>Tomorrow · supported</h3></div></div>'
    + '<div class="tr-media"><video autoplay muted loop playsinline crossorigin="anonymous" preload="metadata"><source src="' + TRANSFORM_VIDEO + '" type="video/mp4"></video>'
    + '<div class="tr-media-meta"><span class="tr-media-tag">Inside a store with Smartway</span><span class="tr-media-sub">The team is guided straight to the right product, in the right aisle.</span></div></div>'
    + '<ul class="tr-list">'
    + '<li><div><strong>Check only the ~4% that actually needs a look.</strong><span>A daily shortlist replaces the full aisle-by-aisle walk.</span></div></li>'
    + '<li><div><strong>Zero expired on the shelf.</strong><span>Every short date is flagged and located before it hits, never the day after.</span></div></li>'
    + '<li><div><strong>The right markdown, at the right moment.</strong><span>Timing and depth set per product, not by the clock, so margin is recovered, not given away.</span></div></li>'
    + '</ul></div></div></div></section>';

  /* DEMO */
  html +=
    '<section class="s-demo" id="demo"><div class="demo-intro"><div class="inner">'
    + '<div class="s-tag light r">● Your GPS for short-dated products</div>'
    + '<h2 class="s-title r" style="color:var(--white)">In an aisle with over 1,000 SKUs, Smartway\'s alert methodology required only <em>8 minutes</em> of digitally directed activity.</h2>'
    + '<p class="s-desc c r">Like a GPS guides your car, smartdetection guides your team to the right product, at the right time, in the right aisle.</p>'
    + '<div class="demo-replay-mobile r"><button id="demoReplay">↻ Replay demo</button></div></div></div>'
    + '<div class="demo-scene"><div class="aisle-photo" id="aislePhoto"><img src="' + AISLE_IMG + '" alt="Aisle">'
    + '<div class="aisle-overlay-top"></div><div class="aisle-overlay-bottom"></div><div class="aisle-scan" id="aisleScan"></div>'
    + '<button class="demo-replay show" id="demoReplayDesktop">↻ Replay demo</button>'
    + '<div class="pda-overlay"><div class="pda-glow"></div><div class="pda-device"><img src="' + ZEBRA + '" alt="PDA">'
    + '<div class="pda-screen-content"><div class="pda-app-bar"><div class="pab-left"><img src="' + attr(d.logoBlack) + '" alt="" style="height:7px;object-fit:contain"><span>smartdetection</span></div>'
    + '<div class="pab-right"><span class="pab-live"></span><span class="pab-live-txt">Live</span></div></div>'
    + '<div class="pda-screen"><div class="pda-ws-title">Short dates today</div><div class="pda-ws-date" id="pdaDate"></div>'
    + '<div id="pdaDepts">' + depts + '</div></div></div></div></div></div></div>'
    + '<div class="demo-overlay-stats"><div class="demo-stats-bar">'
    + '<div class="demo-stat"><div class="dsv" id="dSP">0</div><div class="dsl">products detected</div></div>'
    + '<div class="demo-stat"><div class="dsv" id="dST">0.0s</div><div class="dsl">detection time</div></div>'
    + '<div class="demo-stat"><div class="dsv" id="dSA">0</div><div class="dsl">aisles scanned</div></div></div>'
    + '<div class="demo-result" id="demoResult"></div></div></section>';

  /* mobile KPIs */
  html +=
    '<div class="demo-stats-mobile">'
    + '<div class="demo-stat"><span class="dsv" id="dSPm">0</span><span class="dsl">products detected</span></div>'
    + '<div class="demo-stat"><span class="dsv" id="dSTm">0.0s</span><span class="dsl">detection time</span></div>'
    + '<div class="demo-stat"><span class="dsv" id="dSAm">0</span><span class="dsl">aisles scanned</span></div></div>';

  /* 4 STEPS */
  var STEPS = [
    { n: '01', ic: 'Task-List--Streamline-Core', cls: 'top-crop', vid: '<source src="' + IC + 'GIF%201%20Flash%20Evo.mp4" type="video/mp4">', vcls: 'top', t: 'Open PDA, see today\'s alerts', dsc: 'Only the ~4% of products that actually need attention today.' },
    { n: '02', ic: 'Bolt-Charging-Power--Streamline-Core', cls: '', vid: '<source src="' + IC + 'GPS%20Detection.mp4" type="video/mp4">', vcls: 'zoom', t: 'Instantly locate the nearest short date', dsc: 'The PDA guides your team directly to the right shelf. No walking, no searching.' },
    { n: '03', ic: 'Watch-1--Streamline-Core', cls: '', vid: '<source src="' + IC + 'GIF%20flash%20evo%203.mp4" type="video/mp4">', vcls: '', t: 'Check and enter the shortest date', dsc: '4 to 5 seconds. The AI calculates shelf life and markdown timing.' },
    { n: '04', ic: 'Target--Streamline-Core', cls: '', vid: '<source src="' + IC + 'Step%204%20detection%20US.mp4" type="video/mp4">', vcls: '', t: 'Remove, markdown or donate', dsc: 'Action confirmed. Next product. Done.' }
  ];
  var stepCards = STEPS.map(function (s, i) {
    return '<div class="step-wrap' + (i === 0 ? ' active' : '') + '" data-wrap="' + i + '"><div class="step-outer-hd">'
      + '<span class="step-big-num">' + s.n + '</span><img class="step-outer-icon" src="' + ICN + s.ic + '.svg" alt=""></div>'
      + '<div class="demo-step r d' + (i + 1) + (i === 0 ? ' active' : '') + '" data-step="' + i + '">'
      + '<div class="vid-clip ' + s.cls + '"><video class="demo-step-vid ' + s.vcls + '" muted playsinline preload="auto" crossorigin="anonymous">' + s.vid + '</video></div>'
      + '<div class="demo-step-body"><div class="demo-step-title">' + s.t + '</div><div class="demo-step-desc">' + s.dsc + '</div></div></div></div>';
  }).join('');
  html +=
    '<div class="demo-hiw"><div class="demo-hiw-inner"><div class="demo-hiw-title">'
    + '<h3>How does it work?</h3><p>Empower your teams to check dates <em style="-webkit-text-fill-color:transparent;background:linear-gradient(135deg,var(--lg),#8FD88F);-webkit-background-clip:text;background-clip:text;font-style:normal;font-weight:600">4x faster</em></p></div>'
    + '<div class="demo-steps">' + stepCards + '</div></div></div>';

  /* IMPACT + SIMULATOR (fully static) */
  html +=
    '<section class="s-opp noise" id="opportunity"><div class="opp-inner">'
    + '<h2 class="opp-headline r">Managing short dates costs your team hours every day and shrinks your margin.</h2>'
    + '<p class="opp-with-smartway r">With Smartway</p>'
    + '<div class="opp-kpis r">'
    + '<div class="opp-kpi"><div class="kpi-val">0 <span style="font-size:.45em;font-weight:700;letter-spacing:-.01em">expired</span></div><div class="kpi-label">Products on your shelves</div><div class="kpi-sub">Guaranteed. Every aisle, every day.</div></div>'
    + '<div class="opp-kpi"><div class="kpi-val">-55%</div><div class="kpi-label">Time spent on short-date processing</div><div class="kpi-sub">Average across Smartway deployments</div></div>'
    + '<div class="opp-kpi"><div class="kpi-val">-10%</div><div class="kpi-label">Shrink reduction</div><div class="kpi-sub">Net margin recovered, from day one</div></div>'
    + '</div>'
    + '<div class="sim-box r"><div class="sim-head"><h3>How much do you leave on the shelf?</h3><p>Adjust the sliders to match your store profile. Results update instantly.</p></div>'
    + '<div class="sim-grid" style="margin-top:0">'
    /* panel 1 */
    + '<div class="sim-panel"><div class="sim-panel-label"><img src="' + ICN + 'Mall--Streamline-Core.svg" alt="">Your store profile</div>'
    + '<div class="sim-slider-group"><div class="sim-slider-header"><span class="sim-slider-lbl">Annual revenue per store</span><span class="sim-slider-val" id="simVRevenue">$5M</span></div><input type="range" class="sim-range" id="simRevenue" min="2" max="50" step="1" value="5"><div class="sim-range-bounds"><span>$2M</span><span>$50M</span></div></div>'
    + '<div class="sim-slider-group"><div class="sim-slider-header"><span class="sim-slider-lbl">Shrink rate</span><span class="sim-slider-val" id="simVShrink">2%</span></div><input type="range" class="sim-range" id="simShrink" min="1" max="5" step="0.5" value="2"><div class="sim-range-bounds"><span>1%</span><span>5%</span></div></div>'
    + '<div class="sim-slider-group"><div class="sim-slider-header"><span class="sim-slider-lbl">Number of stores</span><span class="sim-slider-val" id="simVStores">10</span></div><input type="range" class="sim-range" id="simStores" min="1" max="200" step="1" value="10"><div class="sim-range-bounds"><span>1</span><span>200</span></div></div>'
    + '<div class="sim-slider-group"><div class="sim-slider-header"><span class="sim-slider-lbl">Hours/day on date checks</span><span class="sim-slider-val" id="simVHours">2h</span></div><input type="range" class="sim-range" id="simHours" min="0.5" max="6" step="0.5" value="2"><div class="sim-range-bounds"><span>0.5h</span><span>6h</span></div></div>'
    + '<div class="sim-slider-group"><div class="sim-slider-header"><span class="sim-slider-lbl">Hourly labor cost</span><span class="sim-slider-val" id="simVWage">$16/h</span></div><input type="range" class="sim-range" id="simWage" min="14" max="25" step="1" value="16"><div class="sim-range-bounds"><span>$14/h</span><span>$25/h</span></div></div></div>'
    /* panel 2 */
    + '<div class="sim-panel"><div class="sim-panel-label"><img src="' + ICN + 'Watch-1--Streamline-Core.svg" alt="">Time you get back</div>'
    + '<div class="sim-result-big" id="simRLaborCost">$0</div><div class="sim-result-label">Labor cost saved per year across your network</div>'
    + '<div class="sim-result-sub" id="simRHoursSub">Based on 55% reduction</div><div class="sim-divider"></div>'
    + '<div class="sim-bk-row"><span class="sim-bk-lbl">Hours saved</span><span class="sim-bk-val" id="simRHours">0 H</span></div><div class="sim-bk-bar"><div class="sim-bk-fill" id="simBarHours" style="width:30%"></div></div>'
    + '<div class="sim-bk-row"><span class="sim-bk-lbl">Per store / year</span><span class="sim-bk-val" id="simRHoursPerStore">0h</span></div>'
    + '<div class="sim-bk-row"><span class="sim-bk-lbl">FTE saved</span><span class="sim-bk-val" id="simRFTE">0 FTE</span></div><div class="sim-bk-bar"><div class="sim-bk-fill" id="simBarFTE" style="width:0%"></div></div></div>'
    /* panel 3 */
    + '<div class="sim-panel"><div class="sim-panel-label"><img src="' + ICN + 'Bag-Dollar--Streamline-Core.svg" alt="">Margin you recover</div>'
    + '<div class="sim-result-big" id="simRMargin">$0</div><div class="sim-result-label">Recovered annually across your network</div>'
    + '<div class="sim-result-sub" id="simRMarginSub">10% net gain on shrink</div><div class="sim-divider"></div>'
    + '<div class="sim-bk-row"><span class="sim-bk-lbl">Shrink exposure</span><span class="sim-bk-val" id="simRShrinkTotal">$0</span></div><div class="sim-bk-bar"><div class="sim-bk-fill red" style="width:100%"></div></div>'
    + '<div class="sim-bk-row"><span class="sim-bk-lbl">Recovered with Smartway</span><span class="sim-bk-val" id="simRRecovered">$0</span></div><div class="sim-bk-bar"><div class="sim-bk-fill" id="simBarRecovered" style="width:10%"></div></div></div>'
    + '</div></div>'
    + '<div style="text-align:center;margin-top:56px" class="r"><a href="#calendar" class="btn btn-g">See the full simulation with your data →</a></div>'
    + '</div></section>';

  /* VALLARTA (static) */
  html +=
    '<section class="us-sp" id="results"><div class="us-sp-inner"><div class="us-sp-top r">'
    + '<div class="us-sp-eyebrow">Trusted by US retailers</div>'
    + '<img class="us-sp-logo" src="' + VALLARTA_LOGO + '" alt="Vallarta Supermarkets">'
    + '<h2 class="us-sp-h">How Vallarta deployed<br><em>34 stores in 5 weeks</em></h2>'
    + '<p class="us-sp-sub">A field-first methodology built for grocery teams. Zero expired products on shelves, 75% time saved on date checks, and full team adoption from day 1.</p></div>'
    + '<div class="us-sp-feature r"><div class="us-sp-video"><video autoplay muted loop playsinline crossorigin="anonymous" preload="metadata"><source src="' + VALLARTA_VIDEO + '" type="video/mp4"></video></div>'
    + '<div class="us-sp-vbadge">Vallarta Supermarkets · CIO</div><div class="us-sp-overlay"></div>'
    + '<div class="us-sp-content"><div class="us-sp-caption"><div class="qtxt">Congratulations on an outstanding implementation. Your hard work and dedication are truly commendable, and the exceptional results speak for themselves.</div>'
    + '<div class="qauthor"><img class="qavatar" src="' + STEVE_AVATAR + '" alt="Steve Netherton"><div><div class="qname">Steve Netherton</div><div class="qrole">CIO, Vallarta Supermarkets</div></div></div></div>'
    + '<div class="us-sp-kpis">'
    + '<div class="us-sp-kpi"><div class="kv">−75%</div><div class="kl">Time on date checks</div><div class="ks">No more walking every aisle. Smartway guided teams straight to expiring products.</div></div>'
    + '<div class="us-sp-kpi"><div class="kv">0 expired</div><div class="kl">Expired units after week 6</div><div class="ks">The aisle stays clean because alerts run before the date hits.</div></div>'
    + '<div class="us-sp-kpi"><div class="kv">-11% shrink</div><div class="kl">From week 1</div><div class="ks">First measurable shrink reduction visible in the weekly report. No 12-week ramp.</div></div>'
    + '<div class="us-sp-kpi"><div class="kv">ROI Day 1</div><div class="kl">Instant ROI</div><div class="ks">The shrink recovered from day one already covers the cost of Smartway.</div></div>'
    + '</div></div></div>'
    + '<div class="us-sp-cta-wrap r"><a href="https://smartway.ai/case-studies/us-retail-case-study-vallarta-smartway-ai" target="_blank" rel="noopener" class="us-sp-cta-link">Read the full Vallarta case study →</a></div>'
    + '</div></section>';

  /* DEPLOY */
  html +=
    '<section class="s-deploy" id="deployment"><div class="deploy-bg"><img src="' + DEPLOY_BG + '" alt=""></div>'
    + '<div class="deploy-inner"><div class="deploy-header r"><h2>Smart date management<br>to protect your margin.<br><em>ROI from Day 1.</em></h2>'
    + '<p>Launch a risk-free pilot in just 2 weeks. No complex IT integration required.</p></div>'
    + '<div class="deploy-grid">' + deployCards + '</div></div></section>';

  /* CTA */
  html +=
    '<section class="s-cta" id="calendar"><div class="cta-bg"><img src="' + CTA_BG + '" alt="" loading="lazy"></div>'
    + '<div class="cta-split"><div class="cta-left r"><div class="s-tag light">● Next step</div>'
    + '<h2 class="s-title">Let\'s debrief this visit with <em>' + REP_NAME + '</em></h2>'
    + '<p class="cta-desc">See how smartdetection can guarantee zero expired products, recover hidden margin and standardise freshness across your ' + esc(d.retailer) + ' stores.</p>'
    + '<div class="cta-features">'
    + '<div class="cta-feat"><span class="cf-icon"><img src="' + IC + 'computer%20png.png" alt=""></span> 30 min with a dedicated fresh retail specialist</div>'
    + '<div class="cta-feat"><span class="cf-icon"><img src="' + IC + 'cart%20png.png" alt=""></span> Personalised analysis for your network</div>'
    + '<div class="cta-feat"><span class="cf-icon"><img src="' + IC + 'science%20png.png" alt=""></span> Live ROI simulation with your real data</div></div>'
    + '<div class="cta-poc r d2"><div><div class="poc-title">Pilot in 2 weeks · ROI from day 1</div><div class="poc-sub">No IT integration needed. Risk-free test in selected stores.</div></div></div></div>'
    + '<div class="cta-right r d2"><div class="cal-frame"><div class="cal-header">'
    + '<div class="cal-header-left"><img src="' + SW_WHITE + '" alt="Smartway"><span>× ' + esc(d.retailer) + '</span></div>'
    + '<div class="cal-header-right"><span class="ld"></span> Available now</div></div>'
    + '<div class="cal-embed" id="calEmbed"></div></div></div></div></section>';

  /* FOOTER */
  html +=
    '<footer><div class="ft-inner"><div class="ft-logos"><img src="' + SW_WHITE + '" alt="Smartway"><span class="x-mark">×</span>'
    + '<img src="' + attr(d.logoWhite) + '" alt="' + attr(d.retailer) + '" style="height:26px;object-fit:contain"></div>'
    + '<div class="ft-tagline">The Smartway to manage short-dates and recover margin.</div>'
    + '<div class="ft-desc">Used by 20,000+ retail professionals every day to protect freshness, recover margin and make stores smarter.</div>'
    + '<div class="ft-line"></div><div class="ft-bottom">'
    + '<div class="ft-prepared">Prepared for ' + esc(d.retailer) + ', ' + esc(d.city) + ' · © 2026 Smartway</div>'
    + '<div class="ft-links"><a href="https://smartway.ai" target="_blank">smartway.ai</a> · <a href="#calendar">Contact</a></div></div></div></footer>';

  /* LIGHTBOX */
  html +=
    '<div class="lightbox" id="lightbox"><div class="lb-content"><div class="lb-close" id="lbClose">&times;</div>'
    + '<img id="lbImg" src="" alt=""><div class="lb-caption" id="lbCaption"></div></div></div>';

  document.getElementById('app').innerHTML = html;

  /* ════════════════ BEHAVIORS ════════════════ */
  var $ = function (id) { return document.getElementById(id); };
  var now = new Date(), j3 = new Date(now.getTime() + 3 * 864e5);
  var fmtD = function (x) { return x.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }); };
  if ($('pdaDate')) $('pdaDate').textContent = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  /* GPS markers */
  var ap = $('aislePhoto');
  if (ap) {
    PRODUCTS.forEach(function (p, i) {
      var style = Object.keys(p.pos).map(function (k) { return k + ':' + p.pos[k]; }).join(';');
      var exp = p.exp === 'today' ? fmtD(now) : fmtD(j3);
      var m = document.createElement('div'); m.className = 'gps-marker'; m.id = 'gm' + i; m.style.cssText = style;
      m.innerHTML = '<div style="position:relative"><div class="gps-pulse"></div><div class="gps-pin-head"><span>' + p.emoji + '</span></div><div class="gps-pin-tail"></div></div><div class="gps-label">' + p.name + ' · exp ' + exp + '</div>';
      ap.insertBefore(m, ap.querySelector('.pda-overlay'));
    });
  }

  /* NAV scroll */
  window.addEventListener('scroll', function () { if ($('nav')) $('nav').classList.toggle('scrolled', window.scrollY > 60); }, { passive: true });

  /* DEMO anim */
  var demoPlayed = false, markers = [].slice.call(document.querySelectorAll('.gps-marker'));
  function setStat(id, val) { var e = $('dS' + id); if (e) e.textContent = val; var em = $('dS' + id + 'm'); if (em) em.textContent = val; }
  function startDemo() {
    var scan = $('aisleScan'), res = $('demoResult'), rb = $('demoReplay'), rbD = $('demoReplayDesktop');
    if (res) res.classList.remove('show'); markers.forEach(function (m) { m.classList.remove('show'); });
    setStat('P', '0'); setStat('T', '0.0s'); setStat('A', '0');
    if (rb) rb.style.opacity = '0';
    var ti = 0, tI = setInterval(function () { ti += .1; setStat('T', ti.toFixed(1) + 's'); }, 100);
    setTimeout(function () { if (scan) { scan.classList.remove('active'); void scan.offsetWidth; scan.classList.add('active'); } }, 600);
    markers.forEach(function (m, i) { setTimeout(function () { m.classList.add('show'); setStat('P', i + 1); setStat('A', i < (markers.length / 2) ? '1' : '2'); }, 1200 + i * 380); });
    var sd = 1200 + markers.length * 380 + 600;
    setTimeout(function () { clearInterval(tI); setStat('T', '4.2s'); setStat('P', markers.length); setStat('A', '2'); if (res) { res.innerHTML = '⚡ <strong>' + markers.length + ' short-dated products</strong> geolocated across 2 aisles in 4.2s. Zero time wasted searching.'; res.classList.add('show'); } if (rb) rb.style.opacity = '1'; if (rbD) rbD.style.opacity = '1'; }, sd);
  }
  function replayDemo() { demoPlayed = false; var rb = $('demoReplay'), rbD = $('demoReplayDesktop'); if (rb) rb.style.opacity = '0'; if (rbD) rbD.style.opacity = '0'; if ($('demoResult')) $('demoResult').classList.remove('show'); markers.forEach(function (m) { m.classList.remove('show'); }); setStat('P', '0'); setStat('T', '0.0s'); setStat('A', '0'); setTimeout(startDemo, 400); }
  if ($('demoReplay')) $('demoReplay').addEventListener('click', replayDemo);
  if ($('demoReplayDesktop')) $('demoReplayDesktop').addEventListener('click', replayDemo);
  if ($('demo')) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !demoPlayed) { demoPlayed = true; setTimeout(startDemo, 800); } }); }, { threshold: .3 }).observe($('demo'));

  /* LIGHTBOX */
  window.openLightbox = function (src, cap) { $('lbImg').src = src; $('lbCaption').textContent = cap || ''; $('lightbox').classList.add('open'); document.body.style.overflow = 'hidden'; };
  function closeLightbox() { $('lightbox').classList.remove('open'); document.body.style.overflow = ''; }
  if ($('lightbox')) {
    $('lightbox').addEventListener('click', function (e) { if (e.target === this) closeLightbox(); });
    $('lbClose').addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  }
  /* gallery + featured click → lightbox */
  document.querySelectorAll('.gallery-item, .proof-feature').forEach(function (el) {
    el.addEventListener('click', function () { window.openLightbox(el.getAttribute('data-url'), el.getAttribute('data-cap')); });
  });

  /* TRANSFORM slideshow */
  (function () {
    var box = $('trPhoto'), img = $('trPhotoImg');
    if (!box || !img || !d.gallery.length) return;
    var PHOTOS = d.gallery.map(function (g) { return { src: g.url, tag: g.caption || '' }; });
    var idx = 0, timer = null, paused = false;
    function show(i) { var p = PHOTOS[i]; img.style.opacity = '0'; setTimeout(function () { img.src = p.src; img.alt = p.tag; box.dataset.tag = p.tag; img.style.opacity = '1'; }, 200); }
    function next() { idx = (idx + 1) % PHOTOS.length; show(idx); }
    function start() { if (timer || paused) return; timer = setInterval(next, 4000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function pause() { paused = true; stop(); }
    function resume() { paused = false; start(); }
    box.dataset.tag = PHOTOS[0].tag; start();
    box.addEventListener('mouseenter', pause); box.addEventListener('mouseleave', resume);
    document.querySelectorAll('.tr-col:not(.tr-col--dark) .tr-list li[data-photo]').forEach(function (li) {
      li.addEventListener('mouseenter', function () {
        var src = li.dataset.photo, t = li.dataset.tag; if (!src) return; pause();
        var i = PHOTOS.map(function (p) { return p.src; }).indexOf(src); if (i >= 0) idx = i;
        if (img.getAttribute('src') !== src) { img.style.opacity = '0'; setTimeout(function () { img.src = src; if (t) { img.alt = t; box.dataset.tag = t; } img.style.opacity = '1'; }, 150); }
        else if (t) { img.alt = t; box.dataset.tag = t; }
      });
      li.addEventListener('mouseleave', resume);
    });
    box.addEventListener('click', function () { pause(); window.openLightbox(img.src, box.dataset.tag || ''); });
  })();

  /* SIMULATOR */
  (function () {
    var fmtM = function (v) { if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'; if (v >= 1e3) return '$' + Math.round(v / 1e3) + 'K'; return '$' + Math.round(v); };
    var fmtH = function (v) { return Math.round(v).toLocaleString('en-US') + ' H'; };
    var ids = ['simRevenue', 'simShrink', 'simStores', 'simHours', 'simWage'];
    if (!$('simRevenue')) return;
    function calc() {
      var revenue = parseFloat($('simRevenue').value) * 1e6, shrink = parseFloat($('simShrink').value) / 100, stores = parseInt($('simStores').value), hoursDay = parseFloat($('simHours').value), wage = parseInt($('simWage').value);
      $('simVRevenue').textContent = '$' + $('simRevenue').value + 'M';
      $('simVShrink').textContent = $('simShrink').value + '%';
      $('simVStores').textContent = stores;
      $('simVHours').textContent = $('simHours').value + 'h';
      $('simVWage').textContent = '$' + wage + '/h';
      var hoursPerStoreYear = hoursDay * 365 * 0.55, totalHours = hoursPerStoreYear * stores, fte = totalHours / 1720, laborCost = totalHours * wage;
      $('simRLaborCost').textContent = fmtM(laborCost);
      $('simRHours').textContent = fmtH(totalHours);
      $('simRHoursSub').textContent = 'Based on 55% reduction in date-check time across ' + stores + ' store' + (stores > 1 ? 's' : '');
      $('simRHoursPerStore').textContent = fmtH(hoursPerStoreYear);
      $('simRFTE').textContent = fte.toFixed(1) + ' FTE';
      $('simBarFTE').style.width = Math.min(fte / 10 * 100, 100) + '%';
      $('simBarHours').style.width = Math.min(totalHours / 50000 * 100, 100) + '%';
      var shrinkTotal = revenue * stores * shrink, recovered = shrinkTotal * 0.10;
      $('simRMargin').textContent = fmtM(recovered);
      $('simRMarginSub').textContent = '10% net gain on ' + fmtM(shrinkTotal) + ' shrink exposure';
      $('simRShrinkTotal').textContent = fmtM(shrinkTotal);
      $('simRRecovered').textContent = fmtM(recovered);
      $('simBarRecovered').style.width = '10%';
      ids.forEach(function (id) { var el = $(id), mn = parseFloat(el.min), mx = parseFloat(el.max), v = parseFloat(el.value), pct = ((v - mn) / (mx - mn)) * 100; el.style.background = 'linear-gradient(to right,#31715B ' + pct + '%,#E2E0E3 ' + pct + '%)'; });
    }
    ids.forEach(function (id) { var el = $(id); if (el) el.addEventListener('input', calc); });
    calc();
  })();

  /* 4-STEP VIDEO FLOW */
  (function () {
    var cards = [].slice.call(document.querySelectorAll('.demo-step[data-step]'));
    var wraps = [].slice.call(document.querySelectorAll('.step-wrap[data-wrap]'));
    var vids = cards.map(function (c) { return c.querySelector('.demo-step-vid'); });
    if (!cards.length) return;
    var hovering = false, hoverIdx = -1;
    function activate(idx) {
      cards.forEach(function (c, i) { c.classList.toggle('active', i === idx); });
      wraps.forEach(function (w, i) { w.classList.toggle('active', i === idx); });
      vids.forEach(function (v, i) { if (!v) return; if (i === idx) { v.load(); v.currentTime = 0; v.play().catch(function () {}); } else { v.pause(); v.currentTime = 0; } });
    }
    vids.forEach(function (v, i) { if (!v) return; v.addEventListener('ended', function () { if (!hovering) activate((i + 1) % cards.length); }); });
    (wraps.length ? wraps : cards).forEach(function (el, i) {
      el.addEventListener('mouseenter', function () { hovering = true; hoverIdx = i; activate(i); });
      el.addEventListener('mouseleave', function () { hovering = false; activate((hoverIdx + 1) % cards.length); });
    });
    var hiw = document.querySelector('.demo-hiw');
    if (hiw) { var started = false; new IntersectionObserver(function (e) { if (e[0].isIntersecting && !started) { started = true; activate(0); } }, { threshold: 0.2 }).observe(hiw); }
    else activate(0);
  })();

  /* REVEAL */
  var rObs = new IntersectionObserver(function (e) { e.forEach(function (x) { if (x.isIntersecting) x.target.classList.add('v'); }); }, { threshold: .1, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.r').forEach(function (el) { rObs.observe(el); });

  /* SMOOTH SCROLL */
  document.addEventListener('click', function (e) { var a = e.target.closest('a[href^="#"]'); if (a) { e.preventDefault(); var t = document.querySelector(a.getAttribute('href')); if (t) t.scrollIntoView({ behavior: 'smooth' }); } });

  /* CALENDAR */
  if ($('calEmbed')) {
    $('calEmbed').innerHTML = '<div class="meetings-iframe-container" data-src="' + CALENDAR + '"></div>';
    var hs = document.createElement('script'); hs.src = 'https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js'; document.body.appendChild(hs);
  }

  /* iOS VIDEO AUTOPLAY FIX */
  (function () {
    function tryPlay(v) {
      v.muted = true; var p = v.play();
      if (p !== undefined) p.catch(function () {
        if (!v.parentElement.querySelector('.vid-tap')) {
          var tap = document.createElement('div'); tap.className = 'vid-tap'; tap.innerHTML = '<span>▶</span>';
          tap.addEventListener('click', function () { v.play(); tap.style.display = 'none'; });
          v.parentElement.style.position = 'relative'; v.parentElement.appendChild(tap);
        }
      });
    }
    var gestured = false;
    function onGesture() { if (gestured) return; gestured = true; document.querySelectorAll('video[autoplay]').forEach(function (v) { if (v.paused) { v.load(); tryPlay(v); } }); }
    ['touchstart', 'click', 'scroll'].forEach(function (ev) { document.addEventListener(ev, onGesture, { once: true, passive: true }); });
    if ('IntersectionObserver' in window) {
      var vObs = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var v = e.target; if (v.paused) { v.load(); tryPlay(v); } vObs.unobserve(v); } }); }, { threshold: 0.15 });
      document.querySelectorAll('video[autoplay]').forEach(function (v) { vObs.observe(v); });
    }
  })();

  console.log('🚀 Smartway Visit LP engine loaded — ' + d.retailer);
})();
