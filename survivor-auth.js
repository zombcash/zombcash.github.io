/* Telegram-based Survivor registration. No Telegram or Supabase secrets are exposed here. */
(() => {
  'use strict';
  const API = 'https://zombcash-bot.fadehost.app';
  // Existing project bot; its domain must be linked in @BotFather before login works.
  const BOT_USERNAME = 'MemeCoinAIAgent_bot';
  const STORAGE_TOKEN = 'zombcash-survivor-token';
  const STORAGE_PROFILE = 'zombcash-survivor-profile';
  const translations = {
    en:{login:'LOGIN WITH TELEGRAM',profile:'SURVIVOR PROFILE',intro:'Join the outbreak. Track your activity and future rewards.',connect:'CONTINUE WITH TELEGRAM',loading:'VERIFYING TELEGRAM IDENTITY…',points:'SURVIVAL POINTS',joined:'JOINED',logout:'LOG OUT',close:'CLOSE',setup:'Registration setup is not finished yet. Please try again later.',error:'Telegram sign-in failed. Please try again.',privacy:'Your Telegram ID is used to identify your profile. It is not shown publicly.'},
    de:{login:'MIT TELEGRAM ANMELDEN',profile:'ÜBERLEBENDEN-PROFIL',intro:'Werde Teil des Ausbruchs. Verfolge Aktivität und künftige Belohnungen.',connect:'MIT TELEGRAM FORTFAHREN',loading:'TELEGRAM-IDENTITÄT WIRD GEPRÜFT…',points:'ÜBERLEBENSPUNKTE',joined:'BEIGETRETEN',logout:'ABMELDEN',close:'SCHLIESSEN',setup:'Die Registrierung ist noch nicht eingerichtet. Bitte später erneut versuchen.',error:'Telegram-Anmeldung fehlgeschlagen. Bitte erneut versuchen.',privacy:'Deine Telegram-ID identifiziert dein Profil und wird nicht öffentlich angezeigt.'},
    fr:{login:'CONNEXION AVEC TELEGRAM',profile:'PROFIL DU SURVIVANT',intro:'Rejoignez l’épidémie. Suivez votre activité et les futures récompenses.',connect:'CONTINUER AVEC TELEGRAM',loading:'VÉRIFICATION DE TELEGRAM…',points:'POINTS DE SURVIE',joined:'INSCRIPTION',logout:'DÉCONNEXION',close:'FERMER',setup:'L’inscription n’est pas encore configurée. Réessayez plus tard.',error:'Échec de la connexion Telegram. Réessayez.',privacy:'Votre identifiant Telegram sert à reconnaître votre profil et reste privé.'},
    it:{login:'ACCEDI CON TELEGRAM',profile:'PROFILO SOPRAVVISSUTO',intro:'Unisciti al focolaio. Tieni traccia dell’attività e delle future ricompense.',connect:'CONTINUA CON TELEGRAM',loading:'VERIFICA IDENTITÀ TELEGRAM…',points:'PUNTI SOPRAVVIVENZA',joined:'ISCRITTO',logout:'ESCI',close:'CHIUDI',setup:'La registrazione non è ancora configurata. Riprova più tardi.',error:'Accesso Telegram non riuscito. Riprova.',privacy:'Il tuo ID Telegram identifica il profilo e non viene mostrato pubblicamente.'},
    ja:{login:'TELEGRAMでログイン',profile:'サバイバープロフィール',intro:'アウトブレイクに参加して、活動履歴と今後の報酬を記録しよう。',connect:'TELEGRAMで続行',loading:'TELEGRAM IDを確認中…',points:'サバイバルポイント',joined:'登録日',logout:'ログアウト',close:'閉じる',setup:'登録設定はまだ完了していません。後でもう一度お試しください。',error:'Telegramログインに失敗しました。もう一度お試しください。',privacy:'Telegram IDはプロフィールの識別に使用され、公開されません。'},
    'zh-CN':{login:'使用 TELEGRAM 登录',profile:'幸存者档案',intro:'加入爆发行动，记录活动并为未来奖励做好准备。',connect:'继续使用 TELEGRAM',loading:'正在验证 TELEGRAM 身份…',points:'生存积分',joined:'加入时间',logout:'退出登录',close:'关闭',setup:'注册功能尚未完成配置，请稍后再试。',error:'Telegram 登录失败，请重试。',privacy:'Telegram ID 用于识别你的档案，不会公开显示。'},
    ru:{login:'ВОЙТИ ЧЕРЕЗ TELEGRAM',profile:'ПРОФИЛЬ ВЫЖИВШЕГО',intro:'Присоединяйся к вспышке. Учитывай активность и готовься к будущим наградам.',connect:'ПРОДОЛЖИТЬ ЧЕРЕЗ TELEGRAM',loading:'ПРОВЕРЯЕМ TELEGRAM…',points:'ОЧКИ ВЫЖИВАНИЯ',joined:'ДАТА РЕГИСТРАЦИИ',logout:'ВЫЙТИ',close:'ЗАКРЫТЬ',setup:'Регистрация ещё не настроена. Попробуй позже.',error:'Не удалось войти через Telegram. Попробуй ещё раз.',privacy:'Telegram ID используется для идентификации профиля и не показывается публично.'},
    tr:{login:'TELEGRAM İLE GİRİŞ',profile:'HAYATTA KALAN PROFİLİ',intro:'Salgına katıl. Etkinliğini ve gelecekteki ödüllerini takip et.',connect:'TELEGRAM İLE DEVAM ET',loading:'TELEGRAM KİMLİĞİ DOĞRULANIYOR…',points:'HAYATTA KALMA PUANLARI',joined:'KATILMA TARİHİ',logout:'ÇIKIŞ YAP',close:'KAPAT',setup:'Kayıt ayarları henüz tamamlanmadı. Lütfen sonra tekrar dene.',error:'Telegram girişi başarısız. Tekrar dene.',privacy:'Telegram kimliğin profilini tanımak için kullanılır ve herkese açık gösterilmez.'},
    hi:{login:'TELEGRAM से लॉग इन करें',profile:'सर्वाइवर प्रोफ़ाइल',intro:'आउटब्रेक में शामिल हों। गतिविधि और भविष्य के पुरस्कारों को ट्रैक करें।',connect:'TELEGRAM के साथ जारी रखें',loading:'TELEGRAM पहचान सत्यापित हो रही है…',points:'सर्वाइवल पॉइंट्स',joined:'जुड़ने की तारीख',logout:'लॉग आउट',close:'बंद करें',setup:'पंजीकरण सेटअप अभी पूरा नहीं हुआ है। कृपया बाद में फिर प्रयास करें।',error:'Telegram साइन-इन विफल हुआ। कृपया फिर प्रयास करें।',privacy:'आपकी Telegram ID प्रोफ़ाइल पहचानने के लिए उपयोग होती है और सार्वजनिक नहीं की जाती।'}
  };
  const lang = () => {
    try { const code = localStorage.getItem('zombcash-language') || document.documentElement.lang || 'en'; return translations[code] ? code : 'en'; }
    catch (_) { return 'en'; }
  };
  const t = key => translations[lang()][key] || translations.en[key] || key;
  const loginWaiting = {"en":"Open Telegram and press Start. This page will finish login automatically.","de":"Öffne Telegram und tippe auf Start. Diese Seite schließt die Anmeldung automatisch ab.","fr":"Ouvrez Telegram et appuyez sur Démarrer. La connexion se terminera automatiquement ici.","it":"Apri Telegram e premi Avvia. L’accesso verrà completato automaticamente su questa pagina.","ja":"Telegramを開いて「Start」を押してください。このページで自動的にログインが完了します。","zh-CN":"打开 Telegram 并点击 Start。此页面将自动完成登录。","ru":"Откройте Telegram и нажмите «Запустить». Вход на этой странице завершится автоматически.","tr":"Telegram'ı açıp Başlat'a dokunun. Giriş bu sayfada otomatik tamamlanacak.","hi":"Telegram खोलें और Start दबाएँ। इस पेज पर लॉगिन अपने आप पूरा हो जाएगा。"};

  const safe = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let overlay, statusNode, bodyNode, widgetNode, isBusy = false;
  const readProfile = () => { try { return JSON.parse(localStorage.getItem(STORAGE_PROFILE) || 'null'); } catch (_) { return null; } };
  const token = () => { try { return localStorage.getItem(STORAGE_TOKEN) || ''; } catch (_) { return ''; } };
  function updateCta() {
    const cta = document.querySelector('.top-cta, .survivor-entry-button');
    if (!cta) return;
    const p = readProfile();
    cta.textContent = p ? '☣ ' + (p.username ? '@' + p.username : p.firstName || 'SURVIVOR') : t('login');
    cta.setAttribute('aria-label', p ? t('profile') : t('login'));
    cta.href = '#survivor-profile';
  }
  function ensureModal() {
    if (overlay) return;
    const style = document.createElement('style');
    style.textContent = '.survivor-overlay[hidden]{display:none!important}.survivor-overlay{position:fixed;inset:0;z-index:20000;display:grid;place-items:center;padding:18px;background:#020603df;backdrop-filter:blur(7px)}.survivor-modal{position:relative;width:min(440px,100%);padding:26px;border:1px solid #6a9d42;background:linear-gradient(145deg,#101b12,#070b09);color:#edf5e5;box-shadow:0 22px 80px #000b;font-family:Rajdhani,system-ui,sans-serif}.survivor-modal h2{margin:0 0 10px;color:#9bff45;font:700 19px Orbitron,system-ui,sans-serif}.survivor-modal p{color:#b8c8b6;line-height:1.5}.survivor-modal .survivor-status{min-height:24px;color:#9bff45;font-size:14px}.survivor-modal .survivor-widget{display:flex;justify-content:center;min-height:46px;margin:20px 0}.survivor-modal .survivor-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}.survivor-modal button{border:1px solid #426341;background:#0b120c;color:#b8f992;padding:10px 14px;cursor:pointer;font:700 11px Orbitron,system-ui,sans-serif}.survivor-modal .survivor-stats{border:1px solid #2b4930;padding:14px;margin-top:16px}.survivor-modal .survivor-points{font:700 26px Orbitron,system-ui,sans-serif;color:#9bff45}.survivor-modal .survivor-privacy{font-size:12px;color:#8e9c8d}.survivor-modal [hidden]{display:none!important}.survivor-entry-button{display:inline-flex;align-items:center;justify-content:center;margin:10px 0 0;padding:10px 12px;border:1px solid #426341;background:#0b120c;color:#b8f992;font:700 10px Orbitron,system-ui,sans-serif;cursor:pointer;white-space:normal}';
    document.head.append(style);
    overlay = document.createElement('div');
    overlay.className = 'survivor-overlay';
    overlay.hidden = true;
    overlay.innerHTML = '<section class="survivor-modal" role="dialog" aria-modal="true" aria-labelledby="survivor-title"><h2 id="survivor-title"></h2><p id="survivor-intro"></p><div id="survivor-body"></div><p class="survivor-status" id="survivor-status" role="status"></p><p class="survivor-privacy" id="survivor-privacy"></p><div class="survivor-actions"><button type="button" id="survivor-logout" hidden></button><button type="button" id="survivor-close"></button></div></section>';
    document.body.append(overlay);
    statusNode = overlay.querySelector('#survivor-status');
    bodyNode = overlay.querySelector('#survivor-body');
    widgetNode = document.createElement('div'); widgetNode.className = 'survivor-widget';
    overlay.querySelector('#survivor-close').addEventListener('click', closeModal);
    overlay.querySelector('#survivor-logout').addEventListener('click', () => {
      try { localStorage.removeItem(STORAGE_TOKEN); localStorage.removeItem(STORAGE_PROFILE); } catch (_) {}
      updateCta(); renderModal(); statusNode.textContent = '';
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeModal(); });
  }
  function closeModal() { if (overlay) overlay.hidden = true; }
  function renderModal() {
    ensureModal();
    const profile = readProfile();
    overlay.querySelector('#survivor-title').textContent = profile ? t('profile') : t('login');
    overlay.querySelector('#survivor-intro').textContent = profile ? (profile.firstName || 'Survivor') : t('intro');
    overlay.querySelector('#survivor-close').textContent = t('close');
    overlay.querySelector('#survivor-logout').textContent = t('logout');
    overlay.querySelector('#survivor-logout').hidden = !profile;
    overlay.querySelector('#survivor-privacy').textContent = t('privacy');
    bodyNode.innerHTML = '';
    if (profile) {
      const joined = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—';
      bodyNode.innerHTML = '<div class="survivor-stats"><div>' + safe(t('points')) + '</div><div class="survivor-points">' + safe(profile.points || 0) + '</div><p>' + safe(t('joined')) + ': ' + safe(joined) + '</p></div>';
      statusNode.textContent = '';
      return;
    }
    const label = document.createElement('p'); label.textContent = t('connect'); bodyNode.append(label, widgetNode);
    statusNode.textContent = '';
    widgetNode.innerHTML = '';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = t('connect');
    button.addEventListener('click', beginBotLogin);
    widgetNode.append(button);
  }
  async function beginBotLogin() {
    if (isBusy) return;
    isBusy = true;
    statusNode.textContent = t('loading');
    try {
      const response = await fetch(API + '/api/auth/telegram/start', {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: '{}', cache: 'no-store'
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.nonce || !data.botUrl) {
        statusNode.textContent = response.status === 503 ? t('setup') : t('error');
        isBusy = false;
        return;
      }
      widgetNode.innerHTML = '';
      const link = document.createElement('a');
      link.href = data.botUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = t('connect');
      link.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;border:1px solid #6a9d42;background:#9bff45;color:#071007;text-decoration:none;font:700 11px Orbitron,system-ui,sans-serif;';
      widgetNode.append(link);
      statusNode.textContent = loginWaiting[lang()] || loginWaiting.en;
      const expiresAt = Date.now() + 175000;
      while (Date.now() < expiresAt) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusResponse = await fetch(API + '/api/auth/telegram/status?nonce=' + encodeURIComponent(data.nonce), {cache:'no-store'});
        const statusData = await statusResponse.json().catch(() => ({}));
        if (statusResponse.status === 410) {
          statusNode.textContent = t('error');
          return;
        }
        if (statusResponse.ok && statusData.status === 'complete' && statusData.token && statusData.profile) {
          localStorage.setItem(STORAGE_TOKEN, statusData.token);
          localStorage.setItem(STORAGE_PROFILE, JSON.stringify(statusData.profile));
          document.dispatchEvent(new CustomEvent('zombcash:survivorlogin'));
          updateCta();
          refreshProfile();
          renderModal();
          statusNode.textContent = '';
          return;
        }
      }
      statusNode.textContent = t('error');
    } catch (_) {
      statusNode.textContent = t('error');
    } finally {
      isBusy = false;
    }
  }
  async function recordDailyVisit() {
    const day = new Date().toISOString().slice(0, 10);
    const profile = readProfile();
    if (!profile || !profile.telegramId) return;
    const key = 'zombcash-survivor-visit:' + String(profile.telegramId) + ':' + day;
    try { if (localStorage.getItem(key) === '1') return; } catch (_) {}
    try {
      const response = await fetch(API + '/api/survival/visit', {
        method: 'POST',
        headers: {'Authorization':'Bearer ' + token(), 'Content-Type':'application/json'},
        body: '{}',
        cache: 'no-store'
      });
      if (response.ok) { try { localStorage.setItem(key, '1'); } catch (_) {} }
    } catch (_) {}
  }
  async function refreshProfile() {
    if (!token()) return;
    try {
      const response = await fetch(API + '/api/profile', {headers:{'Authorization':'Bearer ' + token()}, cache:'no-store'});
      if (response.status === 401) { localStorage.removeItem(STORAGE_TOKEN); localStorage.removeItem(STORAGE_PROFILE); return; }
      if (response.ok) {
        const data = await response.json();
        if (data.profile) localStorage.setItem(STORAGE_PROFILE, JSON.stringify(data.profile));
        await recordDailyVisit();
      }
    } catch (_) {}
  }
  function init() {
    ensureModal();
    let cta = document.querySelector('.top-cta');
    if (!cta) {
      cta = document.createElement('button');
      cta.type = 'button';
      cta.className = 'survivor-entry-button';
      const nav = document.querySelector('.nav, header nav') || document.querySelector('header') || document.querySelector('main');
      if (nav) nav.append(cta);
    }
    if (cta) cta.addEventListener('click', e => { e.preventDefault(); overlay.hidden = false; renderModal(); });
    document.addEventListener('zombcash:languagechange', () => { updateCta(); if (overlay && !overlay.hidden) renderModal(); });
    refreshProfile().finally(updateCta);
    updateCta();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();