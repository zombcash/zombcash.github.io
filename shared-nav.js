/* Shared ZombieCash navigation. Keep this file common to every public page. */
(() => {
  'use strict';
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isHome = path === '' || path === 'index.html';
  const home = 'index.html';
  const items = [
    ['LIVE WORLD', '#living-world'], ['RADAR', '#radar'],
    ['CREW VOTE', 'crew-vote.html'], ['ZOMBIE LAB', '#lab'],
    ['ARCADE', 'arcade.html'], ['ZOMBIE GALLERY', 'gallery.html'],
    ['ZOMBIE MAKER', 'zombie-maker.html'], ['OUTBREAK', '#outbreak'],
    ['COMMUNITY', '#community'], ['BUY $ZOMBCASH', '#community-console']
  ];
  const hrefFor = href => isHome ? href : (href.startsWith('#') ? home + href : href);
  const header = document.querySelector('body > header, body header');
  if (!header) return;
  header.classList.add('zombcash-shared-header');
  header.innerHTML = '<a class="zsh-brand" href="' + (isHome ? '#home' : home) + '" aria-label="ZombieCash home"><span class="zsh-mark">☣</span><span class="zsh-brand-copy">ZOMBIE<span class="zsh-green">CASH</span><small>THE UNDEAD INTERNET</small></span></a>' +
    '<nav class="zsh-nav" aria-label="Main navigation">' +
    items.map(([label, href]) => '<a href="' + hrefFor(href) + '">' + label + '</a>').join('') +
    (!isHome ? '<a class="zsh-home home-return-button" href="' + home + '"><span aria-hidden="true">←</span> BACK TO HOME</a>' : '') +
    '</nav><a class="top-cta zsh-cta" href="' + (isHome ? '#community' : home + '#community') + '">JOIN THE SURVIVORS <span>↗</span></a>' +
    '<button class="zsh-menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">☰</button>';
  const style = document.createElement('style');
  style.textContent = `
    .zombcash-shared-header{position:sticky!important;top:0!important;z-index:10000!important;display:flex!important;align-items:center!important;gap:18px!important;justify-content:space-between!important;flex-wrap:wrap!important;min-height:76px!important;height:auto!important;padding:12px clamp(16px,5.2vw,84px)!important;border-bottom:1px solid #9bff4533!important;background:#050907f5!important;backdrop-filter:blur(12px)!important;box-sizing:border-box!important}
    .zsh-brand{display:flex;align-items:center;gap:12px;flex:0 0 auto;color:#edf5e5;text-decoration:none!important}
    .zsh-mark{display:grid;place-items:center;width:46px;height:46px;border:1px solid #9bff45;border-radius:8px;color:#9bff45;font-size:25px;box-shadow:inset 0 0 18px #9bff4518}
    .zsh-brand-copy{font:800 17px Orbitron,system-ui,sans-serif;letter-spacing:-.5px;white-space:nowrap}.zsh-green{color:#9bff45}
    .zsh-brand-copy small{display:block;margin-top:4px;color:#9aa797;font:600 8px Orbitron,system-ui,sans-serif;letter-spacing:2.5px}
    .zsh-nav{display:flex;align-items:center;justify-content:center;gap:clamp(8px,1.2vw,20px);flex:1 1 600px;min-width:0;flex-wrap:wrap}
    .zsh-nav a{display:inline-flex;align-items:center;min-height:30px;color:#c5d0c3;text-decoration:none!important;font:600 9px/1.4 Orbitron,system-ui,sans-serif;letter-spacing:.25px;white-space:normal;overflow-wrap:anywhere}
    .zsh-nav a:hover,.zsh-nav a[aria-current=page]{color:#9bff45}
    .zsh-nav .zsh-home{border:1px solid #42613a;padding:8px 10px;color:#b8f992}
    .zsh-cta{display:inline-flex;align-items:center;justify-content:center;gap:7px;flex:0 0 auto;max-width:100%;padding:10px 12px;border:1px solid #42613a;background:#0b120c;color:#b8f992;text-decoration:none!important;font:700 9px Orbitron,system-ui,sans-serif;white-space:normal}
    .zombcash-shared-header>.language-switcher{flex:0 0 auto;margin-left:0!important}
    .zsh-menu-toggle{display:none;border:1px solid #42613a;background:#0b120c;color:#9bff45;padding:9px 11px;font-size:18px}
    @media(max-width:1050px){.zombcash-shared-header{gap:10px!important;padding:10px 16px!important}.zsh-nav{order:4;flex-basis:100%;justify-content:flex-start;gap:8px 14px}.zsh-nav a{font-size:8px}.zombcash-shared-header>.language-switcher{margin-left:auto!important}}
    @media(max-width:600px){.zombcash-shared-header{gap:8px!important}.zsh-mark{width:38px;height:38px;font-size:21px}.zsh-brand-copy{font-size:14px}.zsh-brand-copy small{font-size:7px;letter-spacing:1.5px}.zsh-cta{font-size:8px;padding:8px}.zsh-menu-toggle{display:block}.zsh-nav{display:none;order:10;flex-basis:100%;padding:8px 0 4px}.zsh-nav.zsh-open{display:flex}.zsh-nav a{width:calc(50% - 8px);padding:7px 0}.zombcash-shared-header>.language-switcher{order:3}.zsh-home{width:100%!important}}
  `;
  document.head.append(style);
  const toggle = header.querySelector('.zsh-menu-toggle');
  toggle.addEventListener('click', () => {
    const nav = header.querySelector('.zsh-nav');
    const open = nav.classList.toggle('zsh-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
})();