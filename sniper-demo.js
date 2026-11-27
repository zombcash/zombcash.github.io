(() => {
  'use strict';
  // Sniper UI, wallet and runtime journal support: en, ru, de, fr, it, ja, zh-CN, tr, hi.
  if (window.__zombieSniperPaperDemo) return;
  window.__zombieSniperPaperDemo = true;

  const API = 'https://api.dexscreener.com';
  const WRAPPED_SOL = 'So11111111111111111111111111111111111111112';
  const STORAGE_KEY = 'zombcash_sniper_paper_v1';
  const AUTH_API = 'https://zombcash-bot.fadehost.app';
  const TOKEN_KEY = 'zombcash-survivor-token';
  const PROFILE_KEY = 'zombcash-survivor-profile';
  const OFFICIAL_MINT = '6cCBF9gtyp3c6VmyxUWzETk3yFmxhjvPm15cxicfpump';
  const copy = {
    en: {
      title:'ZOMBIE SNIPER // PAPER DEMO', intro:'Test the entry and exit rules against Pump.fun bonding-curve trades during each token’s first minute. Paper mode never signs or sends a transaction.',
      demo:'DEMO ONLY', refresh:'REFRESH TOKEN FEED', loading:'Scanning the latest public token profiles…', failed:'The public feed is temporarily unavailable. Try again later.',
      source:'Source: PumpPortal new-token stream plus per-Mint bonding-curve trades during the first 60 seconds. Trade streaming requires an API key and linked wallet; open positions remain monitored. DEX profiles are display-only fallback.',
      amount:'PAPER BUY SIZE (SOL)', target:'NET PROFIT TARGET (%)', stop:'NET STOP-LOSS (%)',
      network:'NETWORK FEE / TX (SOL)', priority:'PRIORITY FEE / TX (SOL)', dex:'DEX FEE / SIDE (%)', slip:'SLIPPAGE / SIDE (%)',
      assumptions:'Editable cost assumptions — not live transaction quotes. Actual costs depend on the route, congestion, liquidity and wallet account state.',
      candidates:'LATEST SOLANA TOKEN PROFILES', noCandidates:'No suitable SOL-quoted pools found in the latest profile batch.',
      token:'TOKEN', age:'PAIR AGE', liquidity:'LIQUIDITY', price:'PRICE (SOL)', action:'PAPER BUY',
      positions:'PAPER POSITIONS', noPositions:'No paper positions yet. Choose a candidate above to simulate a buy.',
      open:'OPEN', closed:'CLOSED', entry:'ENTRY', current:'CURRENT', net:'NET P/L', targetHit:'NET TARGET HIT — SIMULATED SELL',
      stopHit:'NET STOP-LOSS HIT — SIMULATED SELL', manualClose:'CLOSE PAPER POSITION', saved:'Demo history is stored only in this browser on this device.', synced:'Demo history synced to your Telegram survivor profile.', loginToSync:'Log in with Telegram to sync demo history; otherwise it stays in this browser.', loginAgain:'Your Telegram session expired. Log in again to sync.', syncError:'Account sync is unavailable; this device copy is kept locally.',
      rules:'Net P/L includes both-side DEX fee and slippage assumptions plus network and priority fees for both transactions. The target is checked against net P/L, not token price movement.',
      cap:"Demo size is limited only by available virtual capital. No wallet or real transactions.",
      ageUnknown:'unknown', justNow:'just now', mins:'m ago', hours:'h ago', days:'d ago', liveConnected:'LIVE LAUNCH STREAM CONNECTED', liveDisconnected:'LAUNCH STREAM OFFLINE — DEXSCREENER FALLBACK', waitingForPool:'WAITING FOR SOL POOL', liveTag:'LIVE LAUNCH',
      needAmount:"Enter a paper buy size greater than zero and no more than your available virtual capital.",
      noPair:'No current SOL-quoted pool is available for this token.', buyOk:'Paper position opened. No transaction was sent.',
      positionLimit:'Demo allows one open paper position at a time.', clear:'CLEAR LOCAL DEMO HISTORY', cleared:'Local demo history cleared.',
      refreshDone:'Feed refreshed.', feeWarning:'Illustrative assumptions only'
    },
    ru: {
      title:'ZOMBIE SNIPER // ДЕМО-РЕЖИМ', intro:'Проверяй вход и выход по сделкам bonding curve Pump.fun в первые 60 секунд после создания токена. Демо не подписывает и не отправляет транзакции.',
      demo:'ТОЛЬКО ДЕМО', refresh:'ОБНОВИТЬ ЛЕНТУ ТОКЕНОВ', loading:'Сканируем последние публичные профили токенов…', failed:'Публичная лента временно недоступна. Попробуйте позже.',
      source:'Источник: поток новых Mint PumpPortal и сделки bonding curve по каждому Mint в первые 60 секунд. Для потока сделок нужен API-ключ и привязанный кошелёк; открытые позиции продолжают отслеживаться. DexScreener используется только как резервный источник отображения.',
      amount:'РАЗМЕР ДЕМО-ПОКУПКИ (SOL)', target:'ЦЕЛЬ ЧИСТОЙ ПРИБЫЛИ (%)', stop:'СТОП-ЛОСС ПО ЧИСТОМУ P/L (%)',
      network:'СЕТЕВАЯ КОМИССИЯ / TX (SOL)', priority:'ПРИОРИТЕТНАЯ КОМИССИЯ / TX (SOL)', dex:'КОМИССИЯ DEX / СТОРОНА (%)', slip:'ПРОСКАЛЬЗЫВАНИЕ / СТОРОНА (%)',
      assumptions:'Редактируемые допущения по расходам — не актуальные котировки комиссий. Фактические расходы зависят от маршрута, нагрузки сети, ликвидности и состояния кошелька.',
      candidates:'ПОСЛЕДНИЕ ПРОФИЛИ ТОКЕНОВ SOLANA', noCandidates:'В последней пачке профилей не найдено подходящих пулов с котировкой в SOL.',
      token:'ТОКЕН', age:'ВОЗРАСТ ПАРЫ', liquidity:'ЛИКВИДНОСТЬ', price:'ЦЕНА (SOL)', action:'ДЕМО-ПОКУПКА',
      positions:'ДЕМО-ПОЗИЦИИ', noPositions:'Демо-позиций пока нет. Выберите токен выше, чтобы смоделировать покупку.',
      open:'ОТКРЫТА', closed:'ЗАКРЫТА', entry:'ВХОД', current:'ТЕКУЩАЯ', net:'ЧИСТЫЙ P/L', targetHit:'ЦЕЛЬ ПО ЧИСТОЙ ПРИБЫЛИ ДОСТИГНУТА — ДЕМО-ПРОДАЖА',
      stopHit:'СТОП-ЛОСС ПО ЧИСТОМУ P/L ДОСТИГНУТ — ДЕМО-ПРОДАЖА', manualClose:'ЗАКРЫТЬ ДЕМО-ПОЗИЦИЮ', saved:'История демо хранится только в этом браузере на этом устройстве.', synced:'История демо синхронизирована с профилем Telegram.', loginToSync:'Войдите через Telegram для синхронизации; иначе история останется в этом браузере.', loginAgain:'Сессия Telegram истекла. Войдите снова для синхронизации.', syncError:'Синхронизация недоступна; локальная копия сохранена.',
      rules:'Чистый P/L учитывает комиссии DEX и проскальзывание на обеих сторонах, а также сетевые и приоритетные комиссии обеих транзакций. Цель проверяется по чистому P/L, а не по изменению цены токена.',
      cap:"Размер демо-сделки ограничен только доступным виртуальным капиталом. Кошелёк и реальные транзакции не используются.",
      ageUnknown:'неизвестно', justNow:'только что', mins:' мин. назад', hours:' ч. назад', days:' дн. назад', liveConnected:'ПОТОК ЗАПУСКОВ АКТИВЕН', liveDisconnected:'ПОТОК ОТКЛЮЧЁН — РЕЗЕРВ DEXSCREENER', waitingForPool:'ОЖИДАНИЕ SOL-ПУЛА', liveTag:'НОВЫЙ ЗАПУСК',
      needAmount:"Размер демо-покупки должен быть больше нуля и не превышать доступный виртуальный капитал.",
      noPair:'Для этого токена нет текущего пула с котировкой в SOL.', buyOk:'Демо-позиция открыта. Транзакция не отправлялась.',
      positionLimit:'В демо допускается только одна открытая позиция одновременно.', clear:'ОЧИСТИТЬ ЛОКАЛЬНУЮ ИСТОРИЮ', cleared:'Локальная история демо очищена.',
      refreshDone:'Лента обновлена.', feeWarning:'Только примерные допущения'
    },
    de: {title:'ZOMBIE SNIPER // PAPER-DEMO',intro:'Teste Ein- und Ausstiegsregeln mit öffentlichen DEX-Marktdaten. Keine Wallet-Verbindung und keine Transaktionen.',demo:'NUR DEMO',refresh:'TOKENLISTE AKTUALISIEREN',loading:'Neueste öffentliche Tokenprofile werden geladen…',failed:'Der öffentliche Feed ist vorübergehend nicht verfügbar.',source:'Quelle: kostenloser PumpPortal-WebSocket für neue Token/Migrationen plus DexScreener-SOL-Paare; DexScreener-Profile dienen als Fallback. Feed und Indexierung können verzögert sein; Einstieg in der ersten Minute ist nicht garantiert.',amount:'DEMO-KAUFGRÖSSE (SOL)',target:'NETTO-GEWINNZIEL (%)',stop:'NETTO-STOP-LOSS (%)',network:'NETZWERKGEBÜHR / TX (SOL)',priority:'PRIORITÄTSGEBÜHR / TX (SOL)',dex:'DEX-GEBÜHR / SEITE (%)',slip:'SLIPPAGE / SEITE (%)',assumptions:'Bearbeitbare Kostenannahmen, keine Live-Gebührenquotes.',candidates:'NEUESTE SOLANA-TOKENPROFILE',noCandidates:'Keine passenden SOL-Paare gefunden.',token:'TOKEN',age:'PAIR-ALTER',liquidity:'LIQUIDITÄT',price:'PREIS (SOL)',action:'DEMO-KAUF',positions:'DEMO-POSITIONEN',noPositions:'Noch keine Demo-Positionen.',open:'OFFEN',closed:'GESCHLOSSEN',entry:'EINSTIEG',current:'AKTUELL',net:'NETTO-P/L',targetHit:'NETTOZIEL ERREICHT — DEMO-VERKAUF',stopHit:'STOP-LOSS ERREICHT — DEMO-VERKAUF',manualClose:'DEMO-POSITION SCHLIESSEN',saved:'Demo-Verlauf wird nur lokal in diesem Browser gespeichert.', synced:'Demo-Verlauf mit deinem Telegram-Profil synchronisiert.', loginToSync:'Mit Telegram anmelden, um den Demo-Verlauf zu synchronisieren.', loginAgain:'Telegram-Sitzung abgelaufen. Bitte erneut anmelden.', syncError:'Synchronisierung nicht verfügbar; lokale Kopie bleibt erhalten.',rules:'Netto-P/L berücksichtigt DEX-Gebühren und Slippage auf beiden Seiten sowie Netzwerk- und Prioritätsgebühren für beide Transaktionen.',cap:"Die Demo-Handelsgröße ist nur durch das virtuelle Guthaben begrenzt. Keine Wallet und keine echten Transaktionen.",ageUnknown:'unbekannt',justNow:'gerade eben',mins:' Min.',hours:' Std.',days:' Tg.',needAmount:"Die Demo-Kaufgröße muss größer als null sein und darf das verfügbare virtuelle Guthaben nicht überschreiten.",noPair:'Kein aktuelles SOL-Paar verfügbar.',buyOk:'Demo-Position eröffnet. Keine Transaktion gesendet.',positionLimit:'Nur eine offene Demo-Position gleichzeitig.',clear:'LOKALE DEMO-HISTORIE LÖSCHEN',cleared:'Lokale Demo-Historie gelöscht.',refreshDone:'Feed aktualisiert.'},
    fr: {title:'ZOMBIE SNIPER // DÉMO PAPIER',intro:'Testez les règles avec des données DEX publiques. Aucun portefeuille ni aucune transaction.',demo:'DÉMO UNIQUEMENT',refresh:'ACTUALISER LES TOKENS',loading:'Analyse des derniers profils publics…',failed:'Flux public temporairement indisponible.',source:'Source : flux WebSocket gratuit PumpPortal (nouveaux tokens/migrations) et paires SOL DexScreener ; les profils DexScreener servent de secours. Le flux et l’indexation peuvent être retardés ; aucune entrée dans la première minute n’est garantie.',amount:'TAILLE ACHAT DÉMO (SOL)',target:'OBJECTIF DE PROFIT NET (%)',stop:'STOP-LOSS NET (%)',network:'FRAIS RÉSEAU / TX (SOL)',priority:'FRAIS PRIORITAIRES / TX (SOL)',dex:'FRAIS DEX / CÔTÉ (%)',slip:'GLISSEMENT / CÔTÉ (%)',assumptions:'Hypothèses modifiables, pas des devis de frais en direct.',candidates:'DERNIERS PROFILS DE TOKENS SOLANA',noCandidates:'Aucune paire SOL appropriée trouvée.',token:'TOKEN',age:'ÂGE DE PAIRE',liquidity:'LIQUIDITÉ',price:'PRIX (SOL)',action:'ACHAT DÉMO',positions:'POSITIONS DÉMO',noPositions:'Aucune position démo pour le moment.',open:'OUVERTE',closed:'FERMÉE',entry:'ENTRÉE',current:'ACTUEL',net:'P/L NET',targetHit:'OBJECTIF NET ATTEINT — VENTE SIMULÉE',stopHit:'STOP-LOSS NET ATTEINT — VENTE SIMULÉE',manualClose:'FERMER LA POSITION DÉMO',saved:'Historique enregistré uniquement dans ce navigateur.', synced:'Historique synchronisé avec votre profil Telegram.', loginToSync:'Connectez-vous avec Telegram pour synchroniser l’historique.', loginAgain:'Session Telegram expirée. Reconnectez-vous.', syncError:'Synchronisation indisponible ; copie locale conservée.',rules:'Le P/L net inclut frais DEX et glissement à l’achat et à la vente, plus frais réseau et prioritaires des deux transactions.',cap:"La taille de la démo est limitée uniquement par le capital virtuel disponible. Aucun portefeuille ni transaction réelle.",ageUnknown:'inconnu',justNow:'à l’instant',mins:' min',hours:' h',days:' j',needAmount:"La taille d'achat démo doit être supérieure à zéro et ne pas dépasser le capital virtuel disponible.",noPair:'Aucune paire SOL actuelle disponible.',buyOk:'Position démo ouverte. Aucune transaction envoyée.',positionLimit:'Une seule position démo ouverte à la fois.',clear:'EFFACER L’HISTORIQUE LOCAL',cleared:'Historique local effacé.',refreshDone:'Flux actualisé.'},
    it: {title:'ZOMBIE SNIPER // DEMO CARTA',intro:'Prova le regole con dati DEX pubblici. Nessun wallet e nessuna transazione.',demo:'SOLO DEMO',refresh:'AGGIORNA TOKEN',loading:'Scansione degli ultimi profili pubblici…',failed:'Feed pubblico temporaneamente non disponibile.',source:'Fonte: WebSocket gratuito PumpPortal per nuovi token/migrazioni e snapshot delle coppie SOL DexScreener; i profili DexScreener sono il fallback. Feed e indicizzazione possono subire ritardi; l’ingresso nel primo minuto non è garantito.',amount:'DIMENSIONE ACQUISTO DEMO (SOL)',target:'OBIETTIVO PROFITTO NETTO (%)',stop:'STOP-LOSS NETTO (%)',network:'FEE RETE / TX (SOL)',priority:'FEE PRIORITARIA / TX (SOL)',dex:'FEE DEX / LATO (%)',slip:'SLIPPAGE / LATO (%)',assumptions:'Ipotesi di costo modificabili, non preventivi live.',candidates:'ULTIMI PROFILI TOKEN SOLANA',noCandidates:'Nessuna coppia SOL idonea trovata.',token:'TOKEN',age:'ETÀ COPPIA',liquidity:'LIQUIDITÀ',price:'PREZZO (SOL)',action:'ACQUISTO DEMO',positions:'POSIZIONI DEMO',noPositions:'Nessuna posizione demo ancora.',open:'APERTA',closed:'CHIUSA',entry:'INGRESSO',current:'ATTUALE',net:'P/L NETTO',targetHit:'OBIETTIVO NETTO RAGGIUNTO — VENDITA SIMULATA',stopHit:'STOP-LOSS NETTO RAGGIUNTO — VENDITA SIMULATA',manualClose:'CHIUDI POSIZIONE DEMO',saved:'Cronologia salvata solo in questo browser.', synced:'Cronologia sincronizzata con il profilo Telegram.', loginToSync:'Accedi con Telegram per sincronizzare la cronologia.', loginAgain:'Sessione Telegram scaduta. Accedi di nuovo.', syncError:'Sincronizzazione non disponibile; copia locale conservata.',rules:'Il P/L netto include fee DEX e slippage su entrambi i lati, oltre alle fee di rete e priorità per entrambe le transazioni.',cap:"La dimensione demo è limitata solo dal capitale virtuale disponibile. Nessun wallet né transazione reale.",ageUnknown:'sconosciuta',justNow:'adesso',mins:' min fa',hours:' h fa',days:' gg fa',needAmount:"La dimensione dell'acquisto demo deve essere maggiore di zero e non superare il capitale virtuale disponibile.",noPair:'Nessuna coppia SOL attuale disponibile.',buyOk:'Posizione demo aperta. Nessuna transazione inviata.',positionLimit:'Una sola posizione demo aperta alla volta.',clear:'CANCELLA CRONOLOGIA LOCALE',cleared:'Cronologia locale cancellata.',refreshDone:'Feed aggiornato.'},
    ja: {title:'ZOMBIE SNIPER // ペーパーデモ',intro:'公開DEXデータで売買ルールをテストします。ウォレット接続や実取引はありません。',demo:'デモ専用',refresh:'トークン一覧を更新',loading:'最新の公開トークンプロフィールを確認中…',failed:'公開フィードを一時的に取得できません。',source:'出典：PumpPortalの無料新規トークン／移行WebSocketとDexScreenerのSOLペア情報。DexScreener最新プロフィールは代替ソースです。配信やDEXの反映には遅延があり、最初の1分以内の約定は保証されません。',amount:'デモ購入額 (SOL)',target:'純利益目標 (%)',stop:'純損失ストップ (%)',network:'ネットワーク手数料 / TX (SOL)',priority:'優先手数料 / TX (SOL)',dex:'DEX手数料 / 片道 (%)',slip:'スリッページ / 片道 (%)',assumptions:'編集可能な費用仮定です。リアルタイム手数料見積もりではありません。',candidates:'最新のSOLANAトークンプロフィール',noCandidates:'対象となるSOLペアが見つかりません。',token:'トークン',age:'ペア経過時間',liquidity:'流動性',price:'価格 (SOL)',action:'デモ購入',positions:'デモポジション',noPositions:'デモポジションはまだありません。',open:'保有中',closed:'終了',entry:'購入時',current:'現在',net:'純損益',targetHit:'純利益目標達成 — 模擬売却',stopHit:'ストップ到達 — 模擬売却',manualClose:'デモポジションを終了',saved:'履歴はこのブラウザー内にのみ保存されます。', synced:'Telegramプロフィールとデモ履歴を同期しました。', loginToSync:'Telegramにログインするとデモ履歴を同期できます。', loginAgain:'Telegramセッションの期限が切れました。再ログインしてください。', syncError:'同期できません。ローカルコピーは保存されています。',rules:'純損益には往復のDEX手数料、スリッページ、ネットワーク・優先手数料を含みます。',cap:"デモ取引額は利用可能な仮想資金のみで制限されます。ウォレットや実取引は使用しません。",ageUnknown:'不明',justNow:'たった今',mins:'分前',hours:'時間前',days:'日前',needAmount:"デモ購入額は0より大きく、利用可能な仮想資金以下である必要があります。",noPair:'現在のSOLペアがありません。',buyOk:'デモポジションを開始しました。取引は送信されていません。',positionLimit:'同時に保有できるデモポジションは1つです。',clear:'ローカル履歴を消去',cleared:'ローカル履歴を消去しました。',refreshDone:'フィードを更新しました。'},
    'zh-CN': {title:'ZOMBIE SNIPER // 模拟演练',intro:'使用公开DEX行情测试买卖规则。不连接钱包，不发送真实交易。',demo:'仅限模拟',refresh:'刷新代币列表',loading:'正在扫描最新公开代币资料…',failed:'公开数据暂时不可用，请稍后再试。',source:'来源：PumpPortal免费新代币/迁移WebSocket及DexScreener的SOL交易对快照；DexScreener最新资料作为备用。数据推送和DEX索引可能延迟，不能保证在首分钟内成交。',amount:'模拟买入金额 (SOL)',target:'净利润目标 (%)',stop:'净止损 (%)',network:'网络费 / 每笔 (SOL)',priority:'优先费 / 每笔 (SOL)',dex:'DEX费用 / 单边 (%)',slip:'滑点 / 单边 (%)',assumptions:'可编辑的成本假设，不是实时交易费用报价。',candidates:'最新SOLANA代币资料',noCandidates:'未找到符合条件的SOL交易对。',token:'代币',age:'交易对年龄',liquidity:'流动性',price:'价格 (SOL)',action:'模拟买入',positions:'模拟持仓',noPositions:'暂无模拟持仓。',open:'持有中',closed:'已关闭',entry:'买入价',current:'当前价',net:'净盈亏',targetHit:'达到净利润目标 — 模拟卖出',stopHit:'达到净止损 — 模拟卖出',manualClose:'关闭模拟持仓',saved:'模拟记录仅保存在此浏览器中。', synced:'模拟记录已同步到Telegram幸存者档案。', loginToSync:'登录Telegram以同步模拟记录。', loginAgain:'Telegram会话已过期，请重新登录。', syncError:'暂时无法同步；本地副本已保留。',rules:'净盈亏包含买卖两边的DEX费用和滑点，以及两笔交易的网络费和优先费。',cap:"模拟交易金额仅受可用虚拟资金限制。不连接钱包，不进行真实交易。",ageUnknown:'未知',justNow:'刚刚',mins:'分钟前',hours:'小时前',days:'天前',needAmount:"模拟买入金额必须大于零且不得超过可用虚拟资金。",noPair:'当前没有可用的SOL交易对。',buyOk:'模拟持仓已开启。未发送交易。',positionLimit:'同时只允许一个模拟持仓。',clear:'清除本地模拟记录',cleared:'本地模拟记录已清除。',refreshDone:'列表已刷新。'},
    tr: {title:'ZOMBIE SNIPER // DEMO',intro:'Herkese açık DEX verileriyle giriş/çıkış kurallarını test edin. Cüzdan bağlanmaz, işlem gönderilmez.',demo:'SADECE DEMO',refresh:'TOKEN AKIŞINI YENİLE',loading:'En yeni herkese açık token profilleri taranıyor…',failed:'Herkese açık akış geçici olarak kullanılamıyor.',source:'Kaynak: PumpPortal ücretsiz yeni token/geçiş WebSocket akışı ve DexScreener SOL paritesi anlık görüntüleri; DexScreener profilleri yedek kaynaktır. Akış ve indeksleme gecikebilir; ilk dakika içinde giriş garanti edilmez.',amount:'DEMO ALIM MİKTARI (SOL)',target:'NET KÂR HEDEFİ (%)',stop:'NET ZARAR DURDUR (%)',network:'AĞ ÜCRETİ / TX (SOL)',priority:'ÖNCELİK ÜCRETİ / TX (SOL)',dex:'DEX ÜCRETİ / TARAF (%)',slip:'KAYMA / TARAF (%)',assumptions:'Düzenlenebilir maliyet varsayımları; canlı ücret teklifi değildir.',candidates:'SON SOLANA TOKEN PROFİLLERİ',noCandidates:'Uygun SOL paritesi bulunamadı.',token:'TOKEN',age:'PARİTE YAŞI',liquidity:'LİKİDİTE',price:'FİYAT (SOL)',action:'DEMO ALIM',positions:'DEMO POZİSYONLARI',noPositions:'Henüz demo pozisyonu yok.',open:'AÇIK',closed:'KAPALI',entry:'GİRİŞ',current:'GÜNCEL',net:'NET K/Z',targetHit:'NET HEDEFE ULAŞILDI — SİMÜLE SATIŞ',stopHit:'STOP-LOSS TETİKLENDİ — SİMÜLE SATIŞ',manualClose:'DEMO POZİSYONUNU KAPAT',saved:'Demo geçmişi yalnızca bu tarayıcıda saklanır.', synced:'Demo geçmişi Telegram profilinizle eşitlendi.', loginToSync:'Demo geçmişini eşitlemek için Telegram ile giriş yapın.', loginAgain:'Telegram oturumunun süresi doldu. Yeniden giriş yapın.', syncError:'Eşitleme kullanılamıyor; yerel kopya korundu.',rules:'Net K/Z; iki yönlü DEX ücreti ve kaymayı, ayrıca iki işlem için ağ ve öncelik ücretlerini içerir.',cap:"Demo işlem boyutu yalnızca mevcut sanal sermayeyle sınırlıdır. Cüzdan veya gerçek işlem kullanılmaz.",ageUnknown:'bilinmiyor',justNow:'şimdi',mins:' dk önce',hours:' sa önce',days:' gün önce',needAmount:"Demo alım miktarı sıfırdan büyük olmalı ve mevcut sanal sermayeyi aşmamalıdır.",noPair:'Güncel SOL paritesi bulunmuyor.',buyOk:'Demo pozisyonu açıldı. İşlem gönderilmedi.',positionLimit:'Aynı anda yalnızca bir açık demo pozisyonu olabilir.',clear:'YEREL DEMO GEÇMİŞİNİ TEMİZLE',cleared:'Yerel demo geçmişi temizlendi.'},
    hi: {title:'ZOMBIE SNIPER // डेमो मोड',intro:'सार्वजनिक DEX डेटा पर एंट्री और एग्ज़िट नियम जाँचें। वॉलेट कनेक्ट नहीं होता और कोई असली लेनदेन नहीं भेजा जाता।',demo:'केवल डेमो',refresh:'टोकन फ़ीड रीफ़्रेश करें',loading:'नवीनतम सार्वजनिक टोकन प्रोफ़ाइल स्कैन हो रही हैं…',failed:'सार्वजनिक फ़ीड अस्थायी रूप से उपलब्ध नहीं है।',source:'स्रोत: PumpPortal की मुफ़्त नए-टोकन/माइग्रेशन WebSocket फ़ीड और DexScreener SOL-पेयर स्नैपशॉट; DexScreener प्रोफ़ाइल बैकअप स्रोत हैं। फ़ीड और इंडेक्सिंग में देरी हो सकती है; पहले मिनट में एंट्री की गारंटी नहीं।',amount:'डेमो खरीद राशि (SOL)',target:'शुद्ध लाभ लक्ष्य (%)',stop:'शुद्ध स्टॉप-लॉस (%)',network:'नेटवर्क शुल्क / TX (SOL)',priority:'प्रायोरिटी शुल्क / TX (SOL)',dex:'DEX शुल्क / पक्ष (%)',slip:'स्लिपेज / पक्ष (%)',assumptions:'बदलने योग्य लागत अनुमान; लाइव शुल्क कोट नहीं।',candidates:'नवीनतम SOLANA टोकन प्रोफ़ाइल',noCandidates:'उपयुक्त SOL पेयर नहीं मिला।',token:'टोकन',age:'पेयर आयु',liquidity:'लिक्विडिटी',price:'कीमत (SOL)',action:'डेमो खरीद',positions:'डेमो पोज़िशन',noPositions:'अभी कोई डेमो पोज़िशन नहीं।',open:'खुली',closed:'बंद',entry:'एंट्री',current:'वर्तमान',net:'शुद्ध P/L',targetHit:'शुद्ध लक्ष्य पूरा — सिम्युलेटेड बिक्री',stopHit:'स्टॉप-लॉस पूरा — सिम्युलेटेड बिक्री',manualClose:'डेमो पोज़िशन बंद करें',saved:'डेमो इतिहास केवल इसी ब्राउज़र में सहेजा जाता है।', synced:'डेमो इतिहास Telegram प्रोफ़ाइल से सिंक हो गया।', loginToSync:'डेमो इतिहास सिंक करने के लिए Telegram से लॉग इन करें।', loginAgain:'Telegram सत्र समाप्त हो गया। फिर से लॉग इन करें।', syncError:'सिंक उपलब्ध नहीं है; स्थानीय कॉपी सुरक्षित है।',rules:'शुद्ध P/L में दोनों तरफ़ के DEX शुल्क और स्लिपेज तथा दोनों लेनदेन के नेटवर्क और प्रायोरिटी शुल्क शामिल हैं।',cap:"डेमो ट्रेड का आकार केवल उपलब्ध वर्चुअल पूँजी तक सीमित है। कोई वॉलेट या वास्तविक लेनदेन नहीं।",ageUnknown:'अज्ञात',justNow:'अभी',mins:' मिनट पहले',hours:' घंटे पहले',days:' दिन पहले',needAmount:"डेमो खरीद राशि शून्य से अधिक और उपलब्ध वर्चुअल पूँजी से अधिक नहीं होनी चाहिए。",noPair:'वर्तमान SOL पेयर उपलब्ध नहीं है।',buyOk:'डेमो पोज़िशन खुली। कोई लेनदेन नहीं भेजा गया।',positionLimit:'एक समय में केवल एक खुली डेमो पोज़िशन।',clear:'स्थानीय डेमो इतिहास साफ़ करें',cleared:'स्थानीय डेमो इतिहास साफ़ किया गया।'}
  };

  const $ = id => document.getElementById(id);
  const state = { lang:'en', candidates:[], positions:[], timer:null, positionTimer:null, busy:false, syncStatusKey:'saved', historyRevision:0, source:'all', requireSocials:true, nameQuery:'', creatorFilter:'any', feed:{connected:false,pumpdevEnabled:false,pumpdevConnected:false,pumpdevStatus:'unknown',paperEngineEnabled:false,paperEngineStatus:'waiting_for_trade_data_source'} };
  let activeStorageKey = '';
  function detectLang(){
    const path = location.pathname.split('/').filter(Boolean);
    const candidate = path.length && copy[path[0]] ? path[0] : (document.documentElement.lang || 'en');
    state.lang = copy[candidate] ? candidate : 'en';
  }
  const t = key => (copy[state.lang] && copy[state.lang][key]) || copy.en[key] || key;
  function authToken(){try{return localStorage.getItem(TOKEN_KEY)||'';}catch(_){return '';}}
  function telegramId(){try{const p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');return p&&p.telegramId?String(p.telegramId):'';}catch(_){return '';}}
  function storageKey(){const id=telegramId();return STORAGE_KEY+(id?'_'+id:'_guest');}
  function readStore(){
    try {
      const value = JSON.parse(localStorage.getItem(storageKey()) || '{}');
      state.positions = Array.isArray(value.positions) ? value.positions.slice(0,50).map(p=>({...p,_ownerTelegramId:telegramId()||'guest'})) : [];
    } catch (_) { state.positions = []; }
  }
  function saveStore(){
    try { localStorage.setItem(storageKey(), JSON.stringify({positions:state.positions.slice(0,50),savedAt:Date.now()})); } catch (_) {}
  }
  function updateSyncStatus(key){state.syncStatusKey=key;const node=document.querySelector('.sniper-demo [data-sniper-i18n="saved"]');if(node)node.textContent=t(key);}
  function makeUuid(){if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16);});}
  function mapServerPosition(p){return {id:String(p.id),address:String(p.mint),symbol:String(p.symbol||'TOKEN'),name:String(p.name||''),buySol:Number(p.buySol),entryPrice:Number(p.entryPrice),lastPrice:Number(p.lastPrice),quantity:Number(p.quantity),netPnl:Number(p.netPnl||0),netPct:Number(p.netPct||0),status:p.status==='closed'?'closed':'open',exitReason:p.exitReason||null,openedAt:Number(p.openedAt)||Date.now(),closedAt:p.closedAt?Number(p.closedAt):null,sellSol:Number(p.sellSol)||0,_ownerTelegramId:telegramId()};}
  async function persistPosition(p){
    const token=authToken(),accountId=telegramId();
    if(!token||!accountId||p._ownerTelegramId!==accountId)return;
    const payload={...p};delete payload._ownerTelegramId;
    try{
      const response=await fetch(AUTH_API+'/api/sniper/paper',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({position:payload}),cache:'no-store'});
      if(telegramId()!==accountId||authToken()!==token)return;
      if(response.status===401){updateSyncStatus('loginAgain');return;}
      if(!response.ok){updateSyncStatus('syncError');return;}
      const data=await response.json();if(data.position&&data.position.id)p.id=String(data.position.id);
      saveStore();updateSyncStatus('synced');
    }catch(_){if(telegramId()===accountId&&authToken()===token)updateSyncStatus('syncError');}
  }
  async function setServerPaperEnabled(enabled){
    const token=authToken();
    if(!token){
      try{
        const response=await fetch(AUTH_API+'/api/sniper/demo-feed',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({enabled:!!enabled}),cache:'no-store'
        });
        if(!response.ok)return false;
        return true;
      }catch(_){window.alert(uiText('serverEngineError'));return false;}
    }
    try{
      const response=await fetch(AUTH_API+'/api/sniper/settings',{
        method:'POST',
        headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
        body:JSON.stringify({
          enabled:!!enabled,mode:'paper',
          paperCapitalSol:Number($('sniper-capital')&&$('sniper-capital').value)||10,
          maxTradeSol:Math.min(Number($('sniper-capital')&&$('sniper-capital').value)||10,Number($('sniper-size')&&$('sniper-size').value)||0.01),
          maxOpenPositions:Math.max(1,Math.min(20,Math.round(Number($('sniper-max-open')&&$('sniper-max-open').value)||4))),
          maxDailyLossSol:Math.max(0,Math.min(1000,Number(($('sniper-max-daily-loss')||{}).value??1))),
          minBuyCount:Math.max(1,Math.min(100,Math.round(Number($('sniper-min-buys')&&$('sniper-min-buys').value)||3))),
          creatorPolicy:state.creatorFilter,
          requireSocials:!!state.requireSocials,
          takeProfitPct:Number($('sniper-target')&&$('sniper-target').value)||10,
          stopLossPct:Number($('sniper-stop')&&$('sniper-stop').value)||5,
          minPriceMovePct:Number($('sniper-min-move')&&$('sniper-min-move').value)||0.2,
          idleExitSeconds:Number($('sniper-idle-timeout')&&$('sniper-idle-timeout').value)||60,
          paperFeeBps:Math.min(5000,Math.round(20000*(1-(1-(Number($('sniper-dex')&&$('sniper-dex').value)||0)/100)*(1-(Number($('sniper-slip')&&$('sniper-slip').value)||0)/100)))),
          paperNetworkFeeSol:Math.min(0.01,(Number($('sniper-network')&&$('sniper-network').value)||0)+(Number($('sniper-priority')&&$('sniper-priority').value)||0))
        }),
        cache:'no-store'
      });
      if(!response.ok){
        const data=await response.json().catch(()=>({}));
        window.alert(data.error||'Could not update server paper engine settings.');
        return false;
      }
      return true;
    }catch(_){
      window.alert(uiText('serverEngineError'));
      return false;
    }
  }

  const SNIPER_UI_COPY = {"en":{"noMatches":"No coins match the active filters. Relax a filter or choose another source.","noClosed":"No closed trades yet","noOpen":"No open positions right now","statusOpen":"OPEN","statusClosed":"CLOSED","tradeSize":"TRADE SIZE","entryPrice":"ENTRY PRICE","exitPrice":"EXIT PRICE","currentPrice":"CURRENT PRICE","tradeResult":"TRADE RESULT","currentPnl":"CURRENT P/L","contract":"CONTRACT","addressNA":"Address unavailable","closedPrefix":"CLOSED: ","sources":"SOURCES: ","sourcesUnavailable":"SOURCES UNAVAILABLE: ","dailyLoss":"Daily loss limit reached. New trades are paused.","tradeSizeError":"Trade size must be positive and within your configured maximum.","lowLiquidity":"Token liquidity is below your configured minimum.","noBalance":"Insufficient virtual balance.","history":"TRADE HISTORY","waitingPumpDev":"Auto demo is waiting for PumpDev.","socialsOnly":"SOCIALS ONLY","filterTicker":"Filter name / ticker","allSources":"ALL SOURCES","pumpLaunches":"PUMP.FUN LAUNCHES","boostMonitor":"BOOST MONITOR","community":"ZOMBIE LAB / COMMUNITY","anyDev":"ANY DEV","firstSeen":"FIRST SEEN","repeatDev":"REPEAT DEV","recommended":"RECOMMENDED PROFILES","presetNote":"Ready-made paper-testing profiles. Demo settings only.","conservative":"Conservative","balanced":"Balanced","aggressive":"Aggressive","idleTimeout":"NO-MOVEMENT TIMEOUT (SEC)","minMove":"MINIMUM PRICE MOVE (%)","minBuys":"MINIMUM FIRST-MINUTE BUYS","maxDailyLoss":"MAX DAILY LOSS (SOL)","maxOpen":"MAX SIMULTANEOUS OPEN TRADES","statsHeading":"SIMULATION PERFORMANCE","equityCurve":"SESSION EQUITY CURVE","sinceStart":"SOL · SINCE SESSION START","closedTrades":"CLOSED TRADES","winsLosses":"WINS / LOSSES","start":"START ","now":"NOW ","totalExposure":"TOTAL OPEN EXPOSURE","openPositions":"OPEN POSITIONS: ","liveUnrealized":"LIVE UNREALIZED P/L","realized":"REALIZED P/L","average":"AVERAGE RESULT","best":"BEST TRADE","worst":"WORST TRADE","waitingPumpDevLong":"Auto demo is waiting for the PumpDev trade feed. Manual virtual buys remain available.","presetAppliedPrefix":"Applied profile: ","sessionTurnover":"SESSION TURNOVER","runtimeRunning":"AUTO TRADING · RUNNING","runtimeStopped":"AUTO TRADING · STOPPED","noNewTrades":"New trades are disabled (limit is 0).","maxOpenReached":"Maximum simultaneous open trades reached ({count}).","serverEngineError":"Could not reach the server paper engine.","buy":"BUY","sell":"SELL","net":"NET","move":"MOVE","socials":"SOCIALS","devRepeat":"REPEAT","devFirstSeen":"FIRST SEEN","boosts":"BOOSTS","communityVotes":"COMMUNITY","dexProfile":"DEX PROFILE"},"ru":{"noMatches":"Нет монет, соответствующих фильтрам. Ослабьте фильтры или выберите другой источник.","noClosed":"Закрытых сделок пока нет","noOpen":"Сейчас нет открытых сделок","statusOpen":"ОТКРЫТА","statusClosed":"ЗАКРЫТА","tradeSize":"РАЗМЕР СДЕЛКИ","entryPrice":"ЦЕНА ВХОДА","exitPrice":"ЦЕНА ВЫХОДА","currentPrice":"ТЕКУЩАЯ ЦЕНА","tradeResult":"ИТОГ СДЕЛКИ","currentPnl":"ТЕКУЩАЯ ПРИБЫЛЬ / УБЫТОК","contract":"КОНТРАКТ","addressNA":"Адрес недоступен","closedPrefix":"ЗАКРЫТА: ","sources":"ИСТОЧНИКИ: ","sourcesUnavailable":"ИСТОЧНИКИ НЕДОСТУПНЫ: ","dailyLoss":"Достигнут дневной лимит убытка. Новые сделки остановлены.","tradeSizeError":"Размер сделки должен быть больше нуля и не превышать установленный максимум.","lowLiquidity":"Ликвидность ниже установленного минимума.","noBalance":"Недостаточно виртуального баланса.","history":"ИСТОРИЯ СДЕЛОК","waitingPumpDev":"Автодемо ожидает подключения PumpDev.","socialsOnly":"ТОЛЬКО С СОЦСЕТЯМИ","filterTicker":"Фильтр названия / тикера","allSources":"ВСЕ ИСТОЧНИКИ","pumpLaunches":"ЗАПУСКИ PUMP.FUN","boostMonitor":"BOOST MONITOR","community":"ZOMBIE LAB / СООБЩЕСТВО","anyDev":"ЛЮБОЙ DEV","firstSeen":"ВПЕРВЫЕ В ЛЕНТЕ","repeatDev":"ПОВТОРНЫЙ DEV","recommended":"РЕКОМЕНДУЕМЫЕ ПРОФИЛИ","presetNote":"Готовые наборы для виртуальных испытаний. Меняют только демо-параметры.","conservative":"Консервативный","balanced":"Сбалансированный","aggressive":"Агрессивный","idleTimeout":"ТАЙМ-АУТ БЕЗ ДВИЖЕНИЯ (СЕК.)","minMove":"МИН. ДВИЖЕНИЕ ЦЕНЫ (%)","minBuys":"МИН. ПОКУПОК В ПЕРВОЙ МИНУТЕ","maxDailyLoss":"МАКС. ДНЕВНЫЙ УБЫТОК (SOL)","maxOpen":"МАКС. ОТКРЫТЫХ СДЕЛОК","statsHeading":"РЕЗУЛЬТАТЫ СИМУЛЯЦИИ","equityCurve":"ДИНАМИКА КАПИТАЛА ЗА СЕССИЮ","sinceStart":"SOL · С НАЧАЛА СЕССИИ","closedTrades":"ЗАКРЫТЫЕ СДЕЛКИ","winsLosses":"ПОБЕДЫ / ПОРАЖЕНИЯ","start":"СТАРТ ","now":"СЕЙЧАС ","totalExposure":"СУММА ОТКРЫТЫХ СДЕЛОК","openPositions":"ОТКРЫТЫХ ПОЗИЦИЙ: ","liveUnrealized":"ТЕКУЩАЯ ПРИБЫЛЬ / УБЫТОК","realized":"РЕАЛИЗОВАННЫЙ P/L","average":"СРЕДНИЙ РЕЗУЛЬТАТ","best":"ЛУЧШАЯ СДЕЛКА","worst":"ХУДШАЯ СДЕЛКА","waitingPumpDevLong":"Автодемо ожидает подключения торгового потока PumpDev. Ручные виртуальные покупки доступны.","presetAppliedPrefix":"Применён профиль: ","sessionTurnover":"ОБОРОТ ЗА СЕССИЮ","runtimeRunning":"АВТОТОРГОВЛЯ · РАБОТАЕТ","runtimeStopped":"АВТОТОРГОВЛЯ · ОСТАНОВЛЕНА","noNewTrades":"Открытие сделок отключено: лимит установлен на 0.","maxOpenReached":"Достигнут лимит одновременно открытых сделок ({count}).","serverEngineError":"Не удалось связаться с серверным демо-снайпером.","buy":"ПОКУПКА","sell":"ПРОДАЖА","net":"ЧИСТЫЙ P/L","move":"ИЗМЕНЕНИЕ","socials":"СОЦСЕТИ","devRepeat":"ПОВТОРНЫЙ","devFirstSeen":"ВПЕРВЫЕ","boosts":"БУСТЫ","communityVotes":"СООБЩЕСТВО","dexProfile":"ПРОФИЛЬ DEX"},"de":{"noMatches":"Keine Coins entsprechen den aktiven Filtern. Lockere einen Filter oder wähle eine andere Quelle.","noClosed":"Noch keine geschlossenen Trades","noOpen":"Derzeit keine offenen Positionen","statusOpen":"OFFEN","statusClosed":"GESCHLOSSEN","tradeSize":"HANDELSGRÖSSE","entryPrice":"EINSTIEGSPREIS","exitPrice":"AUSSTIEGSPREIS","currentPrice":"AKTUELLER PREIS","tradeResult":"HANDELSERGEBNIS","currentPnl":"AKTUELLES P/L","contract":"KONTRAKT","addressNA":"Adresse nicht verfügbar","closedPrefix":"GESCHLOSSEN: ","sources":"QUELLEN: ","sourcesUnavailable":"QUELLEN NICHT VERFÜGBAR: ","dailyLoss":"Tägliches Verlustlimit erreicht. Neue Trades sind pausiert.","tradeSizeError":"Die Handelsgröße muss positiv sein und darf das festgelegte Maximum nicht überschreiten.","lowLiquidity":"Die Token-Liquidität liegt unter dem festgelegten Minimum.","noBalance":"Virtuelles Guthaben nicht ausreichend.","history":"TRADE-VERLAUF","waitingPumpDev":"Auto-Demo wartet auf den PumpDev-Feed.","socialsOnly":"NUR MIT SOCIALS","filterTicker":"Name / Ticker filtern","allSources":"ALLE QUELLEN","pumpLaunches":"PUMP.FUN-STARTS","boostMonitor":"BOOST MONITOR","community":"ZOMBIE LAB / COMMUNITY","anyDev":"BELIEBIGER DEV","firstSeen":"ZUM ERSTEN MAL GESEHEN","repeatDev":"WIEDERHOLTER DEV","recommended":"EMPFOHLENE PROFILE","presetNote":"Vorgefertigte Profile für virtuelle Tests. Nur Demo-Einstellungen.","conservative":"Konservativ","balanced":"Ausgewogen","aggressive":"Aggressiv","idleTimeout":"ZEITLIMIT OHNE BEWEGUNG (SEK.)","minMove":"MINDESTPREISBEWEGUNG (%)","minBuys":"MINDESTANZAHL KÄUFE IN DER ERSTEN MINUTE","maxDailyLoss":"MAX. TÄGLICHER VERLUST (SOL)","maxOpen":"MAX. GLEICHZEITIG OFFENE TRADES","statsHeading":"SIMULATIONSLEISTUNG","equityCurve":"KAPITALVERLAUF DER SITZUNG","sinceStart":"SOL · SEIT SITZUNGSBEGINN","closedTrades":"GESCHLOSSENE TRADES","winsLosses":"SIEGE / NIEDERLAGEN","start":"START ","now":"JETZT ","totalExposure":"GESAMTES OFFENES EXPOSURE","openPositions":"OFFENE POSITIONEN: ","liveUnrealized":"LAUFENDES NICHT REALISIERTES P/L","realized":"REALISIERTES P/L","average":"DURCHSCHNITTSERGEBNIS","best":"BESTER TRADE","worst":"SCHLECHTESTER TRADE","waitingPumpDevLong":"Auto-Demo wartet auf den PumpDev-Feed. Manuelle virtuelle Käufe bleiben verfügbar.","presetAppliedPrefix":"Profil angewendet: ","sessionTurnover":"SITZUNGSUMSATZ","runtimeRunning":"AUTO-TRADING · LÄUFT","runtimeStopped":"AUTO-TRADING · GESTOPPT","noNewTrades":"Neue Trades sind deaktiviert (Limit ist 0).","maxOpenReached":"Maximale Anzahl gleichzeitiger offener Trades erreicht ({count}).","serverEngineError":"Verbindung zur serverseitigen Paper-Engine nicht möglich.","buy":"KÄUFE","sell":"VERKÄUFE","net":"NETTO","move":"BEWEGUNG","socials":"SOCIALS","devRepeat":"WIEDERHOLT","devFirstSeen":"ERSTMALS","boosts":"BOOSTS","communityVotes":"COMMUNITY","dexProfile":"DEX-PROFIL"},"fr":{"noMatches":"Aucun jeton ne correspond aux filtres actifs. Assouplissez un filtre ou choisissez une autre source.","noClosed":"Aucune transaction clôturée pour le moment","noOpen":"Aucune position ouverte pour le moment","statusOpen":"OUVERTE","statusClosed":"FERMÉE","tradeSize":"TAILLE DE TRANSACTION","entryPrice":"PRIX D’ENTRÉE","exitPrice":"PRIX DE SORTIE","currentPrice":"PRIX ACTUEL","tradeResult":"RÉSULTAT DE LA TRANSACTION","currentPnl":"P/L ACTUEL","contract":"CONTRAT","addressNA":"Adresse indisponible","closedPrefix":"CLÔTURÉE : ","sources":"SOURCES : ","sourcesUnavailable":"SOURCES INDISPONIBLES : ","dailyLoss":"Limite de perte quotidienne atteinte. Les nouvelles transactions sont suspendues.","tradeSizeError":"La taille doit être positive et ne pas dépasser le maximum défini.","lowLiquidity":"La liquidité du jeton est inférieure au minimum défini.","noBalance":"Solde virtuel insuffisant.","history":"HISTORIQUE DES TRANSACTIONS","waitingPumpDev":"La démo automatique attend le flux PumpDev.","socialsOnly":"RÉSEAUX SOCIAUX UNIQUEMENT","filterTicker":"Filtrer le nom / ticker","allSources":"TOUTES LES SOURCES","pumpLaunches":"LANCEMENTS PUMP.FUN","boostMonitor":"BOOST MONITOR","community":"ZOMBIE LAB / COMMUNAUTÉ","anyDev":"TOUT DEV","firstSeen":"PREMIÈRE APPARITION","repeatDev":"DEV RÉCURRENT","recommended":"PROFILS RECOMMANDÉS","presetNote":"Profils prêts à l’emploi pour les tests virtuels. Paramètres de démo uniquement.","conservative":"Prudent","balanced":"Équilibré","aggressive":"Agressif","idleTimeout":"DÉLAI SANS MOUVEMENT (S)","minMove":"MOUVEMENT MINIMAL DU PRIX (%)","minBuys":"ACHATS MINIMAUX PENDANT LA PREMIÈRE MINUTE","maxDailyLoss":"PERTE QUOTIDIENNE MAX. (SOL)","maxOpen":"MAX. DE TRANSACTIONS OUVERTES SIMULTANÉES","statsHeading":"PERFORMANCES DE SIMULATION","equityCurve":"COURBE DE CAPITAL DE LA SESSION","sinceStart":"SOL · DEPUIS LE DÉBUT DE LA SESSION","closedTrades":"TRANSACTIONS CLÔTURÉES","winsLosses":"GAINS / PERTES","start":"DÉPART ","now":"MAINTENANT ","totalExposure":"EXPOSITION TOTALE OUVERTE","openPositions":"POSITIONS OUVERTES : ","liveUnrealized":"P/L LATENT EN DIRECT","realized":"P/L RÉALISÉ","average":"RÉSULTAT MOYEN","best":"MEILLEURE TRANSACTION","worst":"PIRE TRANSACTION","waitingPumpDevLong":"La démo automatique attend le flux PumpDev. Les achats virtuels manuels restent disponibles.","presetAppliedPrefix":"Profil appliqué : ","sessionTurnover":"VOLUME DE LA SESSION","runtimeRunning":"TRADING AUTO · EN COURS","runtimeStopped":"TRADING AUTO · ARRÊTÉ","noNewTrades":"Les nouvelles transactions sont désactivées (limite à 0).","maxOpenReached":"Nombre maximal de positions ouvertes simultanées atteint ({count}).","serverEngineError":"Impossible de joindre le moteur papier du serveur.","buy":"ACHATS","sell":"VENTES","net":"NET","move":"MOUVEMENT","socials":"RÉSEAUX","devRepeat":"RÉCURRENT","devFirstSeen":"PREMIÈRE FOIS","boosts":"BOOSTS","communityVotes":"COMMUNAUTÉ","dexProfile":"PROFIL DEX"},"it":{"noMatches":"Nessun token corrisponde ai filtri attivi. Allenta un filtro o scegli un'altra fonte.","noClosed":"Nessuna operazione chiusa","noOpen":"Nessuna posizione aperta al momento","statusOpen":"APERTA","statusClosed":"CHIUSA","tradeSize":"DIMENSIONE OPERAZIONE","entryPrice":"PREZZO DI INGRESSO","exitPrice":"PREZZO DI USCITA","currentPrice":"PREZZO ATTUALE","tradeResult":"RISULTATO OPERAZIONE","currentPnl":"P/L ATTUALE","contract":"CONTRATTO","addressNA":"Indirizzo non disponibile","closedPrefix":"CHIUSA: ","sources":"FONTI: ","sourcesUnavailable":"FONTI NON DISPONIBILI: ","dailyLoss":"Limite di perdita giornaliera raggiunto. Nuove operazioni sospese.","tradeSizeError":"La dimensione deve essere positiva e non superare il massimo configurato.","lowLiquidity":"La liquidità del token è inferiore al minimo configurato.","noBalance":"Saldo virtuale insufficiente.","history":"CRONOLOGIA OPERAZIONI","waitingPumpDev":"La demo automatica attende il flusso PumpDev.","socialsOnly":"SOLO SOCIAL","filterTicker":"Filtra nome / ticker","allSources":"TUTTE LE FONTI","pumpLaunches":"LANCI PUMP.FUN","boostMonitor":"BOOST MONITOR","community":"ZOMBIE LAB / COMMUNITY","anyDev":"QUALSIASI DEV","firstSeen":"PRIMA VOLTA","repeatDev":"DEV RICORRENTE","recommended":"PROFILI CONSIGLIATI","presetNote":"Profili pronti per i test virtuali. Solo impostazioni demo.","conservative":"Conservativo","balanced":"Bilanciato","aggressive":"Aggressivo","idleTimeout":"TIMEOUT SENZA MOVIMENTO (SEC.)","minMove":"MOVIMENTO MINIMO DEL PREZZO (%)","minBuys":"ACQUISTI MINIMI NEL PRIMO MINUTO","maxDailyLoss":"PERDITA GIORNALIERA MAX (SOL)","maxOpen":"MAX OPERAZIONI APERTE SIMULTANEE","statsHeading":"PRESTAZIONI SIMULAZIONE","equityCurve":"CURVA DEL CAPITALE DELLA SESSIONE","sinceStart":"SOL · DALL’INIZIO DELLA SESSIONE","closedTrades":"OPERAZIONI CHIUSE","winsLosses":"VITTORIE / SCONFITTE","start":"INIZIO ","now":"ORA ","totalExposure":"ESPOSIZIONE TOTALE APERTA","openPositions":"POSIZIONI APERTE: ","liveUnrealized":"P/L NON REALIZZATO IN TEMPO REALE","realized":"P/L REALIZZATO","average":"RISULTATO MEDIO","best":"MIGLIOR OPERAZIONE","worst":"PEGGIOR OPERAZIONE","waitingPumpDevLong":"La demo automatica attende il flusso PumpDev. Gli acquisti virtuali manuali restano disponibili.","presetAppliedPrefix":"Profilo applicato: ","sessionTurnover":"VOLUME SESSIONE","runtimeRunning":"TRADING AUTOMATICO · ATTIVO","runtimeStopped":"TRADING AUTOMATICO · FERMATO","noNewTrades":"Le nuove operazioni sono disabilitate (limite impostato a 0).","maxOpenReached":"Raggiunto il numero massimo di operazioni aperte simultanee ({count}).","serverEngineError":"Impossibile raggiungere il motore paper del server.","buy":"ACQUISTI","sell":"VENDITE","net":"NETTO","move":"MOVIMENTO","socials":"SOCIAL","devRepeat":"RICORRENTE","devFirstSeen":"PRIMA VOLTA","boosts":"BOOST","communityVotes":"COMMUNITY","dexProfile":"PROFILO DEX"},"ja":{"noMatches":"現在のフィルターに一致するトークンはありません。条件を緩めるか、別のソースを選択してください。","noClosed":"決済済み取引はありません","noOpen":"現在、保有中のポジションはありません","statusOpen":"保有中","statusClosed":"決済済み","tradeSize":"取引サイズ","entryPrice":"エントリー価格","exitPrice":"決済価格","currentPrice":"現在価格","tradeResult":"取引結果","currentPnl":"現在の損益","contract":"コントラクト","addressNA":"アドレスを取得できません","closedPrefix":"決済日時: ","sources":"ソース: ","sourcesUnavailable":"ソースを利用できません: ","dailyLoss":"1日の損失上限に達しました。新規取引を停止しました。","tradeSizeError":"取引サイズは0より大きく、設定した上限以下である必要があります。","lowLiquidity":"トークンの流動性が設定した最低値を下回っています。","noBalance":"仮想残高が不足しています。","history":"取引履歴","waitingPumpDev":"自動デモはPumpDevの取引フィード接続を待っています。","socialsOnly":"SNSリンクありのみ","filterTicker":"名前 / ティッカーで絞り込む","allSources":"すべてのソース","pumpLaunches":"PUMP.FUNローンチ","boostMonitor":"BOOST MONITOR","community":"ZOMBIE LAB / コミュニティ","anyDev":"すべてのDEV","firstSeen":"初回検出","repeatDev":"再登場DEV","recommended":"おすすめプロファイル","presetNote":"仮想テスト用のプリセットです。デモ設定のみ変更します。","conservative":"保守的","balanced":"バランス型","aggressive":"積極的","idleTimeout":"価格停滞タイムアウト（秒）","minMove":"最低価格変動率（%）","minBuys":"最初の1分間の最低購入数","maxDailyLoss":"1日の最大損失（SOL）","maxOpen":"同時に保有できる最大取引数","statsHeading":"シミュレーション実績","equityCurve":"セッション資産推移","sinceStart":"SOL · セッション開始から","closedTrades":"決済済み取引","winsLosses":"勝ち / 負け","start":"開始 ","now":"現在 ","totalExposure":"未決済ポジション合計","openPositions":"保有中のポジション: ","liveUnrealized":"リアルタイム未実現損益","realized":"確定損益","average":"平均リターン","best":"最高の取引","worst":"最低の取引","waitingPumpDevLong":"自動デモはPumpDevの取引フィード接続を待っています。手動の仮想購入は利用できます。","presetAppliedPrefix":"適用したプロファイル: ","sessionTurnover":"セッション取引量","runtimeRunning":"自動取引 · 稼働中","runtimeStopped":"自動取引 · 停止中","noNewTrades":"新規取引は無効です（上限が0に設定されています）。","maxOpenReached":"同時オープン取引数の上限に達しました（{count}）。","serverEngineError":"サーバーのペーパーモードエンジンに接続できません。","buy":"買い","sell":"売り","net":"純損益","move":"変動","socials":"SNS","devRepeat":"再検出","devFirstSeen":"初回検出","boosts":"ブースト","communityVotes":"コミュニティ","dexProfile":"DEXプロフィール"},"zh-CN":{"noMatches":"没有代币符合当前筛选条件。请放宽筛选条件或选择其他来源。","noClosed":"暂无已关闭的交易","noOpen":"当前没有未平仓头寸","statusOpen":"持有中","statusClosed":"已关闭","tradeSize":"交易金额","entryPrice":"买入价格","exitPrice":"卖出价格","currentPrice":"当前价格","tradeResult":"交易结果","currentPnl":"当前盈亏","contract":"合约","addressNA":"地址不可用","closedPrefix":"关闭时间：","sources":"来源：","sourcesUnavailable":"来源不可用：","dailyLoss":"已达到每日亏损上限，已暂停新交易。","tradeSizeError":"交易金额必须大于零且不能超过设置的上限。","lowLiquidity":"代币流动性低于设置的最低值。","noBalance":"虚拟余额不足。","history":"交易历史","waitingPumpDev":"自动模拟正在等待 PumpDev 交易流连接。","socialsOnly":"仅显示带社交链接","filterTicker":"按名称 / 代币代码筛选","allSources":"所有来源","pumpLaunches":"PUMP.FUN 新币","boostMonitor":"BOOST MONITOR","community":"ZOMBIE LAB / 社区","anyDev":"所有开发者","firstSeen":"首次出现","repeatDev":"重复开发者","recommended":"推荐配置","presetNote":"用于模拟测试的预设方案，仅更改模拟参数。","conservative":"保守型","balanced":"均衡型","aggressive":"激进型","idleTimeout":"价格无变动超时（秒）","minMove":"最低价格变动（%）","minBuys":"首分钟最低买入次数","maxDailyLoss":"每日最大亏损（SOL）","maxOpen":"同时开启的最大交易数","statsHeading":"模拟表现","equityCurve":"本次会话资产曲线","sinceStart":"SOL · 自会话开始","closedTrades":"已关闭交易","winsLosses":"盈利 / 亏损","start":"开始 ","now":"当前 ","totalExposure":"未平仓头寸总额","openPositions":"未平仓头寸：","liveUnrealized":"实时未实现盈亏","realized":"已实现盈亏","average":"平均结果","best":"最佳交易","worst":"最差交易","waitingPumpDevLong":"自动模拟正在等待 PumpDev 交易流连接。仍可手动进行虚拟买入。","presetAppliedPrefix":"已应用配置：","sessionTurnover":"本次会话交易额","runtimeRunning":"自动交易 · 运行中","runtimeStopped":"自动交易 · 已停止","noNewTrades":"新交易已禁用（上限设置为 0）。","maxOpenReached":"已达到同时开启交易数量上限（{count}）。","serverEngineError":"无法连接服务器模拟引擎。","buy":"买入","sell":"卖出","net":"净值","move":"变动","socials":"社交链接","devRepeat":"重复出现","devFirstSeen":"首次出现","boosts":"助推","communityVotes":"社区","dexProfile":"DEX 资料"},"tr":{"noMatches":"Etkin filtrelerle eşleşen token yok. Bir filtreyi gevşetin veya başka kaynak seçin.","noClosed":"Henüz kapatılmış işlem yok","noOpen":"Şu anda açık pozisyon yok","statusOpen":"AÇIK","statusClosed":"KAPALI","tradeSize":"İŞLEM BOYUTU","entryPrice":"GİRİŞ FİYATI","exitPrice":"ÇIKIŞ FİYATI","currentPrice":"GÜNCEL FİYAT","tradeResult":"İŞLEM SONUCU","currentPnl":"GÜNCEL K/Z","contract":"KONTRAT","addressNA":"Adres kullanılamıyor","closedPrefix":"KAPANIŞ: ","sources":"KAYNAKLAR: ","sourcesUnavailable":"KAYNAKLAR KULLANILAMIYOR: ","dailyLoss":"Günlük zarar limitine ulaşıldı. Yeni işlemler duraklatıldı.","tradeSizeError":"İşlem boyutu sıfırdan büyük olmalı ve ayarlanan maksimumu aşmamalı.","lowLiquidity":"Token likiditesi ayarlanan minimumun altında.","noBalance":"Sanal bakiye yetersiz.","history":"İŞLEM GEÇMİŞİ","waitingPumpDev":"Otomatik demo PumpDev işlem akışını bekliyor.","socialsOnly":"YALNIZCA SOSYAL BAĞLANTILAR","filterTicker":"Ad / ticker filtrele","allSources":"TÜM KAYNAKLAR","pumpLaunches":"PUMP.FUN LANSMANLARI","boostMonitor":"BOOST MONITOR","community":"ZOMBIE LAB / TOPLULUK","anyDev":"HERHANGİ BİR DEV","firstSeen":"İLK KEZ GÖRÜLDÜ","repeatDev":"TEKRAR EDEN DEV","recommended":"ÖNERİLEN PROFİLLER","presetNote":"Sanal testler için hazır profiller. Yalnızca demo ayarlarını değiştirir.","conservative":"Temkinli","balanced":"Dengeli","aggressive":"Agresif","idleTimeout":"HAREKETSİZLİK ZAMAN AŞIMI (SN)","minMove":"MİNİMUM FİYAT HAREKETİ (%)","minBuys":"İLK DAKİKADAKİ MİNİMUM ALIM","maxDailyLoss":"GÜNLÜK MAKS. ZARAR (SOL)","maxOpen":"AYNI ANDA AÇIK MAKS. İŞLEM","statsHeading":"SİMÜLASYON PERFORMANSI","equityCurve":"OTURUM SERMAYE GRAFİĞİ","sinceStart":"SOL · OTURUM BAŞLANGICINDAN BERİ","closedTrades":"KAPANAN İŞLEMLER","winsLosses":"KAZANÇ / KAYIP","start":"BAŞLANGIÇ ","now":"ŞİMDİ ","totalExposure":"TOPLAM AÇIK POZİSYON TUTARI","openPositions":"AÇIK POZİSYONLAR: ","liveUnrealized":"CANLI GERÇEKLEŞMEMİŞ K/Z","realized":"GERÇEKLEŞEN K/Z","average":"ORTALAMA SONUÇ","best":"EN İYİ İŞLEM","worst":"EN KÖTÜ İŞLEM","waitingPumpDevLong":"Otomatik demo PumpDev işlem akışını bekliyor. Manuel sanal alımlar kullanılabilir.","presetAppliedPrefix":"Uygulanan profil: ","sessionTurnover":"OTURUM HACMİ","runtimeRunning":"OTOMATİK İŞLEM · ÇALIŞIYOR","runtimeStopped":"OTOMATİK İŞLEM · DURDURULDU","noNewTrades":"Yeni işlemler devre dışı (limit 0).","maxOpenReached":"Aynı anda açık işlem sınırına ulaşıldı ({count}).","serverEngineError":"Sunucu paper motoruna bağlanılamadı.","buy":"ALIM","sell":"SATIM","net":"NET","move":"HAREKET","socials":"SOSYAL","devRepeat":"TEKRAR","devFirstSeen":"İLK GÖRÜLME","boosts":"BOOST","communityVotes":"TOPLULUK","dexProfile":"DEX PROFİLİ"},"hi":{"noMatches":"सक्रिय फ़िल्टर से मेल खाने वाला कोई टोकन नहीं है। फ़िल्टर ढीला करें या दूसरा स्रोत चुनें।","noClosed":"अभी कोई बंद ट्रेड नहीं है","noOpen":"अभी कोई खुली पोज़िशन नहीं है","statusOpen":"खुली","statusClosed":"बंद","tradeSize":"ट्रेड का आकार","entryPrice":"एंट्री मूल्य","exitPrice":"एग्ज़िट मूल्य","currentPrice":"वर्तमान मूल्य","tradeResult":"ट्रेड परिणाम","currentPnl":"वर्तमान P/L","contract":"कॉन्ट्रैक्ट","addressNA":"पता उपलब्ध नहीं","closedPrefix":"बंद: ","sources":"स्रोत: ","sourcesUnavailable":"स्रोत उपलब्ध नहीं: ","dailyLoss":"दैनिक नुकसान सीमा पूरी हो गई है। नए ट्रेड रोक दिए गए हैं।","tradeSizeError":"ट्रेड का आकार शून्य से अधिक और निर्धारित अधिकतम सीमा के भीतर होना चाहिए।","lowLiquidity":"टोकन की लिक्विडिटी निर्धारित न्यूनतम से कम है।","noBalance":"वर्चुअल बैलेंस पर्याप्त नहीं है।","history":"ट्रेड इतिहास","waitingPumpDev":"ऑटो डेमो PumpDev ट्रेड फ़ीड कनेक्शन की प्रतीक्षा कर रहा है।","socialsOnly":"केवल सोशल लिंक वाले","filterTicker":"नाम / टिकर फ़िल्टर करें","allSources":"सभी स्रोत","pumpLaunches":"PUMP.FUN लॉन्च","boostMonitor":"BOOST MONITOR","community":"ZOMBIE LAB / समुदाय","anyDev":"कोई भी DEV","firstSeen":"पहली बार देखा गया","repeatDev":"बार-बार दिखने वाला DEV","recommended":"अनुशंसित प्रोफ़ाइल","presetNote":"वर्चुअल परीक्षण के लिए तैयार प्रोफ़ाइल। केवल डेमो सेटिंग बदलती हैं।","conservative":"सावधानीपूर्ण","balanced":"संतुलित","aggressive":"आक्रामक","idleTimeout":"बिना गतिविधि का टाइमआउट (सेकंड)","minMove":"न्यूनतम मूल्य बदलाव (%)","minBuys":"पहले मिनट में न्यूनतम खरीद","maxDailyLoss":"अधिकतम दैनिक नुकसान (SOL)","maxOpen":"एक साथ अधिकतम खुले ट्रेड","statsHeading":"सिमुलेशन प्रदर्शन","equityCurve":"सेशन इक्विटी कर्व","sinceStart":"SOL · सेशन शुरू होने के बाद से","closedTrades":"बंद ट्रेड","winsLosses":"जीत / हार","start":"शुरुआत ","now":"अभी ","totalExposure":"कुल खुला एक्सपोज़र","openPositions":"खुली पोज़िशन: ","liveUnrealized":"लाइव अवास्तविक P/L","realized":"वास्तविक P/L","average":"औसत परिणाम","best":"सबसे अच्छा ट्रेड","worst":"सबसे खराब ट्रेड","waitingPumpDevLong":"ऑटो डेमो PumpDev ट्रेड फ़ीड की प्रतीक्षा कर रहा है। मैन्युअल वर्चुअल खरीद उपलब्ध है।","presetAppliedPrefix":"लागू प्रोफ़ाइल: ","sessionTurnover":"सेशन टर्नओवर","runtimeRunning":"ऑटो ट्रेडिंग · चालू","runtimeStopped":"ऑटो ट्रेडिंग · रुका हुआ","noNewTrades":"नए ट्रेड बंद हैं (सीमा 0 है)।","maxOpenReached":"एक साथ खुले ट्रेड की अधिकतम सीमा पूरी हो गई ({count})।","serverEngineError":"सर्वर पेपर इंजन से संपर्क नहीं हो सका।","buy":"खरीद","sell":"बिक्री","net":"नेट","move":"बदलाव","socials":"सोशल","devRepeat":"दोबारा","devFirstSeen":"पहली बार","boosts":"बूस्ट","communityVotes":"समुदाय","dexProfile":"DEX प्रोफ़ाइल"}};
  const uiText = key => (SNIPER_UI_COPY[state.lang] || SNIPER_UI_COPY.en)[key] || SNIPER_UI_COPY.en[key] || key;
  const WALLET_COPY = {"en":{"title":"YOUR SOLANA WALLET","login":"Sign in with Telegram to create your dedicated wallet.","create":"CREATE / CHECK WALLET","checking":"CHECKING…","retry":"RETRY","provisioning":"Wallet is provisioning or temporarily unavailable.","copy":"COPY","copied":"COPIED","failed":"FAILED","balance":"SOL BALANCE","loading":"LOADING…","refresh":"REFRESH","confirmed":"Confirmed on Solana","error":"ERROR: ","network":"network unavailable","deposit":"To fund this wallet, send native SOL on Solana only. Do not send assets from other networks.","baselineUnset":"RECONCILIATION: BASELINE NOT SET","setBaseline":"SET BASELINE","pending":"HISTORY NOT YET RECONCILED","scanning":"HISTORY SCAN IN PROGRESS","complete":"HISTORY RECONCILED","discrepancy":"BALANCE DISCREPANCY DETECTED","rpc":"RPC TEMPORARILY UNAVAILABLE","baselineSaved":"BASELINE SAVED","reconcileError":"RECONCILIATION LOAD ERROR: ","readBaseline":"READING BALANCE AND SLOT…","activity":"RECENT ACTIVITY","refreshHistory":"REFRESH HISTORY","noActivity":"No transactions yet.","failedStatus":"FAILED","confirmedStatus":"CONFIRMED","netChange":"(net change)","amountNA":"Amount unavailable","fee":"Network fee: ","feeNA":"Network fee unavailable","loadOlder":"LOAD OLDER","activityError":"ACTIVITY ERROR: ","privateKey":"Private key stays server-side. Paper mode never sends real trades.","walletError":"WALLET ERROR: ","nav":"WALLET"},"ru":{"title":"ВАШ SOLANA-КОШЕЛЁК","login":"Войдите через Telegram — для профиля будет создан отдельный кошелёк.","create":"СОЗДАТЬ / ПРОВЕРИТЬ КОШЕЛЁК","checking":"ПРОВЕРКА…","retry":"ПОВТОРИТЬ","provisioning":"Кошелёк создаётся или временно недоступен.","copy":"КОПИРОВАТЬ","copied":"СКОПИРОВАНО","failed":"ОШИБКА","balance":"БАЛАНС SOL","loading":"ЗАГРУЗКА…","refresh":"ОБНОВИТЬ","confirmed":"Подтверждено сетью Solana","error":"ОШИБКА: ","network":"сеть недоступна","deposit":"Для пополнения отправляйте только SOL в сети Solana на этот адрес. Не отправляйте токены других сетей.","baselineUnset":"СВЕРКА: ИСХОДНАЯ ТОЧКА НЕ ЗАДАНА","setBaseline":"ЗАДАТЬ ИСХОДНУЮ ТОЧКУ","pending":"ИСТОРИЯ ЕЩЁ НЕ СВЕРЕНА","scanning":"ПРОВЕРКА ИСТОРИИ","complete":"ИСТОРИЯ СВЕРЕНА","discrepancy":"ОБНАРУЖЕНО РАСХОЖДЕНИЕ","rpc":"RPC ВРЕМЕННО НЕДОСТУПЕН","baselineSaved":"ИСХОДНАЯ ТОЧКА СОХРАНЕНА","reconcileError":"ОШИБКА ЗАГРУЗКИ СВЕРКИ: ","readBaseline":"ПОЛУЧЕНИЕ БАЛАНСА И SLOT…","activity":"ПОСЛЕДНИЕ ОПЕРАЦИИ","refreshHistory":"ОБНОВИТЬ ИСТОРИЮ","noActivity":"Операций пока нет.","failedStatus":"ОШИБКА","confirmedStatus":"ПОДТВЕРЖДЕНО","netChange":"(чистое изменение)","amountNA":"Сумма недоступна","fee":"Комиссия сети: ","feeNA":"Комиссия недоступна","loadOlder":"ЗАГРУЗИТЬ ЕЩЁ","activityError":"ОШИБКА ЗАГРУЗКИ ИСТОРИИ: ","privateKey":"Приватный ключ хранится на сервере. Демо-режим не отправляет реальные сделки.","walletError":"ОШИБКА КОШЕЛЬКА: ","nav":"КОШЕЛЁК"},"de":{"title":"DEINE SOLANA-WALLET","login":"Melde dich über Telegram an, um eine eigene Wallet für dein Profil zu erstellen.","create":"WALLET ERSTELLEN / PRÜFEN","checking":"WIRD GEPRÜFT…","retry":"ERNEUT VERSUCHEN","provisioning":"Die Wallet wird eingerichtet oder ist vorübergehend nicht verfügbar.","copy":"KOPIEREN","copied":"KOPIERT","failed":"FEHLGESCHLAGEN","balance":"SOL-GUTHABEN","loading":"WIRD GELADEN…","refresh":"AKTUALISIEREN","confirmed":"Im Solana-Netzwerk bestätigt","error":"FEHLER: ","network":"Netzwerk nicht verfügbar","deposit":"Sende zum Aufladen ausschließlich natives SOL im Solana-Netzwerk an diese Adresse. Keine Assets aus anderen Netzwerken senden.","baselineUnset":"ABGLEICH: AUSGANGSWERT NICHT FESTGELEGT","setBaseline":"AUSGANGSWERT FESTLEGEN","pending":"VERLAUF NOCH NICHT ABGEGLICHEN","scanning":"VERLAUF WIRD GEPRÜFT","complete":"VERLAUF ABGEGLICHEN","discrepancy":"GUTHABENABWEICHUNG ERKANNT","rpc":"RPC VORÜBERGEHEND NICHT VERFÜGBAR","baselineSaved":"AUSGANGSWERT GESPEICHERT","reconcileError":"FEHLER BEIM LADEN DES ABGLEICHS: ","readBaseline":"GUTHABEN UND SLOT WERDEN ABGERUFEN…","activity":"LETZTE AKTIVITÄTEN","refreshHistory":"VERLAUF AKTUALISIEREN","noActivity":"Noch keine Transaktionen.","failedStatus":"FEHLGESCHLAGEN","confirmedStatus":"BESTÄTIGT","netChange":"(Nettoänderung)","amountNA":"Betrag nicht verfügbar","fee":"Netzwerkgebühr: ","feeNA":"Netzwerkgebühr nicht verfügbar","loadOlder":"ÄLTERE LADEN","activityError":"AKTIVITÄTSFEHLER: ","privateKey":"Der private Schlüssel bleibt auf dem Server. Der Demomodus sendet keine echten Trades.","walletError":"WALLET-FEHLER: ","nav":"WALLET"},"fr":{"title":"VOTRE PORTEFEUILLE SOLANA","login":"Connectez-vous avec Telegram pour créer un portefeuille dédié à votre profil.","create":"CRÉER / VÉRIFIER LE PORTEFEUILLE","checking":"VÉRIFICATION…","retry":"RÉESSAYER","provisioning":"Le portefeuille est en cours de création ou temporairement indisponible.","copy":"COPIER","copied":"COPIÉ","failed":"ÉCHEC","balance":"SOLDE SOL","loading":"CHARGEMENT…","refresh":"ACTUALISER","confirmed":"Confirmé sur Solana","error":"ERREUR : ","network":"réseau indisponible","deposit":"Pour approvisionner ce portefeuille, envoyez uniquement du SOL natif sur Solana à cette adresse. N’envoyez pas d’actifs d’autres réseaux.","baselineUnset":"RAPPROCHEMENT : POINT DE RÉFÉRENCE NON DÉFINI","setBaseline":"DÉFINIR LE POINT DE RÉFÉRENCE","pending":"HISTORIQUE PAS ENCORE RAPPROCHÉ","scanning":"VÉRIFICATION DE L’HISTORIQUE","complete":"HISTORIQUE RAPPROCHÉ","discrepancy":"ÉCART DE SOLDE DÉTECTÉ","rpc":"RPC TEMPORAIREMENT INDISPONIBLE","baselineSaved":"POINT DE RÉFÉRENCE ENREGISTRÉ","reconcileError":"ERREUR DE CHARGEMENT DU RAPPROCHEMENT : ","readBaseline":"LECTURE DU SOLDE ET DU SLOT…","activity":"ACTIVITÉ RÉCENTE","refreshHistory":"ACTUALISER L’HISTORIQUE","noActivity":"Aucune transaction pour le moment.","failedStatus":"ÉCHEC","confirmedStatus":"CONFIRMÉ","netChange":"(variation nette)","amountNA":"Montant indisponible","fee":"Frais réseau : ","feeNA":"Frais réseau indisponibles","loadOlder":"CHARGER LES ANCIENNES","activityError":"ERREUR D’ACTIVITÉ : ","privateKey":"La clé privée reste sur le serveur. Le mode démo n’envoie aucune transaction réelle.","walletError":"ERREUR DU PORTEFEUILLE : ","nav":"PORTEFEUILLE"},"it":{"title":"IL TUO WALLET SOLANA","login":"Accedi con Telegram per creare un wallet dedicato al tuo profilo.","create":"CREA / VERIFICA WALLET","checking":"VERIFICA IN CORSO…","retry":"RIPROVA","provisioning":"Il wallet è in creazione o temporaneamente non disponibile.","copy":"COPIA","copied":"COPIATO","failed":"ERRORE","balance":"SALDO SOL","loading":"CARICAMENTO…","refresh":"AGGIORNA","confirmed":"Confermato sulla rete Solana","error":"ERRORE: ","network":"rete non disponibile","deposit":"Per ricaricare questo wallet, invia solo SOL nativo sulla rete Solana a questo indirizzo. Non inviare asset di altre reti.","baselineUnset":"RICONCILIAZIONE: RIFERIMENTO NON IMPOSTATO","setBaseline":"IMPOSTA RIFERIMENTO","pending":"CRONOLOGIA NON ANCORA RICONCILIATA","scanning":"CONTROLLO CRONOLOGIA IN CORSO","complete":"CRONOLOGIA RICONCILIATA","discrepancy":"RILEVATA DIFFERENZA NEL SALDO","rpc":"RPC TEMPORANEAMENTE NON DISPONIBILE","baselineSaved":"RIFERIMENTO SALVATO","reconcileError":"ERRORE DI CARICAMENTO RICONCILIAZIONE: ","readBaseline":"LETTURA SALDO E SLOT…","activity":"ATTIVITÀ RECENTE","refreshHistory":"AGGIORNA CRONOLOGIA","noActivity":"Nessuna transazione al momento.","failedStatus":"ERRORE","confirmedStatus":"CONFERMATO","netChange":"(variazione netta)","amountNA":"Importo non disponibile","fee":"Commissione di rete: ","feeNA":"Commissione di rete non disponibile","loadOlder":"CARICA PRECEDENTI","activityError":"ERRORE ATTIVITÀ: ","privateKey":"La chiave privata resta sul server. La modalità demo non invia operazioni reali.","walletError":"ERRORE WALLET: ","nav":"WALLET"},"ja":{"title":"SOLANAウォレット","login":"Telegramでログインすると、プロフィール専用のウォレットが作成されます。","create":"ウォレットを作成 / 確認","checking":"確認中…","retry":"再試行","provisioning":"ウォレットを作成中、または一時的に利用できません。","copy":"コピー","copied":"コピーしました","failed":"失敗","balance":"SOL残高","loading":"読み込み中…","refresh":"更新","confirmed":"Solanaネットワークで確認済み","error":"エラー: ","network":"ネットワークを利用できません","deposit":"このウォレットへの入金には、Solanaネットワーク上のネイティブSOLのみを送信してください。他のネットワークの資産は送信しないでください。","baselineUnset":"照合: 基準値未設定","setBaseline":"基準値を設定","pending":"履歴は未照合です","scanning":"履歴を確認中","complete":"履歴の照合完了","discrepancy":"残高の不一致を検出","rpc":"RPCは一時的に利用できません","baselineSaved":"基準値を保存しました","reconcileError":"照合データの読み込みエラー: ","readBaseline":"残高とスロットを取得中…","activity":"最近のアクティビティ","refreshHistory":"履歴を更新","noActivity":"取引履歴はありません。","failedStatus":"失敗","confirmedStatus":"確認済み","netChange":"(純増減)","amountNA":"金額を取得できません","fee":"ネットワーク手数料: ","feeNA":"ネットワーク手数料を取得できません","loadOlder":"過去の履歴を読み込む","activityError":"アクティビティエラー: ","privateKey":"秘密鍵はサーバー上に保管されます。デモモードでは実際の取引は送信されません。","walletError":"ウォレットエラー: ","nav":"ウォレット"},"zh-CN":{"title":"您的 SOLANA 钱包","login":"通过 Telegram 登录，为您的个人资料创建专属钱包。","create":"创建 / 检查钱包","checking":"正在检查…","retry":"重试","provisioning":"钱包正在创建或暂时不可用。","copy":"复制","copied":"已复制","failed":"失败","balance":"SOL 余额","loading":"正在加载…","refresh":"刷新","confirmed":"已在 Solana 网络确认","error":"错误：","network":"网络不可用","deposit":"为此钱包充值时，请仅向该地址发送 Solana 网络上的原生 SOL。请勿发送其他网络的资产。","baselineUnset":"对账：尚未设置基准值","setBaseline":"设置基准值","pending":"历史记录尚未完成对账","scanning":"正在扫描历史记录","complete":"历史记录已完成对账","discrepancy":"检测到余额差异","rpc":"RPC 暂时不可用","baselineSaved":"基准值已保存","reconcileError":"加载对账信息失败：","readBaseline":"正在读取余额和 Slot…","activity":"最近活动","refreshHistory":"刷新历史记录","noActivity":"暂无交易记录。","failedStatus":"失败","confirmedStatus":"已确认","netChange":"(净变化)","amountNA":"金额不可用","fee":"网络手续费：","feeNA":"网络手续费不可用","loadOlder":"加载更早记录","activityError":"活动记录错误：","privateKey":"私钥保存在服务器端。模拟模式不会发送真实交易。","walletError":"钱包错误：","nav":"钱包"},"tr":{"title":"SOLANA CÜZDANINIZ","login":"Profilinize özel bir cüzdan oluşturmak için Telegram ile giriş yapın.","create":"CÜZDAN OLUŞTUR / KONTROL ET","checking":"KONTROL EDİLİYOR…","retry":"YENİDEN DENE","provisioning":"Cüzdan oluşturuluyor veya geçici olarak kullanılamıyor.","copy":"KOPYALA","copied":"KOPYALANDI","failed":"BAŞARISIZ","balance":"SOL BAKİYESİ","loading":"YÜKLENİYOR…","refresh":"YENİLE","confirmed":"Solana ağında onaylandı","error":"HATA: ","network":"ağ kullanılamıyor","deposit":"Bu cüzdana para yatırmak için bu adrese yalnızca Solana ağındaki yerel SOL'u gönderin. Diğer ağlardan varlık göndermeyin.","baselineUnset":"MUTABAKAT: REFERANS DEĞERİ AYARLANMADI","setBaseline":"REFERANS DEĞERİNİ AYARLA","pending":"İŞLEM GEÇMİŞİ HENÜZ MUTABAKATLANMADI","scanning":"İŞLEM GEÇMİŞİ TARANIYOR","complete":"İŞLEM GEÇMİŞİ MUTABAKATLANDI","discrepancy":"BAKİYE UYUŞMAZLIĞI ALGILANDI","rpc":"RPC GEÇİCİ OLARAK KULLANILAMIYOR","baselineSaved":"REFERANS DEĞERİ KAYDEDİLDİ","reconcileError":"MUTABAKAT YÜKLEME HATASI: ","readBaseline":"BAKİYE VE SLOT OKUNUYOR…","activity":"SON İŞLEMLER","refreshHistory":"GEÇMİŞİ YENİLE","noActivity":"Henüz işlem yok.","failedStatus":"BAŞARISIZ","confirmedStatus":"ONAYLANDI","netChange":"(net değişim)","amountNA":"Tutar kullanılamıyor","fee":"Ağ ücreti: ","feeNA":"Ağ ücreti kullanılamıyor","loadOlder":"ESKİ KAYITLARI YÜKLE","activityError":"İŞLEM GEÇMİŞİ HATASI: ","privateKey":"Özel anahtar sunucuda saklanır. Demo modu gerçek işlem göndermez.","walletError":"CÜZDAN HATASI: ","nav":"CÜZDAN"},"hi":{"title":"आपका SOLANA वॉलेट","login":"अपने प्रोफ़ाइल के लिए अलग वॉलेट बनाने हेतु Telegram से लॉग इन करें।","create":"वॉलेट बनाएँ / जाँचें","checking":"जाँच जारी…","retry":"फिर कोशिश करें","provisioning":"वॉलेट बनाया जा रहा है या अस्थायी रूप से उपलब्ध नहीं है।","copy":"कॉपी करें","copied":"कॉपी हो गया","failed":"विफल","balance":"SOL बैलेंस","loading":"लोड हो रहा है…","refresh":"रीफ़्रेश","confirmed":"Solana नेटवर्क पर पुष्टि हुई","error":"त्रुटि: ","network":"नेटवर्क उपलब्ध नहीं है","deposit":"इस वॉलेट में राशि भेजने के लिए केवल Solana नेटवर्क पर native SOL भेजें। अन्य नेटवर्क की संपत्ति न भेजें।","baselineUnset":"मिलान: आधार मान सेट नहीं है","setBaseline":"आधार मान सेट करें","pending":"लेन-देन इतिहास का मिलान अभी नहीं हुआ","scanning":"लेन-देन इतिहास स्कैन हो रहा है","complete":"लेन-देन इतिहास का मिलान पूरा","discrepancy":"बैलेंस में अंतर मिला","rpc":"RPC अस्थायी रूप से उपलब्ध नहीं है","baselineSaved":"आधार मान सहेजा गया","reconcileError":"मिलान जानकारी लोड करने में त्रुटि: ","readBaseline":"बैलेंस और स्लॉट पढ़े जा रहे हैं…","activity":"हाल की गतिविधि","refreshHistory":"इतिहास रीफ़्रेश करें","noActivity":"अभी कोई लेन-देन नहीं है।","failedStatus":"विफल","confirmedStatus":"पुष्ट","netChange":"(शुद्ध बदलाव)","amountNA":"राशि उपलब्ध नहीं","fee":"नेटवर्क शुल्क: ","feeNA":"नेटवर्क शुल्क उपलब्ध नहीं","loadOlder":"पुराने रिकॉर्ड लोड करें","activityError":"गतिविधि त्रुटि: ","privateKey":"निजी कुंजी सर्वर पर रहती है। डेमो मोड वास्तविक लेन-देन नहीं भेजता।","walletError":"वॉलेट त्रुटि: ","nav":"वॉलेट"}};
  const walletText = key => (WALLET_COPY[state.lang] || WALLET_COPY.en)[key] || WALLET_COPY.en[key] || key;

  async function refreshWalletInfo(){
    const panel=$('zs-wallet-panel');if(!panel)return;
    const token=authToken();
    if(panel.dataset.loading==='true')return;
    if(panel.dataset.loaded==='true'&&panel.dataset.token===token)return;
    panel.dataset.loading='true';
    panel.dataset.token=token;
    panel.replaceChildren();
    const title=dashNode('strong','',walletText('title'));
    panel.append(title);
    if(!token){panel.append(dashNode('small','',walletText('login')));panel.dataset.loading='false';panel.dataset.loaded='true';return;}
    const provision=dashNode('button','zs-wallet-provision',walletText('create'));provision.type='button';provision.addEventListener('click',async()=>{provision.disabled=true;provision.textContent=walletText('checking');try{const result=await fetch(AUTH_API+'/api/sniper/wallet/provision',{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},cache:'no-store'});const body=await result.json().catch(()=>({}));if(!result.ok)throw new Error(body.error||'Wallet provisioning failed');panel.dataset.loaded='false';await refreshWalletInfo();}catch(error){panel.append(dashNode('small','zs-wallet-error',error.message||'Wallet provisioning unavailable'));provision.disabled=false;provision.textContent=walletText('retry');}});panel.append(provision);
    try{
      const response=await fetch(AUTH_API+'/api/sniper/wallet',{headers:{'Authorization':'Bearer '+token},cache:'no-store'});
      if(!response.ok){const failure=await response.json().catch(()=>({}));throw new Error(failure.error||('Wallet API HTTP '+response.status));}
      const data=await response.json(),wallet=data.wallet;
      if(data.trading&&data.trading.mode==='paper'){
        const settings=data.trading;
        if(['any','first','repeat'].includes(settings.creatorPolicy))state.creatorFilter=settings.creatorPolicy;
        if(typeof settings.requireSocials==='boolean')state.requireSocials=settings.requireSocials;
        const creatorSelect=document.querySelector('.zs-creator-select');if(creatorSelect)creatorSelect.value=state.creatorFilter;
        const socialsCheck=document.querySelector('.zs-filter-label input[type="checkbox"]');if(socialsCheck)socialsCheck.checked=state.requireSocials;
        const serverValues={
          'sniper-capital':settings.paperCapitalSol,'sniper-size':settings.maxTradeSol,
          'sniper-target':settings.takeProfitPct,'sniper-stop':settings.stopLossPct,
          'sniper-min-move':settings.minPriceMovePct,'sniper-idle-timeout':settings.idleExitSeconds,
          'sniper-max-open':settings.maxOpenPositions,'sniper-min-buys':settings.minBuyCount,
          'sniper-max-daily-loss':settings.maxDailyLossSol
        };
        Object.entries(serverValues).forEach(([id,value])=>{
          const input=$(id);if(value===undefined||value===null||!input)return;
          input.value=String(value);
          const slider=input.parentElement&&input.parentElement.querySelector('.zs-range');
          if(slider)slider.value=String(value);
        });
        terminal.capital=Number(settings.paperCapitalSol)||terminal.capital;
        terminal.maxOpenPositions=Number(settings.maxOpenPositions)||terminal.maxOpenPositions;
        terminal.maxDailyLossSol=Number.isFinite(Number(settings.maxDailyLossSol))?Number(settings.maxDailyLossSol):(terminal.maxDailyLossSol??1);
        terminal.minBuyCount=Number(settings.minBuyCount)||terminal.minBuyCount||3;
        saveTerminal();
      }
      if(data.trading&&data.trading.mode==='paper'){
        const serverEnabled=!!data.trading.enabled;
        if(terminal.auto!==serverEnabled){terminal.auto=serverEnabled;terminal.startedAt=serverEnabled?(terminal.startedAt||Date.now()):0;saveTerminal();renderDashboardState();}
      }
      if(!wallet||!wallet.publicKey){
        panel.append(dashNode('small','',walletText('provisioning')));
        panel.dataset.loading='false';panel.dataset.loaded='true';
        return;
      }
      const address=String(wallet.publicKey);
      const line=dashNode('code','zs-wallet-address',address);
      line.title=address;
      const copy=dashNode('button','zs-copy-address',walletText('copy'));
      copy.type='button';
      copy.addEventListener('click',async()=>{
        try{await navigator.clipboard.writeText(address);copy.textContent=walletText('copied');}
        catch(_){copy.textContent=walletText('failed');}
      });
      panel.append(line,copy);
      const balanceRow=dashNode('div','zs-wallet-balance');
      const balanceLabel=dashNode('small','',walletText('balance'));
      const balanceValue=dashNode('strong','zs-wallet-balance-value',walletText('loading'));
      const refreshBalance=dashNode('button','zs-wallet-refresh',walletText('refresh'));
      refreshBalance.type='button';
      const loadBalance=async()=>{
        refreshBalance.disabled=true;balanceValue.textContent=walletText('loading');
        try{
          const balanceResponse=await fetch(AUTH_API+'/api/sniper/wallet/balance',{headers:{'Authorization':'Bearer '+token},cache:'no-store'});
          const balanceData=await balanceResponse.json().catch(()=>({}));
          if(!balanceResponse.ok)throw new Error((balanceData.error||'Balance API error')+' (HTTP '+balanceResponse.status+')');
          balanceValue.textContent=Number(balanceData.sol).toLocaleString(undefined,{minimumFractionDigits:4,maximumFractionDigits:9})+' SOL';
          balanceValue.title=walletText('confirmed');
        }catch(error){balanceValue.textContent=(walletText('error'))+(error&&error.message?error.message:(walletText('network')));}
        finally{refreshBalance.disabled=false;}
      };
      refreshBalance.addEventListener('click',loadBalance);
      balanceRow.append(balanceLabel,balanceValue,refreshBalance);
      const depositNote=dashNode('small','zs-wallet-note',walletText('deposit'));
      const reconciliationRow=dashNode('div','zs-wallet-reconciliation');
      const reconciliationStatus=dashNode('small','zs-wallet-reconciliation-status',walletText('baselineUnset'));
      const setBaseline=dashNode('button','zs-wallet-set-baseline',walletText('setBaseline'));
      setBaseline.type='button';
      const applyBaselineState=baseline=>{
        if(!baseline){
          reconciliationStatus.textContent=walletText('baselineUnset');
          setBaseline.textContent=walletText('setBaseline');
          setBaseline.disabled=false;
          return;
        }
        const statusLabels={
          baseline_pending_history:walletText('pending'),
          scanning:walletText('scanning'),
          history_complete:walletText('complete'),
          discrepancy:walletText('discrepancy'),
          rpc_unavailable:walletText('rpc')
        };
        const sol=Number(baseline.baselineSol);
        const balance=Number.isFinite(sol)?sol.toLocaleString(undefined,{minimumFractionDigits:4,maximumFractionDigits:9})+' SOL':'';
        const slot=Number.isFinite(Number(baseline.baselineSlot))?' · SLOT '+Number(baseline.baselineSlot).toLocaleString():'';
        const status=statusLabels[baseline.status]||String(baseline.status||'BASELINE SAVED').toUpperCase();
        reconciliationStatus.textContent=(walletText('baselineSaved'))+(balance?' · '+balance:'')+slot+' · '+status;
        setBaseline.textContent=walletText('baselineSaved');
        setBaseline.disabled=true;
      };
      const loadReconciliationState=async()=>{
        setBaseline.disabled=true;
        try{
          const stateResponse=await fetch(AUTH_API+'/api/sniper/wallet/reconciliation',{headers:{'Authorization':'Bearer '+token},cache:'no-store'});
          const stateData=await stateResponse.json().catch(()=>({}));
          if(!stateResponse.ok)throw new Error(stateData.error||'Reconciliation state API error');
          applyBaselineState(stateData.baseline||null);
        }catch(error){
          reconciliationStatus.textContent=(walletText('reconcileError'))+(error&&error.message?error.message:'network unavailable');
          setBaseline.disabled=false;
        }
      };
      setBaseline.addEventListener('click',async()=>{
        setBaseline.disabled=true;
        reconciliationStatus.textContent=walletText('readBaseline');
        try{
          const baselineResponse=await fetch(AUTH_API+'/api/sniper/wallet/reconciliation/baseline',{
            method:'POST',headers:{'Authorization':'Bearer '+token},cache:'no-store'
          });
          const baselineData=await baselineResponse.json().catch(()=>({}));
          if(!baselineResponse.ok)throw new Error((baselineData.error||'Baseline API error')+' (HTTP '+baselineResponse.status+')');
          applyBaselineState(baselineData.baseline||null);
        }catch(error){
          reconciliationStatus.textContent=(walletText('error'))+(error&&error.message?error.message:(walletText('network')));
          setBaseline.disabled=false;
        }
      });
      reconciliationRow.append(reconciliationStatus,setBaseline);
      const activityTitle=dashNode('strong','zs-wallet-activity-title',walletText('activity'));
      const activityHeader=dashNode('div','zs-wallet-activity-header');
      const activityRefresh=dashNode('button','zs-wallet-activity-refresh',walletText('refreshHistory'));
      activityRefresh.type='button';
      activityHeader.append(activityTitle,activityRefresh);
      const activityList=dashNode('div','zs-wallet-activity');
      let activityCursor=null;
      let activityLoading=false;
      const loadActivity=async(append=false)=>{
        if(activityLoading)return;
        activityLoading=true;
        const loadMoreButton=activityList.querySelector('.zs-wallet-load-more');
        if(loadMoreButton)loadMoreButton.disabled=true;
        if(!append){activityCursor=null;activityList.replaceChildren(dashNode('small','',walletText('loading')));}
        try{
          const query=activityCursor?'?before='+encodeURIComponent(activityCursor):'';
          const activityResponse=await fetch(AUTH_API+'/api/sniper/wallet/activity'+query,{headers:{'Authorization':'Bearer '+token},cache:'no-store'});
          const activityData=await activityResponse.json().catch(()=>({}));
          if(!activityResponse.ok)throw new Error((activityData.error||'Activity API error')+' (HTTP '+activityResponse.status+')');
          if(!append)activityList.replaceChildren();
          const items=Array.isArray(activityData.activity)?activityData.activity:[];
          if(!items.length&&!append){activityList.append(dashNode('small','',walletText('noActivity')));}
          items.forEach(item=>{
            const entry=dashNode('div','zs-wallet-activity-item');
            const detail=dashNode('span','',item.failed?(walletText('failed')):(walletText('confirmedStatus')));
            const time=dashNode('small','',item.blockTime?new Date(item.blockTime*1000).toLocaleString():'—');
            const amountText=typeof item.netSol==='number'
              ?(item.netSol>0?'+':'')+item.netSol.toFixed(9)+' SOL '+(walletText('netChange'))
              :(walletText('amountNA'));
            const amount=dashNode('small','',amountText);
            const feeText=typeof item.feeSol==='number'
              ?(walletText('fee'))+item.feeSol.toFixed(9)+' SOL'
              :(walletText('feeNA'));
            const fee=dashNode('small','',feeText);
            const link=dashNode('a','',String(item.signature).slice(0,10)+'…'+String(item.signature).slice(-8));
            link.href='https://solscan.io/tx/'+encodeURIComponent(item.signature);link.target='_blank';link.rel='noopener noreferrer';
            entry.append(detail,time,amount,fee,link);activityList.append(entry);
          });
          activityCursor=activityData.pagination&&activityData.pagination.hasMore?activityData.pagination.nextCursor:null;
          const oldButton=activityList.querySelector('.zs-wallet-load-more');
          if(oldButton)oldButton.remove();
          if(activityCursor){
            const more=dashNode('button','zs-wallet-load-more',walletText('loadOlder'));
            more.type='button';
            more.addEventListener('click',()=>loadActivity(true));
            activityList.append(more);
          }
        }catch(failure){
          if(!append)activityList.replaceChildren();
          const error=dashNode('small','zs-wallet-error',(walletText('activityError'))+(failure&&failure.message?failure.message:(walletText('network'))));
          activityList.append(error);
        }finally{
          activityLoading=false;
          if(loadMoreButton&&loadMoreButton.isConnected)loadMoreButton.disabled=false;
          activityRefresh.disabled=false;
        }
      };
      panel.append(balanceRow,depositNote,reconciliationRow,activityHeader,activityList,dashNode('small','',walletText('privateKey')));
      activityRefresh.addEventListener('click',()=>loadActivity(false));
      panel.dataset.loading='false';panel.dataset.loaded='true';
      loadBalance();loadActivity();loadReconciliationState();
    }catch(error){
      panel.append(dashNode('small','zs-wallet-error',(walletText('walletError'))+(error&&error.message?error.message:(walletText('network')))));
      panel.dataset.loading='false';panel.dataset.loaded='true';
    }
  }

  async function syncFromServer(){
    const token=authToken(),accountId=telegramId(),revision=state.historyRevision;if(!token||!accountId){updateSyncStatus('loginToSync');refreshWalletInfo();return;}
    try{
      const response=await fetch(AUTH_API+'/api/sniper/paper',{headers:{'Authorization':'Bearer '+token},cache:'no-store'});
      if(revision!==state.historyRevision||telegramId()!==accountId||authToken()!==token)return;
      if(response.status===401){updateSyncStatus('loginAgain');return;}
      if(!response.ok){updateSyncStatus('syncError');return;}
      const data=await response.json();
      if(revision!==state.historyRevision||telegramId()!==accountId||authToken()!==token)return;
      const remote=Array.isArray(data.positions)?data.positions.map(mapServerPosition):[];
      const local=state.positions.slice();
      const merged=new Map(local.map(p=>[String(p.id),p]));
      remote.forEach(p=>merged.set(String(p.id),p));
      state.positions=Array.from(merged.values()).sort((a,b)=>Number(b.openedAt||0)-Number(a.openedAt||0)).slice(0,50);
      saveStore();renderPositions();
      const remoteIds=new Set(remote.map(p=>String(p.id)));
      for(const p of state.positions){if(!remoteIds.has(String(p.id)))await persistPosition(p);}
      updateSyncStatus('synced');
      refreshWalletInfo();
    }catch(_){if(telegramId()===accountId&&authToken()===token)updateSyncStatus('syncError');}
  }
  function checkAccountChange(){
    const next=storageKey();
    if(next===activeStorageKey)return false;
    activeStorageKey=next;state.positions=[];readStore();renderPositions();
    if(authToken())syncFromServer().then(updatePositions);else updateSyncStatus('loginToSync');
    return true;
  }
  async function clearServerHistory(){
    const token=authToken(),accountId=telegramId();if(!token||!accountId)return true;
    const revision=++state.historyRevision;
    try{
      const response=await fetch(AUTH_API+'/api/sniper/paper/clear',{method:'POST',headers:{'Authorization':'Bearer '+token},cache:'no-store'});
      if(revision!==state.historyRevision||telegramId()!==accountId||authToken()!==token)return false;
      if(!response.ok){updateSyncStatus(response.status===401?'loginAgain':'syncError');return false;}
      const result=await response.json().catch(()=>({}));
      if(result.ok!==true){updateSyncStatus('syncError');return false;}
      updateSyncStatus('synced');return true;
    }catch(_){if(telegramId()===accountId&&authToken()===token)updateSyncStatus('syncError');return false;}
  }
  function setText(id,key){ const el=$(id); if(el) el.textContent=t(key); }
  function translate(){
    detectLang();
    document.querySelectorAll('[data-sniper-i18n]').forEach(el=>{el.textContent=t(el.dataset.sniperI18n);});
    document.querySelectorAll('[data-sniper-placeholder]').forEach(el=>{el.placeholder=t(el.dataset.sniperPlaceholder);});
    renderCandidates(); renderPositions();renderLog();updateSyncStatus(state.syncStatusKey||'saved');
    if(typeof renderDashboardState==='function')renderDashboardState();
    if($('zombie-sniper-demo')?.dataset.activeTab==='wallet'){const walletPanel=$('zs-wallet-panel');if(walletPanel)walletPanel.dataset.loaded='false';refreshWalletInfo();}
  }
  function fmt(value,digits=5){return Number(value).toLocaleString(undefined,{maximumFractionDigits:digits});}
  function ageLabel(ms){
    if(!ms || !Number.isFinite(ms))return t('ageUnknown');
    const sec=Math.max(0,Math.floor((Date.now()-ms)/1000));
    if(sec<60)return t('justNow');
    if(sec<3600)return Math.floor(sec/60)+t('mins');
    if(sec<86400)return Math.floor(sec/3600)+t('hours');
    return Math.floor(sec/86400)+t('days');
  }
  function getCosts(){
    const n=Math.max(0,Number($('sniper-network').value)||0);
    const p=Math.max(0,Number($('sniper-priority').value)||0);
    const d=Math.min(20,Math.max(0,Number($('sniper-dex').value)||0))/100;
    const s=Math.min(50,Math.max(0,Number($('sniper-slip').value)||0))/100;
    return {network:n,priority:p,dex:d,slip:s};
  }
  function metrics(position,price){
    const c=getCosts();
    const sellGross=position.quantity*price;
    const sellAfterCosts=sellGross*(1-c.dex)*(1-c.slip);
    const fixedFees=2*(c.network+c.priority);
    const buyCost=position.buySol-position.buySol*(1-c.dex)*(1-c.slip);
    const sellCost=sellGross-sellAfterCosts;
    const net=sellAfterCosts-position.buySol-fixedFees;
    return {sellGross,sellAfterCosts,net,pct:position.buySol>0?net/position.buySol*100:0,fees:buyCost+sellCost+fixedFees};
  }
  function make(tag,cls,text){
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=text;
    return el;
  }
  function renderCandidates(){
    const host=$('sniper-candidates'); if(!host)return;
    host.replaceChildren();
    const visible = state.candidates.filter(item=>{
      if(state.requireSocials && item.hasSocials!==true)return false;
      const q=String(state.nameQuery||'').trim().toLowerCase();
      if(q && !(String(item.name||'')+' '+String(item.symbol||'')).toLowerCase().includes(q))return false;
      if(state.creatorFilter==='repeat' && item.creatorHistoryStatus!=='repeat')return false;
      if(state.creatorFilter==='first' && item.creatorHistoryStatus!=='first_seen')return false;
      return true;
    });
    if(!visible.length){
      const msg=state.candidates.length?uiText('noMatches'):(state.busy?t('loading'):t('noCandidates'));
      host.append(make('p','sniper-muted',msg));
      return;
    }
    visible.forEach(item=>{
      const row=make('div','sniper-candidate');
      const main=make('div','sniper-candidate-main');
      main.append(make('strong','sniper-token-name',item.symbol+' · '+item.name));
      const age=item.eventAt||item.pairCreatedAt;
      const sourceLabel=item.source==='pumpportal'?' · '+t('liveTag'):' · '+uiText('dexProfile');
      const addressLine=make('small','sniper-muted sniper-token-address',item.address+' · '+ageLabel(age)+sourceLabel);
      addressLine.title=item.address;
      main.append(addressLine);
      const stats=make('div','sniper-candidate-stats');
      if(item.source==='pumpportal'){
        const m=item.firstMinute||{};
        stats.append(make('span','',uiText('buy')+' '+Number(m.buyCount||0)+' / '+uiText('sell')+' '+Number(m.sellCount||0)));
        stats.append(make('span','',uiText('net')+' '+fmt(m.netSol||0,4)+' SOL'));
        stats.append(make('span','',uiText('move')+' '+(m.priceChangePct==null?'—':fmt(m.priceChangePct,2)+'%')));
        stats.append(make('span','',t('price')+': '+(item.priceNative>0?fmt(item.priceNative,9):t('waitingForPool'))+' SOL'));
      }else{
        stats.append(make('span','',t('liquidity')+': USD '+fmt(item.liquidityUsd,0)));
        stats.append(make('span','',t('price')+': '+(item.priceNative>0?fmt(item.priceNative,9):t('waitingForPool'))));
      }
      if(item.hasSocials!==null&&item.hasSocials!==undefined)stats.append(make('span','',uiText('socials')+(item.hasSocials?' ✓':' —')));
      if(item.creatorHistoryStatus&&item.creatorHistoryStatus!=='unknown')stats.append(make('span','', 'DEV '+uiText(item.creatorHistoryStatus==='repeat'?'devRepeat':'devFirstSeen')+(item.creatorLaunchCount?' · '+item.creatorLaunchCount:'')));
      if(Number(item.boostTotal||item.boostAmount)>0)stats.append(make('span','',uiText('boosts')+' '+Number(item.boostTotal||item.boostAmount)));
      if(Number(item.communityVotes)>0)stats.append(make('span','',uiText('communityVotes')+' '+Number(item.communityVotes)+' · '+fmt(item.communityRating||0,1)+'/5'));
      const action=make('button','sniper-action',item.priceNative>0?t('action'):t('waitingForPool'));
      action.type='button';
      action.disabled=!(item.priceNative>0);
      action.addEventListener('click',()=>openPaper(item));
      const link=make('a','sniper-link',item.source==='pumpportal'?'PUMP.FUN ↗':'DEXSCREENER ↗');
      link.href=item.source==='pumpportal'?'https://pump.fun/coin/'+encodeURIComponent(item.address):item.url;
      link.target='_blank';link.rel='noopener noreferrer';
      row.append(main,stats,link,action);host.append(row);
    });
    maybeAutoEnter();
  }
  function renderPositions(mode){
    if(!mode)mode=$('zombie-sniper-demo')?.dataset.activeTab==='history'?'history':'open';
    const host=$('sniper-positions');if(!host)return;
    host.replaceChildren();
    const historyMode=mode==='history';
    const visiblePositions=state.positions.filter(p=>historyMode?p.status==='closed':p.status==='open');
    if(!visiblePositions.length){host.append(make('p','sniper-muted',historyMode?uiText('noClosed'):uiText('noOpen')));renderStats();return;}
    visiblePositions.slice().sort((a,b)=>Number((historyMode?b.closedAt:b.openedAt)||0)-Number((historyMode?a.closedAt:a.openedAt)||0)).forEach(p=>{
      const row=make('article','sniper-position zs-position-card');
      const head=make('div','zs-position-topline');
      const identity=make('div','zs-position-identity');
      identity.append(make('strong','zs-position-symbol',String(p.symbol||'TOKEN').toUpperCase()));
      identity.append(make('span','zs-position-status '+(p.status==='open'?'is-open':'is-closed'),p.status==='open'?(uiText('statusOpen')):(uiText('statusClosed'))));
      const pnl=make('strong','zs-position-pnl '+(Number(p.netPnl)>=0?'is-positive':'is-negative'),(p.netPnl>=0?'+':'')+fmt(p.netPnl||0,6)+' SOL');
      head.append(identity,pnl);
      const detail=make('div','zs-position-metrics');
      const metric=(label,value)=>{const cell=make('div','zs-position-metric');cell.append(make('small','',label),make('strong','',value));detail.append(cell);};
      metric(uiText('tradeSize'),fmt(p.buySol||0,6)+' SOL');
      metric(uiText('entryPrice'),fmt(p.entryPrice,9)+' SOL');
      metric(historyMode?(uiText('exitPrice')):(uiText('currentPrice')),fmt(p.lastPrice||p.entryPrice,9)+' SOL');
      metric(historyMode?(uiText('tradeResult')):(uiText('currentPnl')),((Number(p.netPnl)||0)>=0?'+':'')+fmt(p.netPnl||0,6)+' SOL · '+((Number(p.netPct)||0)>=0?'+':'')+fmt(p.netPct||0,2)+'%');
      const contract=make('div','zs-position-contract');
      const contractLabel=make('small','',uiText('contract'));
      const address=String(p.address||'');
      const addressText=make('code','zs-position-address',address?address.slice(0,7)+'…'+address.slice(-7):(uiText('addressNA')));
      const copyBtn=make('button','zs-copy-address',walletText('copy'));
      copyBtn.type='button';copyBtn.disabled=!address;copyBtn.addEventListener('click',async()=>{
        try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(address);else{const temp=document.createElement('textarea');temp.value=address;temp.style.position='fixed';temp.style.opacity='0';document.body.append(temp);temp.select();document.execCommand('copy');temp.remove();}
          copyBtn.textContent=walletText('copied');window.setTimeout(()=>{copyBtn.textContent=walletText('copy');},1300);
        }catch(_){copyBtn.textContent=walletText('failed');}
      });
      contract.append(contractLabel,addressText,copyBtn);
      const graph=make('div','zs-position-chart');graph.append(sparkline(p.priceHistory&&p.priceHistory.length?p.priceHistory:[p.entryPrice,p.lastPrice||p.entryPrice]));
      row.append(head,detail,contract,graph);
      if(p.status==='open'){const close=make('button','sniper-action sniper-close zs-position-close',dcopy().close||t('manualClose'));close.type='button';close.addEventListener('click',()=>closePaper(p.id,'manual'));row.append(close);}
      else if(historyMode){const closedAt=Number(p.closedAt)||0;row.append(make('small','zs-position-reason',uiText('closedPrefix')+(closedAt?new Date(closedAt).toLocaleString():'—')+(p.exitReason?' · '+String(p.exitReason).toUpperCase():'')));}
      host.append(row);
    });
    renderStats();
  }
  async function fetchPairs(address){
    const r=await fetch(API+'/token-pairs/v1/solana/'+encodeURIComponent(address),{cache:'no-store'});
    if(!r.ok)throw new Error('pair lookup '+r.status);
    const pairs=await r.json();
    const valid=(Array.isArray(pairs)?pairs:[]).filter(p=>p && p.chainId==='solana' && p.baseToken && p.baseToken.address===address && p.quoteToken && (p.quoteToken.symbol==='SOL'||p.quoteToken.address===WRAPPED_SOL) && Number(p.priceNative)>0);
    valid.sort((a,b)=>(Number(b.liquidity&&b.liquidity.usd)||0)-(Number(a.liquidity&&a.liquidity.usd)||0));
    return valid[0]||null;
  }
  async function refreshFeed(force=false){
    if(!terminal.auto&&!force)return;
    if(state.busy)return;
    state.busy=true;renderCandidates();
    try{
      const candidateResponse=await fetch(AUTH_API+'/api/sniper/candidates?source='+encodeURIComponent(state.source)+'&limit=40',{cache:'no-store'});
      if(!candidateResponse.ok)throw new Error('candidate source '+candidateResponse.status);
      const candidateData=await candidateResponse.json();
      const feed=candidateData.feed||{};
      state.feed={...state.feed,...feed};
      state.candidates=(Array.isArray(candidateData.candidates)?candidateData.candidates:[]).map(item=>{
        const address=String(item.mint||'');
        const firstMinute=item.firstMinute||{};
        const eventAt=Number(item.eventAt)||0;
        const curvePrice=Number(firstMinute.lastPriceSol)>0?Number(firstMinute.lastPriceSol):Number(item.priceSol)||0;
        const source=item.source||'community';
        return {...item,address,name:item.name||'Unknown',symbol:item.symbol||'TOKEN',
          priceNative:curvePrice,liquidityUsd:Number(item.liquidityUsd)||0,eventAt,
          firstMinute,source,tradeStreamingEnabled:!!feed.tradeStreamingEnabled,
          creatorHistoryStatus:item.creatorHistoryStatus||'unknown'};
      }).filter(item=>item.address&&item.address!==OFFICIAL_MINT);
      const tradeReady=!!feed.pumpdevConnected;
      const visibleSources=[...new Set(state.candidates.flatMap(x=>x.sources||[x.source]))];
      $('sniper-feed-status').textContent=uiText('sources')+(visibleSources.join(' · ')||'—')+
        (tradeReady?' · PUMPDEV TRADE STREAM READY':' · PAPER FEED — LIVE TRADE STREAM NOT CONNECTED');
      renderDashboardState();
    }catch(error){
      state.candidates=[];
      $('sniper-feed-status').textContent=uiText('sourcesUnavailable')+String(error&&error.message||'error').slice(0,70);
    }finally{state.busy=false;renderCandidates();}
  }
  function openPaper(item,automatic){
    const openCount=state.positions.filter(p=>p.status==='open').length;
    const maxOpen=Math.max(1,Math.min(20,Math.round(Number(terminal.maxOpenPositions??4))));
    if(maxOpen===0||openCount>=maxOpen){if(!automatic)alert(maxOpen===0?uiText('noNewTrades'):uiText('maxOpenReached').replace('{count}',String(maxOpen)));return;}
    const buySol=Number($('sniper-size').value);
    const todayStart=new Date();todayStart.setHours(0,0,0,0);
    const todayLoss=state.positions.filter(p=>p.status==='closed'&&Number(p.closedAt||0)>=todayStart.getTime()&&Number(p.netPnl)<0)
      .reduce((sum,p)=>sum+Math.abs(Number(p.netPnl)||0),0);
    const dailyCap=Math.max(0,Number(terminal.maxDailyLossSol)||0);
    if(dailyCap>0&&todayLoss>=dailyCap){if(!automatic)alert(uiText('dailyLoss'));return;}
    const maxTrade=Math.max(0.001,Math.min(1000,Number($('sniper-capital')&&$('sniper-capital').value)||10));if(!Number.isFinite(buySol)||buySol<=0||buySol>maxTrade){if(!automatic)alert(uiText('tradeSizeError'));return;}
    if(!item||!Number.isFinite(item.priceNative)||item.priceNative<=0){if(!automatic)alert(t('noPair'));return;}
    if(item.source!=='pumpportal'&&Number(item.liquidityUsd||0)<Number(terminal.minLiquidity||0)){if(!automatic)alert(uiText('lowLiquidity'));return;}
    const c=getCosts();
    const closed=state.positions.filter(x=>x.status==='closed').reduce((a,x)=>a+(Number(x.netPnl)||0),0);
    const used=state.positions.filter(x=>x.status==='open').reduce((a,x)=>a+(Number(x.buySol)||0),0);
    if(buySol+used>Number(terminal.capital||10)+closed){if(!automatic)alert(uiText('noBalance'));return;}
    const quantity=buySol*(1-c.dex)*(1-c.slip)/item.priceNative;
    const now=Date.now();const p={id:makeUuid(),address:item.address,symbol:item.symbol,name:item.name,buySol,entryPrice:item.priceNative,lastPrice:item.priceNative,lastObservedPrice:item.priceNative,lastMovementAt:now,lastQuoteAt:now,quantity,openedAt:now,status:'open',netPnl:0,netPct:0,exitReason:null,priceHistory:[item.priceNative],source:item.source||'manual',_ownerTelegramId:telegramId()||'guest'};
    state.positions.push(p);saveStore();renderPositions();renderStats();persistPosition(p);logEvent('BUY',item.symbol,'',automatic?'autoEntry':'manualEntry',{amount:fmt(buySol,4)});if(!automatic)alert(t('buyOk'));
  }
  function closePaper(id,reason){
    const p=state.positions.find(x=>x.id===id&&x.status==='open');if(!p)return;
    const m=metrics(p,p.lastPrice||p.entryPrice);
    p.status='closed';p.closedAt=Date.now();p.netPnl=m.net;p.netPct=m.pct;p.sellSol=m.sellGross;p.exitReason=reason;
    saveStore();renderPositions();renderStats();persistPosition(p);logEvent('SELL',p.symbol,'','manualClose',{pct:fmt(m.pct,2)});
  }
  async function updatePositions(){
    const open=state.positions.filter(p=>p.status==='open');
    let rotated=false;
    for(const p of open){
      try{
        let price=0;
        const token=authToken();
        if(token){
          try{
            const quote=await fetch(AUTH_API+'/api/sniper/trades?mint='+encodeURIComponent(p.address),{headers:{'Authorization':'Bearer '+token},cache:'no-store'});
            if(quote.ok){const data=await quote.json();price=Number(data.trade&&data.trade.priceSol)||0;}
          }catch(_){}
        }
        if(!(price>0)){
          const pair=await fetchPairs(p.address);if(!pair)continue;price=Number(pair.priceNative);
        }
        const now=Date.now();
        if(!Number.isFinite(price)||price<=0)continue;
        p.lastQuoteAt=now;
        const previous=Number(p.lastObservedPrice||p.lastPrice||p.entryPrice);
        const movePct=previous>0?Math.abs((price-previous)/previous*100):0;
        const threshold=Math.max(0.001,Number($('sniper-min-move')&&$('sniper-min-move').value)||0.2);
        if(movePct>=threshold){p.lastMovementAt=now;p.lastObservedPrice=price;}
        p.lastPrice=price;
        p.priceHistory=Array.isArray(p.priceHistory)?p.priceHistory:[];p.priceHistory.push(price);p.priceHistory=p.priceHistory.slice(-48);
        const m=metrics(p,price);p.netPnl=m.net;p.netPct=m.pct;
        const target=Number($('sniper-target').value)||10;
        const stop=Number($('sniper-stop').value)||0;
        const idleSeconds=Math.max(15,Number($('sniper-idle-timeout')&&$('sniper-idle-timeout').value)||60);
        if(m.pct>=target){p.status='closed';p.closedAt=now;p.sellSol=m.sellGross;p.exitReason='target';logEvent('SELL',p.symbol,'','netTarget',{pct:fmt(m.pct,2)});rotated=true;}
        else if(stop>0&&m.pct<=-stop){p.status='closed';p.closedAt=now;p.sellSol=m.sellGross;p.exitReason='stop';logEvent('SELL',p.symbol,'','netStop',{pct:fmt(m.pct,2)});rotated=true;}
        else if(now-Number(p.lastMovementAt||p.openedAt)>=idleSeconds*1000){
          p.status='closed';p.closedAt=now;p.sellSol=m.sellGross;p.exitReason='stagnant';
          logEvent('ROTATE',p.symbol,'','rotate',{threshold,seconds:idleSeconds});rotated=true;
        }
      }catch(_){}
    }
    saveStore();renderPositions();renderStats();
    for(const p of open)await persistPosition(p);
    if(rotated&&terminal.auto){terminal.lastAuto=0;maybeAutoEnter();}
  }

  const DASH_COPY = {
    en:{nav:['Sniper','Stats','History','Settings','Help'],balance:'Virtual balance',profit:'Total P/L',trades:'Trades',wins:'Win rate',active:'Open positions',settings:'SIMULATION SETTINGS',capital:'Starting capital (SOL)',minliq:'DEX fallback liquidity only (USD)',maxsize:'Maximum trade size (SOL)',autopilot:'AUTO SNIPER',armed:'AUTOSNIPER ACTIVE',paused:'AUTOSNIPER PAUSED',start:'START',pause:'PAUSE',stop:'STOP',launches:'LIVE LAUNCH FEED',journal:'SYSTEM LOG',empty:'No events yet',chart:'POSITION PERFORMANCE',demo:'DEMO MODE · PAPER TRADING',fullScreen:'FULL SCREEN',exitFullScreen:'EXIT FULL SCREEN',refreshResults:'REFRESH RESULTS',autoCore:'AUTO SNIPER',hint:'All settings are virtual and editable. No wallet or real transactions.',open:'OPEN',closed:'CLOSED',entry:'Entry',current:'Current',net:'Net',close:'Close demo position'},
    ru:{nav:['Снайпер','Статистика','История','Настройки','Помощь'],balance:'Виртуальный баланс',profit:'Общий P/L',trades:'Сделки',wins:'Успешных',active:'Активные позиции',settings:'ПАРАМЕТРЫ СИМУЛЯЦИИ',capital:'Стартовый капитал (SOL)',minliq:'Ликвидность только для DEX fallback (USD)',maxsize:'Макс. размер сделки (SOL)',autopilot:'АВТОСНАЙПЕР',armed:'АВТОСНАЙПЕР АКТИВЕН',paused:'АВТОСНАЙПЕР НА ПАУЗЕ',start:'ЗАПУСТИТЬ',pause:'ПАУЗА',stop:'СТОП',launches:'ЛЕНТА ЗАПУСКОВ LIVE',journal:'ЖУРНАЛ СИСТЕМЫ',empty:'Событий пока нет',chart:'ДИНАМИКА ПОЗИЦИИ',demo:'ДЕМО-РЕЖИМ · ТОРГОВЛЯ В ДЕМО',fullScreen:'НА ВЕСЬ ЭКРАН',exitFullScreen:'ВЫЙТИ ИЗ ПОЛНОЭКРАННОГО РЕЖИМА',refreshResults:'ОБНОВИТЬ РЕЗУЛЬТАТЫ',autoCore:'АВТОСНАЙПЕР',hint:'Все параметры виртуальные и редактируемые. Без кошелька и реальных транзакций.',open:'ОТКРЫТА',closed:'ЗАКРЫТА',entry:'Вход',current:'Сейчас',net:'Чистый P/L',close:'Закрыть демо-позицию'},
    de:{nav:['Sniper','Statistik','Verlauf','Einstellungen','Hilfe'],balance:'Virtuelles Guthaben',profit:'Gesamt-P/L',trades:'Trades',wins:'Erfolgsquote',active:'Offene Positionen',settings:'SIMULATIONSEINSTELLUNGEN',capital:'Startkapital (SOL)',minliq:'Mindestliquidität (USD)',maxsize:'Maximale Handelsgröße (SOL)',autopilot:'AUTO-SNIPER',armed:'AUTO-SNIPER AKTIV',paused:'AUTO-SNIPER PAUSIERT',start:'START',pause:'PAUSE',stop:'STOPP',launches:'LIVE TOKEN-STARTS',journal:'SYSTEMPROTOKOLL',empty:'Noch keine Ereignisse',chart:'POSITIONSVERLAUF',demo:'DEMO-MODUS · SIMULIERTER HANDEL',fullScreen:'VOLLBILD',exitFullScreen:'VOLLbild BEENDEN',refreshResults:'ERGEBNISSE AKTUALISIEREN',autoCore:'AUTO-SNIPER',hint:'Alle Werte sind virtuell und editierbar. Keine Wallet oder echten Transaktionen.',open:'OFFEN',closed:'GESCHLOSSEN',entry:'Einstieg',current:'Aktuell',net:'Netto',close:'Demo-Position schließen'},
    fr:{nav:['Sniper','Stats','Historique','Réglages','Aide'],balance:'Solde virtuel',profit:'P/L total',trades:'Transactions',wins:'Taux de réussite',active:'Positions ouvertes',settings:'PARAMÈTRES DE SIMULATION',capital:'Capital initial (SOL)',minliq:'Liquidité minimale (USD)',maxsize:'Taille maximale de transaction (SOL)',autopilot:'AUTO-SNIPER',armed:'AUTO-SNIPER ACTIF',paused:'AUTO-SNIPER EN PAUSE',start:'DÉMARRER',pause:'PAUSE',stop:'ARRÊTER',launches:'NOUVEAUX TOKENS LIVE',journal:'JOURNAL SYSTÈME',empty:'Aucun événement',chart:'PERFORMANCE',demo:'MODE DÉMO · TRADING SIMULÉ',fullScreen:'PLEIN ÉCRAN',exitFullScreen:'QUITTER LE PLEIN ÉCRAN',refreshResults:'ACTUALISER LES RÉSULTATS',autoCore:'AUTO-SNIPER',hint:'Tous les paramètres sont virtuels et modifiables. Aucun portefeuille ni transaction réelle.',open:'OUVERTE',closed:'FERMÉE',entry:'Entrée',current:'Actuel',net:'Net',close:'Fermer la position démo'},
    it:{nav:['Sniper','Statistiche','Cronologia','Impostazioni','Aiuto'],balance:'Saldo virtuale',profit:'P/L totale',trades:'Operazioni',wins:'Successi',active:'Posizioni aperte',settings:'PARAMETRI SIMULAZIONE',capital:'Capitale iniziale (SOL)',minliq:'Liquidità minima (USD)',maxsize:'Dimensione massima operazione (SOL)',autopilot:'AUTO-SNIPER',armed:'AUTO-SNIPER ATTIVO',paused:'AUTO-SNIPER IN PAUSA',start:'AVVIA',pause:'PAUSA',stop:'STOP',launches:'NUOVI TOKEN LIVE',journal:'LOG DI SISTEMA',empty:'Nessun evento',chart:'ANDAMENTO POSIZIONE',demo:'MODALITÀ DEMO · TRADING SIMULATO',fullScreen:'SCHERMO INTERO',exitFullScreen:'ESCI DA SCHERMO INTERO',refreshResults:'AGGIORNA RISULTATI',autoCore:'AUTO-SNIPER',hint:'Tutti i parametri sono virtuali e modificabili. Nessun wallet o trade reale.',open:'APERTA',closed:'CHIUSA',entry:'Ingresso',current:'Attuale',net:'Netto',close:'Chiudi posizione demo'},
    ja:{nav:['スナイパー','統計','履歴','設定','ヘルプ'],balance:'仮想残高',profit:'合計損益',trades:'取引',wins:'勝率',active:'保有ポジション',settings:'シミュレーション設定',capital:'開始資金 (SOL)',minliq:'最低流動性 (USD)',maxsize:'最大交易额 (SOL)',autopilot:'自動スナイパー',armed:'自動スナイパー稼働中',paused:'自動スナイパー一時停止',start:'開始',pause:'一時停止',stop:'停止',launches:'ライブ新規トークン',journal:'システムログ',empty:'イベントはありません',chart:'ポジション推移',demo:'デモモード · 仮想取引',fullScreen:'全画面表示',exitFullScreen:'全画面表示を終了',refreshResults:'結果を更新',autoCore:'自動スナイパー',hint:'設定はすべて仮想で変更可能。ウォレットや実取引はありません。',open:'保有中',closed:'終了',entry:'購入',current:'現在',net:'純損益',close:'デモポジションを閉じる'},
    'zh-CN':{nav:['狙击','统计','历史','设置','帮助'],balance:'虚拟余额',profit:'总盈亏',trades:'交易',wins:'胜率',active:'当前持仓',settings:'模拟参数',capital:'初始资金 (SOL)',minliq:'最低流动性 (USD)',maxsize:'最大交易额 (SOL)',autopilot:'自动狙击',armed:'自动狙击已启动',paused:'自动狙击已暂停',start:'启动',pause:'暂停',stop:'停止',launches:'实时新币',journal:'系统日志',empty:'暂无事件',chart:'持仓走势',demo:'模拟模式 · 虚拟交易',fullScreen:'全屏显示',exitFullScreen:'退出全屏',refreshResults:'刷新结果',autoCore:'自动狙击',hint:'所有参数均为可编辑的虚拟设置，不连接钱包，不进行真实交易。',open:'持有中',closed:'已关闭',entry:'买入',current:'当前',net:'净盈亏',close:'关闭模拟仓位'},
    tr:{nav:['Sniper','İstatistik','Geçmiş','Ayarlar','Yardım'],balance:'Sanal bakiye',profit:'Toplam K/Z',trades:'İşlemler',wins:'Başarı oranı',active:'Açık pozisyonlar',settings:'SİMÜLASYON AYARLARI',capital:'Başlangıç sermayesi (SOL)',minliq:'Minimum likidite (USD)',maxsize:'Maksimum işlem boyutu (SOL)',autopilot:'OTOMATİK SNIPER',armed:'OTOMATİK SNIPER AKTİF',paused:'OTOMATİK SNIPER DURAKLATILDI',start:'BAŞLAT',pause:'DURAKLAT',stop:'DURDUR',launches:'CANLI TOKEN AKIŞI',journal:'SİSTEM GÜNLÜĞÜ',empty:'Henüz olay yok',chart:'POZİSYON GRAFİĞİ',demo:'DEMO MODU · SANAL İŞLEM',fullScreen:'TAM EKRAN',exitFullScreen:'TAM EKRANDAN ÇIK',refreshResults:'SONUÇLARI YENİLE',autoCore:'OTOMATİK SNIPER',hint:'Tüm ayarlar sanaldır ve düzenlenebilir. Cüzdan veya gerçek işlem yoktur.',open:'AÇIK',closed:'KAPALI',entry:'Giriş',current:'Güncel',net:'Net',close:'Demo pozisyonunu kapat'},
    hi:{nav:['स्नाइपर','आँकड़े','इतिहास','सेटिंग्स','मदद'],balance:'वर्चुअल बैलेंस',profit:'कुल P/L',trades:'ट्रेड',wins:'सफलता दर',active:'खुली पोज़िशन',settings:'सिमुलेशन सेटिंग्स',capital:'शुरुआती पूँजी (SOL)',minliq:'न्यूनतम लिक्विडिटी (USD)',maxsize:'अधिकतम ट्रेड आकार (SOL)',autopilot:'ऑटो स्नाइपर',armed:'ऑटो स्नाइपर सक्रिय',paused:'ऑटो स्नाइपर रुका हुआ',start:'शुरू',pause:'रोकें',stop:'बंद',launches:'लाइव टोकन लॉन्च',journal:'सिस्टम लॉग',empty:'अभी कोई इवेंट नहीं',chart:'पोज़िशन प्रदर्शन',demo:'डेमो मोड · वर्चुअल ट्रेडिंग',fullScreen:'फ़ुल स्क्रीन',exitFullScreen:'फ़ुल स्क्रीन से बाहर आएँ',refreshResults:'परिणाम रीफ़्रेश करें',autoCore:'ऑटो स्नाइपर',hint:'सभी सेटिंग्स वर्चुअल और संपादन योग्य हैं। कोई वॉलेट या वास्तविक लेनदेन नहीं।',open:'खुली',closed:'बंद',entry:'एंट्री',current:'वर्तमान',net:'नेट',close:'डेमो पोज़िशन बंद करें'}
  };
  const START_CONFIRM_COPY={"en":["STARTUP CHECK","Virtual capital","Paper trade size","Take Profit","Stop Loss","DEX fee / side","Slippage / side","Network / priority fees","Slippage exceeds 5% per side.","DEX fee exceeds 2% per side.","Trade size is above the 0.05 SOL starter suggestion.","Start Auto Sniper in PAPER DEMO mode? No real transactions will be sent.","Start demo","Cancel"],"ru":["ПРОВЕРКА ПЕРЕД ЗАПУСКОМ","Виртуальный капитал","Размер демо-сделки","Тейк-профит","Стоп-лосс","Комиссия DEX / сторона","Проскальзывание / сторона","Сеть / приоритетные комиссии","Проскальзывание выше 5% на сторону.","Комиссия DEX выше 2% на сторону.","Размер сделки выше стартовой рекомендации 0,05 SOL.","Запустить автоснайпер в ДЕМО-РЕЖИМЕ? Реальных транзакций не будет.","Запустить демо","Отмена"],"de":["STARTPRÜFUNG","Virtuelles Kapital","Demo-Handelsgröße","Take-Profit","Stop-Loss","DEX-Gebühr / Seite","Slippage / Seite","Netzwerk- / Prioritätsgebühr","Slippage über 5 % pro Seite.","DEX-Gebühr über 2 % pro Seite.","Handelsgröße über der Startempfehlung von 0,05 SOL.","Auto-Sniper im PAPER-DEMO-Modus starten? Es werden keine echten Transaktionen gesendet.","Demo starten","Abbrechen"],"fr":["VÉRIFICATION AVANT DÉMARRAGE","Capital virtuel","Taille de la transaction démo","Take-profit","Stop-loss","Frais DEX / côté","Glissement / côté","Frais réseau / priorité","Glissement supérieur à 5 % par côté.","Frais DEX supérieurs à 2 % par côté.","Taille supérieure à la recommandation initiale de 0,05 SOL.","Lancer Auto Sniper en mode démo papier ? Aucune transaction réelle ne sera envoyée.","Lancer la démo","Annuler"],"it":["CONTROLLO PRIMA DELL'AVVIO","Capitale virtuale","Dimensione operazione demo","Take profit","Stop loss","Commissione DEX / lato","Slippage / lato","Commissioni rete / priorità","Slippage superiore al 5% per lato.","Commissione DEX superiore al 2% per lato.","Dimensione superiore al suggerimento iniziale di 0,05 SOL.","Avviare Auto Sniper in modalità demo? Non verranno inviate transazioni reali.","Avvia demo","Annulla"],"ja":["起動前の確認","仮想資金","デモ取引額","利確","損切り","DEX手数料 / 片道","スリッページ / 片道","ネットワーク / 優先手数料","片道スリッページが5%を超えています。","片道DEX手数料が2%を超えています。","取引額が初期推奨額0.05 SOLを超えています。","ペーパーデモモードでAuto Sniperを起動しますか？実際の取引は送信されません。","デモを開始","キャンセル"],"zh-CN":["启动前检查","虚拟资金","模拟交易金额","止盈","止损","DEX费用 / 单边","滑点 / 单边","网络 / 优先费用","单边滑点超过5%。","单边DEX费用超过2%。","交易金额高于0.05 SOL的初始建议值。","以模拟模式启动自动狙击？不会发送真实交易。","启动模拟","取消"],"tr":["BAŞLATMA ÖNCESİ KONTROL","Sanal sermaye","Demo işlem miktarı","Kâr al","Zarar durdur","DEX ücreti / taraf","Kayma / taraf","Ağ / öncelik ücretleri","Taraf başına kayma %5'i aşıyor.","Taraf başına DEX ücreti %2'yi aşıyor.","İşlem boyutu 0,05 SOL başlangıç önerisini aşıyor.","Auto Sniper demo modunda başlatılsın mı? Gerçek işlem gönderilmeyecek.","Demoyu başlat","İptal"],"hi":["शुरू करने से पहले जाँच","वर्चुअल पूँजी","डेमो ट्रेड राशि","टेक प्रॉफ़िट","स्टॉप लॉस","DEX शुल्क / पक्ष","स्लिपेज / पक्ष","नेटवर्क / प्राथमिकता शुल्क","प्रति पक्ष स्लिपेज 5% से अधिक है।","प्रति पक्ष DEX शुल्क 2% से अधिक है।","ट्रेड राशि 0.05 SOL की शुरुआती अनुशंसा से अधिक है।","क्या Auto Sniper को डेमो मोड में शुरू करें? कोई वास्तविक लेनदेन नहीं भेजा जाएगा।","डेमो शुरू करें","रद्द करें"]};
  function showCenteredConfirm(rows){return new Promise(resolve=>{const labels=START_CONFIRM_COPY[state.lang]||START_CONFIRM_COPY.en;let d=document.getElementById('zs-start-confirm');if(d)d.remove();d=document.createElement('dialog');d.id='zs-start-confirm';d.style.cssText='width:min(560px,calc(100vw - 32px));max-width:560px;max-height:82vh;padding:0;border:1px solid #71836e;border-radius:16px;background:#101a17;color:#edf3e9;box-shadow:0 24px 80px #000b;overflow:hidden;margin:auto';const st=document.createElement('style');st.textContent='#zs-start-confirm::backdrop{background:rgba(0,0,0,.72);backdrop-filter:blur(3px)}#zs-start-confirm .zs-h{padding:18px 22px;border-bottom:1px solid #405148;font-weight:800;letter-spacing:.08em}#zs-start-confirm .zs-b{padding:18px 22px;overflow:auto;max-height:calc(82vh - 130px);font-size:14px;line-height:1.65}#zs-start-confirm .zs-r{padding:4px 0;border-bottom:1px solid #293831}#zs-start-confirm .zs-w{color:#f0c27b}#zs-start-confirm .zs-f{display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;background:#0b1311;border-top:1px solid #405148}#zs-start-confirm button{border:1px solid #81977b;border-radius:9px;padding:10px 18px;font-weight:800;cursor:pointer}#zs-start-confirm .zs-ok{background:#b9c9ad;color:#111a14}#zs-start-confirm .zs-cancel{background:#1b2a24;color:#e7eee5}';const head=document.createElement('div');head.className='zs-h';head.textContent=labels[0];const body=document.createElement('div');body.className='zs-b';rows.forEach(row=>{const p=document.createElement('div');p.className='zs-r'+(row.warn?' zs-w':'');p.textContent=row.text;body.append(p)});const foot=document.createElement('div');foot.className='zs-f';const cancel=document.createElement('button');cancel.className='zs-cancel';cancel.textContent=labels[13];const ok=document.createElement('button');ok.className='zs-ok';ok.textContent=labels[12];foot.append(cancel,ok);d.append(st,head,body,foot);document.body.append(d);const done=v=>{if(d.open)d.close();d.remove();resolve(v)};cancel.addEventListener('click',()=>done(false));ok.addEventListener('click',()=>done(true));d.addEventListener('cancel',e=>{e.preventDefault();done(false)},{once:true});d.showModal()})}
  const EVENT_COPY = {
    en:{autoEntry:'Auto demo entry · {amount} SOL',manualEntry:'Manual demo entry · {amount} SOL',manualClose:'Manual demo close · {pct}%',netTarget:'Net target reached · {pct}%',netStop:'Net stop-loss reached · {pct}%',rotate:'No price movement ≥ {threshold}% for {seconds}s; moving to next launch',armed:'Paper mode confirmed · {amount} SOL',presetApplied:'{preset} profile applied',paused:'Paper engine paused; open paper positions remain managed.'},
    ru:{autoEntry:'Автоматический вход в демо · {amount} SOL',manualEntry:'Ручной вход в демо · {amount} SOL',manualClose:'Ручное закрытие демо · {pct}%',netTarget:'Достигнута цель чистой прибыли · {pct}%',netStop:'Достигнут стоп-лосс по чистому P/L · {pct}%',rotate:'Цена не менялась на {threshold}% в течение {seconds} с; переход к следующему запуску',armed:'Демо-режим подтверждён · {amount} SOL',presetApplied:'Применён профиль «{preset}»',paused:'Демо-движок остановлен; открытые демо-позиции продолжают отслеживаться.'},
    de:{autoEntry:'Automatischer Demo-Einstieg · {amount} SOL',manualEntry:'Manueller Demo-Einstieg · {amount} SOL',manualClose:'Demo-Position manuell geschlossen · {pct}%',netTarget:'Nettoziel erreicht · {pct}%',netStop:'Netto-Stop-Loss erreicht · {pct}%',rotate:'Keine Preisbewegung ≥ {threshold}% seit {seconds}s; nächster Tokenstart wird geprüft',armed:'Paper-Modus bestätigt · {amount} SOL',presetApplied:'Profil „{preset}“ angewendet',paused:'Paper-Engine pausiert; offene Paper-Positionen werden weiter überwacht.'},
    fr:{autoEntry:'Entrée démo automatique · {amount} SOL',manualEntry:'Entrée démo manuelle · {amount} SOL',manualClose:'Clôture manuelle de la démo · {pct}%',netTarget:'Objectif net atteint · {pct}%',netStop:'Stop-loss net atteint · {pct}%',rotate:'Aucun mouvement de prix ≥ {threshold}% pendant {seconds}s ; passage au prochain lancement',armed:'Mode papier confirmé · {amount} SOL',presetApplied:'Profil « {preset} » appliqué',paused:'Moteur papier en pause ; les positions ouvertes restent suivies.'},
    it:{autoEntry:'Ingresso demo automatico · {amount} SOL',manualEntry:'Ingresso demo manuale · {amount} SOL',manualClose:'Chiusura demo manuale · {pct}%',netTarget:'Obiettivo netto raggiunto · {pct}%',netStop:'Stop-loss netto raggiunto · {pct}%',rotate:'Nessun movimento del prezzo ≥ {threshold}% per {seconds}s; passaggio al prossimo lancio',armed:'Modalità paper confermata · {amount} SOL',presetApplied:'Profilo «{preset}» applicato',paused:'Motore paper in pausa; le posizioni aperte continuano a essere monitorate.'},
    ja:{autoEntry:'自動デモ購入 · {amount} SOL',manualEntry:'手動デモ購入 · {amount} SOL',manualClose:'デモポジションを手動決済 · {pct}%',netTarget:'純利益目標に到達 · {pct}%',netStop:'純損失ストップに到達 · {pct}%',rotate:'{seconds}秒間、価格変動が{threshold}%未満のため次のローンチへ移行',armed:'ペーパーモードを確認 · {amount} SOL',presetApplied:'「{preset}」プロファイルを適用',paused:'ペーパーエンジンを一時停止しました。保有中のデモポジションは引き続き監視されます。'},
    'zh-CN':{autoEntry:'自动模拟买入 · {amount} SOL',manualEntry:'手动模拟买入 · {amount} SOL',manualClose:'手动关闭模拟仓位 · {pct}%',netTarget:'已达到净利润目标 · {pct}%',netStop:'已触发净止损 · {pct}%',rotate:'{seconds}秒内价格变动未达到{threshold}%，转向下一个新币',armed:'已确认模拟模式 · {amount} SOL',presetApplied:'已应用“{preset}”配置',paused:'模拟引擎已暂停；仍会继续监控已开启的模拟仓位。'},
    tr:{autoEntry:'Otomatik demo girişi · {amount} SOL',manualEntry:'Manuel demo girişi · {amount} SOL',manualClose:'Manuel demo kapatma · {pct}%',netTarget:'Net hedefe ulaşıldı · {pct}%',netStop:'Net zarar durdur tetiklendi · {pct}%',rotate:'{seconds}s boyunca fiyat hareketi ≥ {threshold}% olmadı; sonraki lansmana geçiliyor',armed:'Paper modu onaylandı · {amount} SOL',presetApplied:'{preset} profili uygulandı',paused:'Paper motoru duraklatıldı; açık paper pozisyonları izlenmeye devam ediyor.'},
    hi:{autoEntry:'ऑटो डेमो एंट्री · {amount} SOL',manualEntry:'मैन्युअल डेमो एंट्री · {amount} SOL',manualClose:'मैन्युअल डेमो बंद · {pct}%',netTarget:'शुद्ध लक्ष्य पूरा · {pct}%',netStop:'शुद्ध स्टॉप-लॉस ट्रिगर · {pct}%',rotate:'{seconds}s तक कीमत में {threshold}% का बदलाव नहीं; अगले लॉन्च पर जा रहे हैं',armed:'पेपर मोड की पुष्टि · {amount} SOL',presetApplied:'{preset} प्रोफ़ाइल लागू',paused:'पेपर इंजन रोक दिया गया; खुली पेपर पोज़िशन की निगरानी जारी रहेगी।'}
  };
  function eventText(key, values={}) {
    const lang = EVENT_COPY[state.lang] || EVENT_COPY.en;
    return String(lang[key] || EVENT_COPY.en[key] || key).replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
  }

  const terminal={auto:false,startedAt:0,capital:10,minLiquidity:5000,maxTradeSize:10,maxOpenPositions:4,maxDailyLossSol:1,minBuyCount:3,idleTimeout:60,minMovePct:0.2,logs:[],seen:[],lastAuto:0,sessionStartCapital:10,equityHistory:[]};
  const TERMINAL_KEY='zombcash_sniper_terminal_v1';
  const dcopy=()=>DASH_COPY[state.lang]||DASH_COPY.en;
  function renderHelpPanel(){
    const helpPanel=$('zs-help-panel');
    if(!helpPanel)return;
    const data=HELP_COPY[state.lang]||HELP_COPY.en;
    helpPanel.replaceChildren();
    helpPanel.append(dashNode('h3','zs-help-heading',data.title),dashNode('p','zs-help-notice',data.notice));
    const grid=dashNode('div','zs-help-grid');
    data.sections.forEach(([heading,body])=>{
      const card=dashNode('article','zs-help-card');
      card.append(dashNode('h4','',heading),dashNode('p','',body));
      grid.append(card);
    });
    helpPanel.append(grid);
  }

  const HELP_COPY = {
    en:{title:'HELP & SAFETY',notice:'PAPER DEMO IS AVAILABLE NOW. LIVE TRADING IS NOT ENABLED. Registration is required for a personal profile and wallet provisioning, but signing up does not activate real trades.',sections:[
      ['01 / PAPER DEMO','Explore the launch feed, adjust the strategy settings and start or pause Auto Sniper. Every order is simulated with virtual SOL. No blockchain transaction is signed or sent, and demo profit/loss is not real money.'],
      ['02 / REGISTER YOUR ACCOUNT','On the ZombieCash website, choose JOIN THE SURVIVORS / REGISTER WITH TELEGRAM. Confirm the sign-in in Telegram, then return to the site. Your verified Telegram profile keeps your settings and trade history separate from other users. Registered users can sync demo history across devices.'],
      ['03 / YOUR UNIQUE SOLANA WALLET','After successful registration, ZombieCash automatically creates one unique managed Solana wallet for your account. On later logins, the same wallet is reused. You can see its public address in Sniper Settings. The private signing key is stored in protected server-side encrypted storage and is never displayed in the page. This is a project-managed wallet, not a browser-extension wallet.'],
      ['04 / FUNDING & LIVE TRADING','Live trading is currently locked for every account. The wallet being created does not mean it is ready for deposits or real orders. Do not send SOL or tokens to it yet. If Live Trading is officially enabled later, the site will show the required funding steps and confirmation controls. Registration alone will not switch Demo into Live mode.'],
      ['05 / SECURITY FIRST','Never share your Telegram login code, wallet recovery phrase or private key. Use only the official zombcash.github.io website and the Telegram sign-in opened from it. Check every order setting and token address. New-token trading is highly risky; you can lose the full amount once real trading is officially available.']
    ]},
    ru:{title:'СПРАВКА И БЕЗОПАСНОСТЬ',notice:'СЕЙЧАС ДОСТУПЕН ТОЛЬКО ДЕМО-РЕЖИМ. РЕАЛЬНАЯ ТОРГОВЛЯ ПОКА ОТКЛЮЧЕНА. Регистрация нужна для личного профиля и создания кошелька, но сама по себе не включает реальные сделки.',sections:[
      ['01 / ДЕМО-РЕЖИМ','Изучай ленту запусков, меняй параметры стратегии, запускай и ставь на паузу Auto Sniper. Все покупки и продажи моделируются на виртуальных SOL. Блокчейн-транзакции не подписываются и не отправляются. Демо-прибыль и убыток — не реальные деньги.'],
      ['02 / РЕГИСТРАЦИЯ НА САЙТЕ','На сайте ZombieCash нажми JOIN THE SURVIVORS / REGISTER WITH TELEGRAM. Подтверди вход в Telegram и вернись на сайт. Подтверждённый Telegram-профиль закрепляет за тобой личные настройки и отдельную историю сделок. У зарегистрированных пользователей демо-история синхронизируется между устройствами.'],
      ['03 / ТВОЙ ЛИЧНЫЙ SOLANA-КОШЕЛЁК','После успешной регистрации ZombieCash автоматически создаёт для твоего аккаунта отдельный управляемый Solana-кошелёк. При следующих входах используется тот же адрес. Публичный адрес можно посмотреть во вкладке Settings. Приватный ключ хранится на сервере в защищённом зашифрованном хранилище и не показывается на странице. Это кошелёк под управлением проекта, а не расширение Phantom в твоём браузере.'],
      ['04 / ПОПОЛНЕНИЕ И РЕАЛЬНАЯ ТОРГОВЛЯ','Сейчас Live Trading заблокирован для всех аккаунтов. Создание кошелька не означает, что он готов принимать депозиты или выполнять реальные сделки. Пока не отправляй на него SOL или токены. Если реальная торговля будет официально включена, сайт отдельно покажет инструкции по пополнению и подтверждению. Одна регистрация не переключает Demo в Live.'],
      ['05 / ПРАВИЛА БЕЗОПАСНОСТИ','Никому не сообщай код входа Telegram, seed-фразу или приватный ключ. Используй только официальный сайт zombcash.github.io и переход к Telegram из него. Проверяй параметры каждой сделки и адрес токена. Торговля новыми токенами крайне рискованна: после официального запуска реальной торговли можно потерять всю внесённую сумму.']
    ]},
    de:{title:'HILFE & SICHERHEIT',notice:'DER PAPER-DEMO-MODUS IST VERFÜGBAR. ECHTER HANDEL IST NOCH NICHT FREIGESCHALTET. Die Registrierung erstellt dein Profil und deine Wallet, aktiviert aber keine echten Trades.',sections:[
      ['01 / PAPER-DEMO','Sieh dir den Launch-Feed an, passe die Strategie an und starte oder pausiere Auto Sniper. Alle Käufe und Verkäufe werden mit virtuellem SOL simuliert. Es werden keine Blockchain-Transaktionen signiert oder gesendet. Demo-Gewinne und -Verluste sind kein echtes Geld.'],
      ['02 / KONTO REGISTRIEREN','Wähle auf der ZombieCash-Website JOIN THE SURVIVORS / REGISTER WITH TELEGRAM. Bestätige die Anmeldung in Telegram und kehre zur Website zurück. Dein bestätigtes Telegram-Profil erhält eigene Einstellungen und eine getrennte Handelshistorie. Demo-Verläufe registrierter Nutzer können geräteübergreifend synchronisiert werden.'],
      ['03 / DEINE EINZIGARTIGE SOLANA-WALLET','Nach der Registrierung erstellt ZombieCash automatisch eine eigene verwaltete Solana-Wallet für dein Konto. Bei späteren Anmeldungen wird dieselbe Wallet verwendet. Die öffentliche Adresse findest du unter Settings. Der private Signierschlüssel wird verschlüsselt in einem geschützten Serverspeicher aufbewahrt und niemals auf der Seite angezeigt. Dies ist eine vom Projekt verwaltete Wallet, keine Browser-Erweiterungs-Wallet.'],
      ['04 / EINZAHLUNG & LIVE-HANDEL','Live Trading ist derzeit für alle Konten gesperrt. Die Erstellung der Wallet bedeutet nicht, dass sie Einzahlungen oder echte Orders annehmen kann. Sende vorerst kein SOL und keine Token dorthin. Bei einer offiziellen Freischaltung zeigt die Website eigene Einzahlungs- und Bestätigungsschritte. Eine Registrierung allein aktiviert den Live-Modus nicht.'],
      ['05 / SICHERHEIT','Teile niemals deinen Telegram-Anmeldecode, deine Wiederherstellungsphrase oder deinen privaten Schlüssel. Nutze nur zombcash.github.io und den dort gestarteten Telegram-Login. Prüfe jede Order und Token-Adresse. Der Handel mit neuen Token ist sehr riskant; später kannst du den gesamten eingesetzten Betrag verlieren.']
    ]},
    fr:{title:'AIDE & SÉCURITÉ',notice:'LE MODE DÉMO EST DISPONIBLE. LE TRADING RÉEL N’EST PAS ENCORE ACTIVÉ. L’inscription crée votre profil et votre portefeuille, mais n’autorise pas les transactions réelles.',sections:[
      ['01 / MODE DÉMO','Consultez le flux de lancements, modifiez la stratégie et démarrez ou mettez Auto Sniper en pause. Tous les achats et ventes sont simulés avec des SOL virtuels. Aucune transaction blockchain n’est signée ni envoyée. Les gains et pertes de démonstration ne sont pas de l’argent réel.'],
      ['02 / CRÉER VOTRE COMPTE','Sur le site ZombieCash, choisissez JOIN THE SURVIVORS / REGISTER WITH TELEGRAM. Confirmez la connexion dans Telegram, puis revenez sur le site. Votre profil Telegram vérifié conserve vos paramètres et votre historique séparément. Les utilisateurs inscrits peuvent synchroniser leur historique démo entre appareils.'],
      ['03 / VOTRE PORTEFEUILLE SOLANA UNIQUE','Après l’inscription, ZombieCash crée automatiquement un portefeuille Solana géré et unique pour votre compte. Le même portefeuille est réutilisé lors des prochaines connexions. Son adresse publique apparaît dans Settings. La clé privée de signature est conservée dans un stockage serveur chiffré et protégé ; elle n’est jamais affichée sur la page. Il s’agit d’un portefeuille géré par le projet, pas d’une extension de navigateur.'],
      ['04 / DÉPÔTS ET TRADING RÉEL','Le Live Trading est actuellement verrouillé pour tous les comptes. La création du portefeuille ne signifie pas qu’il peut recevoir des dépôts ou passer des ordres réels. N’y envoyez pas de SOL ni de tokens pour le moment. Si le trading réel est officiellement activé, le site affichera les étapes de financement et de confirmation. L’inscription seule n’active pas le mode Live.'],
      ['05 / SÉCURITÉ','Ne partagez jamais votre code de connexion Telegram, votre phrase de récupération ou votre clé privée. Utilisez uniquement zombcash.github.io et la connexion Telegram lancée depuis ce site. Vérifiez chaque ordre et chaque adresse de token. Le trading de nouveaux tokens est très risqué : vous pourriez perdre la totalité du montant engagé.']
    ]},
    it:{title:'AIUTO E SICUREZZA',notice:'LA DEMO È DISPONIBILE. IL TRADING REALE NON È ANCORA ATTIVO. La registrazione crea il profilo e il wallet, ma non abilita le operazioni reali.',sections:[
      ['01 / MODALITÀ DEMO','Esplora il feed dei lanci, modifica la strategia e avvia o metti in pausa Auto Sniper. Acquisti e vendite sono simulati con SOL virtuali. Nessuna transazione blockchain viene firmata o inviata. Profitti e perdite demo non sono denaro reale.'],
      ['02 / REGISTRA IL TUO ACCOUNT','Sul sito ZombieCash scegli JOIN THE SURVIVORS / REGISTER WITH TELEGRAM. Conferma l’accesso su Telegram e torna al sito. Il profilo Telegram verificato mantiene impostazioni e cronologia separate dagli altri utenti. Gli utenti registrati possono sincronizzare la cronologia demo tra dispositivi.'],
      ['03 / IL TUO WALLET SOLANA UNICO','Dopo la registrazione, ZombieCash crea automaticamente un wallet Solana gestito e unico per il tuo account. Ai successivi accessi viene riutilizzato lo stesso wallet. L’indirizzo pubblico è visibile in Settings. La chiave privata di firma è conservata in un archivio server protetto e cifrato e non viene mai mostrata nella pagina. È un wallet gestito dal progetto, non un’estensione del browser.'],
      ['04 / DEPOSITI E TRADING REALE','Il Live Trading è attualmente bloccato per tutti gli account. La creazione del wallet non significa che sia pronto a ricevere depositi o eseguire ordini reali. Per ora non inviare SOL o token. Se il trading reale verrà attivato ufficialmente, il sito mostrerà le istruzioni per il finanziamento e la conferma. La sola registrazione non attiva la modalità Live.'],
      ['05 / SICUREZZA','Non condividere mai il codice di accesso Telegram, la frase di recupero o la chiave privata. Usa solo zombcash.github.io e il login Telegram avviato da quel sito. Controlla ogni ordine e indirizzo del token. Il trading di nuovi token è molto rischioso: potresti perdere l’intero importo investito.']
    ]},
    ja:{title:'ヘルプと安全',notice:'現在利用できるのはデモモードのみです。実取引はまだ有効化されていません。登録すると個人プロフィールとウォレットが作成されますが、登録だけで実取引は開始されません。',sections:[
      ['01 / デモモード','ローンチフィードを確認し、戦略設定を変更してAuto Sniperを開始または一時停止できます。売買はすべて仮想SOLによるシミュレーションです。ブロックチェーン取引への署名や送信は行われません。デモの損益は実際のお金ではありません。'],
      ['02 / アカウント登録','ZombieCashサイトでJOIN THE SURVIVORS / REGISTER WITH TELEGRAMを選択します。Telegramでログインを承認し、サイトに戻ってください。認証済みTelegramプロフィールに個別の設定と取引履歴が保存されます。登録ユーザーはデモ履歴を複数端末で同期できます。'],
      ['03 / あなた専用のSolanaウォレット','登録が完了すると、ZombieCashがアカウントごとに固有の管理型Solanaウォレットを自動作成します。次回以降のログインでは同じウォレットを使用します。公開アドレスはSettingsで確認できます。署名用秘密鍵はサーバー側の保護された暗号化ストレージに保存され、ページには表示されません。これはプロジェクト管理型ウォレットで、ブラウザー拡張ウォレットではありません。'],
      ['04 / 入金と実取引','現在、Live Tradingはすべてのアカウントでロックされています。ウォレットが作成されても、入金や実注文の準備ができたことを意味しません。現時点ではSOLやトークンを送らないでください。実取引が正式に有効化された場合、サイトに入金手順と確認操作が表示されます。登録だけではLiveモードになりません。'],
      ['05 / セキュリティ','Telegramログインコード、リカバリーフレーズ、秘密鍵を誰にも共有しないでください。zombcash.github.ioと、そこから開始するTelegramログインのみを使用してください。注文設定とトークンアドレスを毎回確認してください。新規トークン取引は非常に危険で、投じた資金をすべて失う可能性があります。']
    ]},
    'zh-CN':{title:'帮助与安全',notice:'目前仅开放模拟模式，真实交易尚未启用。注册会创建个人档案和钱包，但注册本身不会开启真实交易。',sections:[
      ['01 / 模拟模式','查看新币列表、调整策略参数，并启动或暂停 Auto Sniper。所有买卖均使用虚拟 SOL 模拟，不会签名或发送任何区块链交易。模拟盈亏不是真实资金。'],
      ['02 / 注册账户','在 ZombieCash 网站点击 JOIN THE SURVIVORS / REGISTER WITH TELEGRAM。前往 Telegram 确认登录，然后返回网站。经过验证的 Telegram 档案会保存独立的设置和交易历史。注册用户可以在不同设备间同步模拟历史。'],
      ['03 / 你的专属 Solana 钱包','注册成功后，ZombieCash 会为每个账户自动创建一个独立的托管型 Solana 钱包。以后登录时会继续使用同一个钱包。你可以在 Settings 中查看公开地址。用于签名的私钥保存在服务器端受保护的加密存储中，不会显示在网页上。这是项目托管的钱包，不是浏览器扩展钱包。'],
      ['04 / 充值与真实交易','目前所有账户的 Live Trading 均已锁定。钱包创建并不代表它已准备好接收充值或执行真实订单。现在请勿向该地址发送 SOL 或代币。如果未来正式开放真实交易，网站会显示充值步骤和确认操作。仅注册并不会启用 Live 模式。'],
      ['05 / 安全须知','绝不要分享 Telegram 登录验证码、钱包助记词或私钥。只使用 zombcash.github.io 以及从该网站打开的 Telegram 登录。每次都要核对订单设置和代币地址。新币交易风险极高，未来进行真实交易时可能损失全部投入资金。']
    ]},
    tr:{title:'YARDIM VE GÜVENLİK',notice:'ŞU ANDA YALNIZCA DEMO MODU AÇIKTIR. GERÇEK İŞLEM HENÜZ ETKİN DEĞİLDİR. Kayıt profilinizi ve cüzdanınızı oluşturur; tek başına gerçek işlemleri açmaz.',sections:[
      ['01 / DEMO MODU','Yeni token akışını inceleyin, strateji ayarlarını değiştirin ve Auto Sniper’ı başlatın veya duraklatın. Tüm alım ve satımlar sanal SOL ile simüle edilir. Hiçbir blokzincir işlemi imzalanmaz veya gönderilmez. Demo kâr/zararı gerçek para değildir.'],
      ['02 / HESABINI KAYDET','ZombieCash sitesinde JOIN THE SURVIVORS / REGISTER WITH TELEGRAM seçeneğine tıklayın. Telegram üzerinden girişi onaylayıp siteye dönün. Doğrulanmış Telegram profiliniz ayarlarınızı ve işlem geçmişinizi diğer kullanıcılardan ayrı tutar. Kayıtlı kullanıcılar demo geçmişini cihazlar arasında eşitleyebilir.'],
      ['03 / SANA ÖZEL SOLANA CÜZDANI','Kayıt tamamlandıktan sonra ZombieCash hesabınız için otomatik olarak benzersiz, yönetilen bir Solana cüzdanı oluşturur. Sonraki girişlerde aynı cüzdan kullanılır. Genel adresinizi Settings bölümünde görebilirsiniz. İmzalama özel anahtarı sunucu tarafında korumalı ve şifreli depoda tutulur; sayfada gösterilmez. Bu, proje tarafından yönetilen bir cüzdandır; tarayıcı eklentisi cüzdanı değildir.'],
      ['04 / FONLAMA VE GERÇEK İŞLEM','Live Trading şu anda tüm hesaplar için kilitlidir. Cüzdanın oluşturulması, para yatırmaya veya gerçek emir vermeye hazır olduğu anlamına gelmez. Şimdilik bu adrese SOL veya token göndermeyin. Gerçek işlem resmen açılırsa site fonlama adımlarını ve onay kontrollerini gösterecektir. Yalnızca kayıt olmak Live modunu açmaz.'],
      ['05 / GÜVENLİK','Telegram giriş kodunuzu, kurtarma ifadenizi veya özel anahtarınızı kimseyle paylaşmayın. Yalnızca zombcash.github.io ve bu siteden başlatılan Telegram girişini kullanın. Her emri ve token adresini kontrol edin. Yeni token işlemleri çok risklidir; gerçek işlem açıldığında yatırdığınız tutarın tamamını kaybedebilirsiniz.']
    ]},
    hi:{title:'सहायता और सुरक्षा',notice:'अभी केवल डेमो मोड उपलब्ध है। वास्तविक ट्रेडिंग अभी सक्षम नहीं है। पंजीकरण से व्यक्तिगत प्रोफ़ाइल और वॉलेट बनता है, लेकिन केवल पंजीकरण से वास्तविक ट्रेड शुरू नहीं होते।',sections:[
      ['01 / डेमो मोड','लॉन्च फ़ीड देखें, रणनीति सेटिंग बदलें और Auto Sniper शुरू या रोकें। सभी खरीद-बिक्री वर्चुअल SOL से सिम्युलेट होती हैं। कोई ब्लॉकचेन लेनदेन साइन या भेजा नहीं जाता। डेमो लाभ/हानि असली पैसा नहीं है।'],
      ['02 / अपना खाता पंजीकृत करें','ZombieCash वेबसाइट पर JOIN THE SURVIVORS / REGISTER WITH TELEGRAM चुनें। Telegram में लॉगिन की पुष्टि करें और साइट पर लौटें। सत्यापित Telegram प्रोफ़ाइल आपकी सेटिंग और ट्रेड इतिहास को अलग रखती है। पंजीकृत उपयोगकर्ता डेमो इतिहास को अलग-अलग डिवाइस पर सिंक कर सकते हैं।'],
      ['03 / आपका अलग Solana वॉलेट','पंजीकरण सफल होने के बाद ZombieCash आपके खाते के लिए अपने आप एक अलग managed Solana wallet बनाता है। अगली बार लॉगिन करने पर वही वॉलेट उपयोग होगा। सार्वजनिक पता Settings में दिखेगा। साइनिंग की निजी कुंजी सर्वर के सुरक्षित एन्क्रिप्टेड स्टोरेज में रखी जाती है और पेज पर कभी नहीं दिखाई जाती। यह प्रोजेक्ट द्वारा प्रबंधित वॉलेट है, ब्राउज़र एक्सटेंशन वॉलेट नहीं।'],
      ['04 / फंडिंग और वास्तविक ट्रेडिंग','Live Trading अभी सभी खातों के लिए लॉक है। वॉलेट बन जाने का अर्थ यह नहीं कि उसमें जमा किया जा सकता है या वास्तविक ऑर्डर दिए जा सकते हैं। अभी इस पते पर SOL या टोकन न भेजें। यदि वास्तविक ट्रेडिंग आधिकारिक रूप से शुरू होती है, तो साइट फंडिंग और पुष्टि के चरण दिखाएगी। केवल पंजीकरण से Live मोड चालू नहीं होता।'],
      ['05 / सुरक्षा','अपना Telegram लॉगिन कोड, रिकवरी फ़्रेज़ या निजी कुंजी किसी को न दें। केवल zombcash.github.io और वहीं से शुरू किए गए Telegram लॉगिन का उपयोग करें। हर ऑर्डर सेटिंग और टोकन पता जाँचें। नए टोकन का ट्रेड बहुत जोखिम भरा है; वास्तविक ट्रेडिंग शुरू होने पर पूरी राशि खो सकती है।']
    ]}
  };

  function saveTerminal(){try{terminal.settings={};['sniper-size','sniper-target','sniper-stop','sniper-network','sniper-priority','sniper-dex','sniper-slip','sniper-idle-timeout','sniper-min-move','sniper-max-open','sniper-min-buys','sniper-max-daily-loss'].forEach(id=>{const el=$(id);if(el)terminal.settings[id]=el.value;});localStorage.setItem(TERMINAL_KEY,JSON.stringify(terminal));}catch(_){}}
  function loadTerminal(){try{const v=JSON.parse(localStorage.getItem(TERMINAL_KEY)||'null');if(v&&typeof v==='object'){Object.assign(terminal,v);if(v.settings)Object.keys(v.settings).forEach(id=>{const el=$(id);if(el)el.value=v.settings[id];});}}catch(_){}}
  function localizeLegacyLog(detail) {
    const value=String(detail||'');
    let match;
    if((match=value.match(/^Auto demo entry · (.+) SOL$/)))return eventText('autoEntry',{amount:match[1]});
    if((match=value.match(/^Manual demo entry · (.+) SOL$/)))return eventText('manualEntry',{amount:match[1]});
    if((match=value.match(/^Manual demo close · (.+)%$/)))return eventText('manualClose',{pct:match[1]});
    if((match=value.match(/^Net target reached · (.+)%$/)))return eventText('netTarget',{pct:match[1]});
    if((match=value.match(/^Net stop-loss reached · (.+)%$/)))return eventText('netStop',{pct:match[1]});
    if((match=value.match(/^No price movement ≥ (.+)% for (.+)s; moving to next launch$/)))return eventText('rotate',{threshold:match[1],seconds:match[2]});
    if(value==='Paper engine paused; open paper position remains managed.')return eventText('paused');
    if((match=value.match(/^(.+) profile applied$/)))return eventText('presetApplied',{preset:match[1]});
    return value;
  }
  function logEvent(kind,symbol,detail='',detailKey='',detailArgs={}){terminal.logs.unshift({at:Date.now(),kind,symbol:symbol||'SYSTEM',detail:detail||'',detailKey:detailKey||'',detailArgs:detailArgs||{}});terminal.logs=terminal.logs.slice(0,18);saveTerminal();renderLog();}
  function dashNode(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
  function addRange(field,id,min,max,step){
    const input=$(id);if(!input||!field)return;
    const range=dashNode('input','zs-range');range.type='range';range.min=min;range.max=max;range.step=step;range.value=input.value;
    input.classList.add('zs-number');input.addEventListener('input',()=>{range.value=input.value;saveTerminal();renderStats();});
    range.addEventListener('input',()=>{input.value=range.value;input.dispatchEvent(new Event('change',{bubbles:true}));renderStats();});
    field.append(range,input);
  }
  function addVirtualField(host,id,label,min,max,step,value,range=true){
    const field=dashNode('div','zs-field');const fieldLabel=dashNode('label','',label);if(id==='sniper-capital')fieldLabel.id='zs-capital-label';if(id==='sniper-liquidity')fieldLabel.id='zs-liquidity-label';const labelIds={'sniper-idle-timeout':'zs-idle-timeout-label','sniper-min-move':'zs-min-move-label','sniper-min-buys':'zs-min-buys-label','sniper-max-daily-loss':'zs-max-daily-loss-label','sniper-max-open':'zs-max-open-label'};if(labelIds[id])fieldLabel.id=labelIds[id];field.append(fieldLabel);
    const input=dashNode('input','zs-number');input.id=id;input.type='number';input.min=min;input.max=max;input.step=step;input.value=value;
    field.querySelector('label').htmlFor=id;
    if(range){const slider=dashNode('input','zs-range');slider.type='range';slider.min=min;slider.max=max;slider.step=step;slider.value=value;slider.addEventListener('input',()=>{input.value=slider.value;input.dispatchEvent(new Event('change',{bubbles:true}));});input.addEventListener('input',()=>slider.value=input.value);field.append(slider);}
    input.addEventListener('change',()=>{if(id==='sniper-capital'){terminal.capital=Math.max(0,Number(input.value)||0);terminal.maxTradeSize=terminal.capital;const size=$('sniper-size');if(size){size.max=Math.max(0.001,terminal.capital);const slider=size.parentElement&&size.parentElement.querySelector('.zs-range');if(slider)slider.max=size.max;}}if(id==='sniper-liquidity')terminal.minLiquidity=Math.max(0,Number(input.value)||0);if(id==='sniper-idle-timeout')terminal.idleTimeout=Math.max(15,Number(input.value)||60);if(id==='sniper-min-move')terminal.minMovePct=Math.max(0,Number(input.value)||0.2);if(id==='sniper-min-buys')terminal.minBuyCount=Math.max(1,Math.min(100,Math.round(Number(input.value)||3)));if(id==='sniper-max-daily-loss')terminal.maxDailyLossSol=Math.max(0,Math.min(1000,Number(input.value)||0));if(id==='sniper-max-size'){terminal.maxTradeSize=Math.max(0.001,Math.min(10,Number(input.value)||0.05));const size=$('sniper-size');if(size){size.max=terminal.maxTradeSize;const slider=size.parentElement&&size.parentElement.querySelector('.zs-range');if(slider)slider.max=terminal.maxTradeSize;if(Number(size.value)>terminal.maxTradeSize){size.value=terminal.maxTradeSize;if(slider)slider.value=size.value;}}}saveTerminal();renderStats();});
    field.append(input);host.append(field);return field;
  }
  function sparkline(values,ariaLabel='Observed token price since simulated entry'){
    // Keep the recorded observations untouched; smooth only the SVG presentation.
    const nums=(values||[]).filter(v=>Number.isFinite(Number(v))&&Number(v)>0).map(Number);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 180 48');svg.setAttribute('class','zs-spark');svg.setAttribute('role','img');svg.setAttribute('aria-label',ariaLabel);
    if(nums.length<2)return svg;
    const lo=Math.min(...nums),hi=Math.max(...nums),span=hi-lo||Math.max(Math.abs(hi)*.001,1e-12);
    const pts=nums.map((v,i)=>({x:2+(i/(nums.length-1))*176,y:44-((v-lo)/span)*38}));
    // Catmull-Rom -> cubic Bezier. Control handles are limited to each segment
    // to avoid visual overshoot while preserving every real observation point.
    let d='M '+pts[0].x.toFixed(2)+' '+pts[0].y.toFixed(2);
    const tension=0.16;
    for(let i=0;i<pts.length-1;i++){
      const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];
      const dx1=(p2.x-p0.x)*tension,dy1=(p2.y-p0.y)*tension;
      const dx2=(p3.x-p1.x)*tension,dy2=(p3.y-p1.y)*tension;
      const c1={x:p1.x+dx1,y:Math.max(Math.min(p1.y+dy1,Math.max(p1.y,p2.y)),Math.min(p1.y,p2.y))};
      const c2={x:p2.x-dx2,y:Math.max(Math.min(p2.y-dy2,Math.max(p1.y,p2.y)),Math.min(p1.y,p2.y))};
      d+=' C '+c1.x.toFixed(2)+' '+c1.y.toFixed(2)+' '+c2.x.toFixed(2)+' '+c2.y.toFixed(2)+' '+p2.x.toFixed(2)+' '+p2.y.toFixed(2);
    }
    const line=document.createElementNS(svg.namespaceURI,'path');line.setAttribute('d',d);line.setAttribute('fill','none');line.setAttribute('stroke',nums[nums.length-1]>=nums[0]?'#00f59a':'#ff4d8d');line.setAttribute('stroke-width','2.2');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');line.setAttribute('vector-effect','non-scaling-stroke');svg.append(line);return svg;
  }
  function equityChart(points,lang='en'){
    const data=(points||[]).filter(p=>Number.isFinite(Number(p.at))&&Number.isFinite(Number(p.value))).slice(-180);
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 340 154');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('class','zs-equity-svg');svg.setAttribute('role','img');
    svg.setAttribute('aria-label',lang==='ru'?'График капитала: сумма SOL по вертикали, время сессии по горизонтали':'Equity chart: SOL on vertical axis, session time on horizontal axis');
    const add=(tag,attrs,textValue)=>{const el=document.createElementNS(ns,tag);Object.entries(attrs||{}).forEach(([k,v])=>el.setAttribute(k,String(v)));if(textValue!==undefined)el.textContent=textValue;svg.append(el);return el;};
    const x0=48,x1=332,y0=12,y1=116,w=x1-x0,h=y1-y0;
    if(!data.length){add('text',{x:170,y:72,'text-anchor':'middle',fill:'#9eae9d','font-size':10},lang==='ru'?'Ожидание данных сессии':'Waiting for session data');return svg;}
    let vals=data.map(p=>Number(p.value)),lo=Math.min(...vals),hi=Math.max(...vals);
    const pad=(hi-lo)*.12||Math.max(Math.abs(hi)*.002,0.00001);lo=Math.max(0,lo-pad);hi+=pad;
    const span=hi-lo||1,first=Number(data[0].at),last=Number(data[data.length-1].at),duration=Math.max(1,last-first);
    const x=p=>x0+((Number(p.at)-first)/duration)*w,y=v=>y1-((Number(v)-lo)/span)*h;
    for(let i=0;i<4;i++){
      const v=hi-(hi-lo)*i/3,yy=y(v);
      add('line',{x1:x0,y1:yy,x2:x1,y2:yy,stroke:'#809080',opacity:.23,'stroke-width':.7});
      add('text',{x:x0-6,y:yy+3,'text-anchor':'end',fill:'#aebbad','font-size':9},v.toFixed(3));
    }
    const labels=[data[0],data[Math.floor((data.length-1)/2)],data[data.length-1]];
    labels.forEach((p,i)=>{const xx=x(p),label=new Date(Number(p.at)).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});add('line',{x1:xx,y1:y1,x2:xx,y2:y1+3,stroke:'#9eae9d',opacity:.6});add('text',{x:xx,y:132,'text-anchor':i===0?'start':i===2?'end':'middle',fill:'#aebbad','font-size':9},label);});
    add('line',{x1:x0,y1:y0,x2:x0,y2:y1,stroke:'#aebbad',opacity:.55});
    add('line',{x1:x0,y1:y1,x2:x1,y2:y1,stroke:'#aebbad',opacity:.55});
    if(data.length===1){add('circle',{cx:x(data[0]),cy:y(data[0].value),r:3.5,fill:'#00e99a'});}
    else{
      const d=data.map((p,i)=>(i?'L':'M')+' '+x(p).toFixed(2)+' '+y(p.value).toFixed(2)).join(' ');
      add('path',{d,fill:'none',stroke:Number(data[data.length-1].value)>=Number(data[0].value)?'#00e99a':'#ff4d8d','stroke-width':2.2,'stroke-linecap':'round','stroke-linejoin':'round'});
      add('circle',{cx:x(data[data.length-1]),cy:y(data[data.length-1].value),r:2.8,fill:Number(data[data.length-1].value)>=Number(data[0].value)?'#00e99a':'#ff4d8d'});
    }
    add('text',{x:7,y:9,fill:'#91a18f','font-size':8},'SOL');
    return svg;
  }
  function recordEquitySnapshot(){
    const open=state.positions.filter(p=>p.status==='open');
    const sessionStart=Number(terminal.startedAt)||0;
    const closed=state.positions.filter(p=>p.status==='closed'&&(!sessionStart||Number(p.closedAt||p.openedAt||0)>=sessionStart));
    const realized=closed.reduce((a,p)=>a+(Number(p.netPnl)||0),0);
    const unrealized=open.reduce((a,p)=>a+(Number(p.netPnl)||0),0);
    const baseline=Math.max(0.000001,Number(terminal.sessionStartCapital)||Number(terminal.capital)||10);
    const equity=baseline+realized+unrealized;
    terminal.equityHistory=Array.isArray(terminal.equityHistory)?terminal.equityHistory:[];
    const now=Date.now(),last=terminal.equityHistory[terminal.equityHistory.length-1];
    if(!last||now-Number(last.at)>=5000){terminal.equityHistory.push({at:now,value:equity});terminal.equityHistory=terminal.equityHistory.slice(-180);saveTerminal();}
    return {baseline,equity,realized,unrealized,open};
  }
  function renderStats(){
    const host=$('zs-kpis');if(!host)return;
    const sessionStart=Number(terminal.startedAt)||0;
    const closed=state.positions.filter(p=>p.status==='closed'&&(!sessionStart||Number(p.closedAt||p.openedAt||0)>=sessionStart)),wins=closed.filter(p=>(Number(p.netPnl)||0)>0).length;
    const losses=closed.filter(p=>(Number(p.netPnl)||0)<0).length;
    const session=recordEquitySnapshot(),open=session.open;
    const used=open.reduce((a,p)=>a+(Number(p.buySol)||0),0);
    const available=Math.max(0,session.baseline+session.realized-used);
    const sessionTrades=state.positions.filter(p=>p.status==='open'||!sessionStart||Number(p.openedAt||0)>=sessionStart||Number(p.closedAt||0)>=sessionStart);
    const turnover=sessionTrades.reduce((a,p)=>a+(Number(p.buySol)||0)+(Number(p.sellSol)||((p.status==='closed')?(Number(p.quantity)||0)*(Number(p.lastPrice)||Number(p.entryPrice)||0):0)),0);
    const decided=wins+losses;
    const winRate=decided?Math.round(wins/decided*100)+'%':'—';
    const vals=[[dcopy().balance,available.toFixed(4)+' SOL'],[dcopy().profit,((session.realized+session.unrealized)>=0?'+':'')+(session.realized+session.unrealized).toFixed(5)+' SOL'],[uiText('closedTrades'),String(closed.length)],[uiText('winsLosses'),wins+' / '+losses],[dcopy().wins,winRate],[uiText('sessionTurnover'),turnover.toFixed(5)+' SOL'],[dcopy().active,String(open.length)]];
    host.replaceChildren();vals.forEach((v,i)=>{const card=dashNode('div','zs-kpi zs-kpi-'+i);card.append(dashNode('small','',v[0]),dashNode('strong','zs-counter',v[1]));host.append(card);});
    const mainChart=$('zs-main-chart');if(mainChart){mainChart.replaceChildren();const history=(terminal.equityHistory||[]).filter(x=>Number.isFinite(Number(x.at))&&Number.isFinite(Number(x.value)));if(!history.length)history.push({at:Date.now(),value:session.equity});mainChart.append(equityChart(history,state.lang));}
    const equityCaption=$('zs-equity-caption');if(equityCaption){const change=session.equity-session.baseline,pct=change/session.baseline*100;equityCaption.textContent=(uiText('start'))+session.baseline.toFixed(4)+' SOL · '+(uiText('now'))+session.equity.toFixed(4)+' SOL · '+(change>=0?'+':'')+change.toFixed(5)+' SOL ('+(pct>=0?'+':'')+pct.toFixed(2)+'%)';}
    const centerSummary=$('zs-center-summary');if(centerSummary){
      centerSummary.replaceChildren();
      const left=dashNode('div','zs-center-token');
      left.append(dashNode('small','',uiText('totalExposure')),dashNode('strong','',used.toFixed(5)+' SOL'),dashNode('span','',(uiText('openPositions'))+open.length));
      const pct=used>0?session.unrealized/used*100:0;
      const right=dashNode('div','zs-center-pnl '+(session.unrealized>=0?'is-positive':'is-negative'));
      right.append(dashNode('small','',uiText('liveUnrealized')),dashNode('strong','',(session.unrealized>=0?'+':'')+session.unrealized.toFixed(6)+' SOL'),dashNode('span','',(pct>=0?'+':'')+pct.toFixed(2)+'%'));
      centerSummary.append(left,right);
    }
    const statGrid=$('zs-stat-grid');if(statGrid){
      const avg=closed.length?closed.reduce((a,p)=>a+(Number(p.netPct)||0),0)/closed.length:0;
      const best=closed.length?Math.max(...closed.map(p=>Number(p.netPct)||0)):0;
      const worst=closed.length?Math.min(...closed.map(p=>Number(p.netPct)||0)):0;
      const items=[[uiText('realized'),(session.realized>=0?'+':'')+session.realized.toFixed(5)+' SOL'],[uiText('average'),(avg>=0?'+':'')+avg.toFixed(2)+'%'],[uiText('best'),(best>=0?'+':'')+best.toFixed(2)+'%'],[uiText('worst'),worst.toFixed(2)+'%']];
      statGrid.replaceChildren();items.forEach((v,i)=>{const card=dashNode('div','zs-stat-card');card.append(dashNode('small','',v[0]),dashNode('strong',i===3&&worst<0?'zs-negative':'',v[1]));statGrid.append(card);});
    }
  }
  function renderLog(){
    const host=$('zs-log');if(!host)return;host.replaceChildren();
    if(!terminal.logs.length){host.append(dashNode('p','sniper-muted',dcopy().empty));return;}
    terminal.logs.slice(0,12).forEach(e=>{const row=dashNode('div','zs-logrow');row.append(dashNode('time','',new Date(e.at).toLocaleTimeString()),dashNode('b','zs-logkind',e.kind),dashNode('strong','',e.symbol),dashNode('span','',e.detailKey?eventText(e.detailKey,e.detailArgs):localizeLegacyLog(e.detail)));host.append(row);});
  }
  function renderDashboardState(){
    const feedReady=!!(state.feed&&state.feed.pumpdevConnected);const btn=$('zs-auto-toggle');if(btn){btn.classList.toggle('is-on',!!terminal.auto&&feedReady);btn.textContent=terminal.auto&&!feedReady?uiText('waitingPumpDev'):(terminal.auto&&feedReady?dcopy().armed:dcopy().paused);if(terminal.auto&&!feedReady)btn.title=uiText('waitingPumpDevLong');else btn.removeAttribute('title');}
    const nav=document.querySelectorAll('[data-zs-nav]');nav.forEach(b=>{const i=Number(b.dataset.zsNav);if(dcopy().nav[i])b.textContent=dcopy().nav[i];else if(i===5)b.textContent=walletText('nav');});
    const root=$('zombie-sniper-demo');
    const activeTab=root&&root.dataset.activeTab;
    const rightTitle=$('zs-right-title');if(rightTitle)rightTitle.textContent=activeTab==='history'?uiText('history'):dcopy().active;
    const sourceSelect=$('zs-source-select');if(sourceSelect){const labels={all:'allSources',pumpportal:'pumpLaunches',boosts:'boostMonitor',community:'community'};Array.from(sourceSelect.options).forEach(o=>{if(labels[o.value])o.textContent=uiText(labels[o.value]);});}
    const creatorSelect=$('zs-creator-select');if(creatorSelect){const labels={any:'anyDev',first:'firstSeen',repeat:'repeatDev'};Array.from(creatorSelect.options).forEach(o=>{if(labels[o.value])o.textContent=uiText(labels[o.value]);});}
    const socialsText=document.querySelector('.zs-filter-label span');if(socialsText)socialsText.textContent=uiText('socialsOnly');
    const nameFilter=$('zs-name-filter');if(nameFilter)nameFilter.placeholder=uiText('filterTicker');
    const presetTitle=$('zs-presets-title');if(presetTitle)presetTitle.textContent=uiText('recommended');
    const presetNote=$('zs-preset-note');if(presetNote)presetNote.textContent=uiText('presetNote');
    const presetLabels={conservative:'conservative',balanced:'balanced',aggressive:'aggressive'};
    document.querySelectorAll('.zs-preset-btn[data-preset]').forEach(b=>{const key=presetLabels[b.dataset.preset];if(key)b.textContent=uiText(key);});
    [['zs-idle-timeout-label','idleTimeout'],['zs-min-move-label','minMove'],['zs-min-buys-label','minBuys'],['zs-max-daily-loss-label','maxDailyLoss'],['zs-max-open-label','maxOpen'],['zs-stats-heading','statsHeading'],['zs-chart-title','equityCurve'],['zs-chart-range-label','sinceStart']].forEach(([id,key])=>{const el=$(id);if(el)el.textContent=uiText(key);});
    [['zs-settings-title',dcopy().settings],['zs-center-title',dcopy().autopilot],['zs-right-title',activeTab==='history'?uiText('history'):dcopy().active],['zs-launch-title',dcopy().launches],['zs-log-title',dcopy().journal],['zs-chart-title',uiText('equityCurve')]].forEach(([id,label])=>{const el=$(id);if(el)el.textContent=label;});
    const capLabel=$('zs-capital-label'),liqLabel=$('zs-liquidity-label');if(capLabel)capLabel.textContent=dcopy().capital;if(liqLabel)liqLabel.textContent=dcopy().minliq;
    renderStats();renderLog();
  }
  function maybeAutoEnter(){
    // Registered users are entered by the persistent server paper engine. Do not
    // create a duplicate browser-side position for the same Mint.
    if(authToken())return;
    if(!terminal.auto)return; // Paper demo may hold multiple positions; virtual capital remains the only sizing limit.
    const now=Date.now();
    const item=state.candidates.find(c=>{
      if(!['pumpdev','pumpportal'].includes(c.source)||(state.source!=='all'&&!['pumpdev','pumpportal'].includes(state.source))||!state.feed.pumpdevConnected||!(c.priceNative>0)||terminal.seen.includes(c.address))return false;
      if(state.requireSocials&&c.hasSocials!==true)return false;
      const q=String(state.nameQuery||'').trim().toLowerCase();
      if(q&&!(String(c.name||'')+' '+String(c.symbol||'')).toLowerCase().includes(q))return false;
      if(state.creatorFilter==='repeat'&&c.creatorHistoryStatus!=='repeat')return false;
      if(state.creatorFilter==='first'&&c.creatorHistoryStatus!=='first_seen')return false;
      const age=now-Number(c.eventAt||0),m=c.firstMinute||{};
      const buys=Number(m.buyCount||0),uniqueBuyers=Number(m.uniqueBuyers||0);
      const net=Number(m.netSol||0),move=Number(m.priceChangePct||0);
      const minBuys=Math.max(1,Number(terminal.minBuyCount)||3);
      const minMove=Math.max(0,Number(terminal.minMovePct)||0.2);
      // Apply the same observable entry gates as the registered server Paper Engine.
      return age>=0&&age<=Math.max(5,Number(terminal.buyWindowSeconds||60))*1000
        &&buys>=minBuys&&uniqueBuyers>=1&&net>0&&move>=minMove;
    });
    if(!item)return;
    terminal.seen.push(item.address);terminal.seen=terminal.seen.slice(-250);terminal.lastAuto=Date.now();saveTerminal();
    openPaper(item,true);
  }

  async function showLaunchConfirm(){
    await refreshFeed(true);
    const n=id=>Number($(id)&&$(id).value);
    const errors=[];
    if(!(n('sniper-size')>0))errors.push('Размер сделки должен быть больше нуля.');
    
    if(n('sniper-size')>n('sniper-capital'))errors.push('Размер сделки выше виртуального капитала.');
    if(!(n('sniper-capital')>0))errors.push('Капитал должен быть больше нуля.');
    if(!(n('sniper-target')>0))errors.push('Цель прибыли должна быть больше нуля.');
    if(errors.length){window.alert('Нельзя запустить:\n'+errors.join('\n'));return;}
    const c=START_CONFIRM_COPY[state.lang]||START_CONFIRM_COPY.en;
    const rows=[{text:c[1]+': '+n('sniper-capital')+' SOL'},{text:c[2]+': '+n('sniper-size')+' SOL'},{text:c[3]+': +'+n('sniper-target')+'%'},{text:c[4]+': -'+n('sniper-stop')+'%'},{text:c[5]+': '+n('sniper-dex')+'%'},{text:c[6]+': '+n('sniper-slip')+'%'},{text:c[7]+': '+n('sniper-network')+' / '+n('sniper-priority')+' SOL'}];
    if(!state.feed.pumpdevConnected)rows.push({text:uiText('waitingPumpDevLong'),warn:true});
    if(n('sniper-slip')>5)rows.push({text:'⚠ '+c[8],warn:true});
    if(n('sniper-dex')>2)rows.push({text:'⚠ '+c[9],warn:true});
    if(n('sniper-size')>0.05)rows.push({text:'⚠ '+c[10],warn:true});
    rows.push({text:c[11]});
    if(!await showCenteredConfirm(rows))return;
    if(!await setServerPaperEnabled(true))return;
    terminal.auto=true;terminal.startedAt=Date.now();terminal.sessionStartCapital=Number($('sniper-capital').value)||10;terminal.equityHistory=[{at:terminal.startedAt,value:terminal.sessionStartCapital}];saveTerminal();renderDashboardState();
    logEvent('ARMED','SYSTEM','','armed',{amount:n('sniper-size')});
    refreshFeed();maybeAutoEnter();
  }

  function buildDashboard(){
    const root=$('zombie-sniper-demo');if(!root||root.dataset.zsBuilt)return;
    root.dataset.zsBuilt='1';
    /* Keep a stable slot in the article while allowing the dashboard to escape
       transformed/narrow page wrappers when it is displayed as a viewport app. */
    const rootHome=root.parentNode;
    const rootAnchor=document.createComment('zombie-sniper-home');
    if(rootHome)rootHome.insertBefore(rootAnchor,root);
    function mountDashboardOverlay(){if(root.parentNode!==document.body)document.body.appendChild(root);}
    // Keep the placeholder permanently in the original page flow. Reusing it
    // makes repeated enter/exit cycles restore the exact same DOM position.
    function restoreDashboardToPage(){
      if(rootAnchor.parentNode){rootAnchor.parentNode.insertBefore(root,rootAnchor);return;}
      if(rootHome&&rootHome.isConnected){rootHome.appendChild(rootAnchor);rootHome.insertBefore(root,rootAnchor);}
    }
    loadTerminal();
    const fields=['sniper-size','sniper-target','sniper-stop','sniper-network','sniper-priority','sniper-dex','sniper-slip'].map(id=>$(id)?.closest('.sniper-field')).filter(Boolean);
    const candidates=$('sniper-candidates'),positions=$('sniper-positions'),refresh=$('sniper-refresh'),clear=$('sniper-clear'),status=$('sniper-feed-status');
    const style=dashNode('style','');style.textContent=`.sniper-demo{position:relative;overflow:hidden;border:1px solid #68736d!important;border-radius:8px!important;padding:clamp(12px,1.5vw,20px)!important;background:linear-gradient(145deg,#171c1b,#0b1010 58%,#151a18)!important;box-shadow:0 12px 40px #0008,inset 0 0 0 1px #ffffff08!important;color:#e5e9e4;font-family:Inter,system-ui,sans-serif}
    .zs-head{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:38px;padding:0 0 8px;border-bottom:1px solid #65706855}.zs-brand{font:900 clamp(17px,2vw,25px)/1 system-ui;color:#c3d0c2;letter-spacing:.08em}.zs-title{font:800 clamp(19px,2.5vw,30px)/1 system-ui;color:#e8ece8;letter-spacing:.07em}.zs-demo{border:1px solid #78857b;border-radius:3px;padding:6px 10px;color:#d0d8d0;font:700 10px system-ui;letter-spacing:.08em;background:#202724}
    .zs-head-actions{display:flex;align-items:center;gap:8px}.zs-expand{border:1px solid #718078;border-radius:3px;background:#29312d;color:#eef1ec;padding:8px 12px;font:700 11px system-ui;cursor:pointer}.zs-expand:hover{background:#39443d}
    .zs-nav{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-start;margin:6px 0}.zs-nav button{border:1px solid #515e56;background:#202724;color:#dce2dc;border-radius:3px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer}.zs-nav button.is-active,.zs-nav button[aria-selected=true]{border-color:#b7c8b0;background:#465246;color:#fff;box-shadow:inset 0 -2px #b7c8b0}.zs-tab-hidden{display:none!important}.zs-stats-layout,.zs-single-layout{grid-template-columns:minmax(0,1fr)!important}.zs-stats-layout .zs-center{max-width:none}.zs-stats-layout .zs-core{width:110px;min-height:110px}
    .zs-kpis{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px;margin:3px 0 8px}.zs-kpi{min-width:0;padding:8px 11px;border:1px solid #4d5a52;border-radius:4px;background:linear-gradient(135deg,#202724,#141a18)}.zs-kpi small{display:block;color:#aeb8af;font-size:10px;letter-spacing:.04em}.zs-kpi strong{display:block;margin-top:3px;font:800 clamp(15px,1.6vw,21px) system-ui;color:#e7ece6;font-variant-numeric:tabular-nums;transition:color .25s}.zs-kpi-1 strong,.zs-kpi-3 strong{color:#b8d0ad}
    .zs-layout{display:grid;grid-template-columns:minmax(270px,1.02fr) minmax(210px,.78fr) minmax(340px,1.28fr);gap:9px;align-items:stretch;min-height:0;height:100%}.zs-panel{min-width:0;min-height:0;padding:10px 12px;border:1px solid #526057;border-radius:5px;background:linear-gradient(145deg,#1a211e,#101614);box-shadow:inset 0 1px #ffffff08}.zs-panel h3{margin:0 0 7px;color:#c6d0c6;font:800 11px system-ui;letter-spacing:.09em}
    .zs-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3px 10px}.zs-limit-value{justify-self:end;color:#dce8d5;font-size:12px;font-weight:800;margin-top:-2px}.zs-field:has(#sniper-max-open){border-top:1px solid #ffffff18;padding-top:7px;margin-top:3px}
    .zs-field{display:grid;grid-template-columns:minmax(0,1fr) 76px;gap:3px 7px;align-items:center;padding:4px 0;border-bottom:1px solid #ffffff10;min-width:0}.zs-field label{grid-column:1/-1;color:#c1cac2;font-size:10px;font-weight:650;line-height:1.2}.zs-field .zs-range{grid-column:1;width:100%;accent-color:#9eae9c;min-width:0}.zs-field .zs-number{grid-column:2;width:76px;min-height:27px;padding:4px 6px;border:1px solid #4b5850;border-radius:3px;background:#0d1311;color:#f0f2ee;text-align:right;font:650 11px system-ui}.zs-range{appearance:auto;height:6px}
    .zs-portrait{position:relative;height:92px;border-radius:4px;overflow:hidden;background:#202724;display:flex;align-items:flex-end;justify-content:flex-start;margin-bottom:7px}.zs-portrait img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 25%;filter:grayscale(.72) contrast(1.08) brightness(.7);opacity:.88}.zs-portrait:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#0b100ee8,transparent 70%),linear-gradient(0deg,#0b100eaa,transparent 65%)}.zs-portrait b{z-index:1;margin:0 0 8px 12px;color:#e3e8e1;font:800 11px system-ui;letter-spacing:.12em}
    .zs-core{display:grid;place-items:center;min-height:112px;text-align:center;border:1px solid #758278;border-radius:50%;width:min(100%,142px);aspect-ratio:1;margin:0 auto 7px;background:radial-gradient(circle,#28332d,#101613 68%);box-shadow:inset 0 0 20px #aab9a311}.zs-core strong{display:block;color:#e9eee8;font:800 13px system-ui;letter-spacing:.06em}.zs-core span{display:block;color:#b8d0ad;font-size:11px;font-weight:800}
    .zs-toggle{border:1px solid #82917f;border-radius:3px;background:#29332c;color:#e8eee6;padding:7px 10px;font-weight:800;font-size:11px;cursor:pointer;width:100%;margin:3px 0}.zs-toggle.is-on{background:#71856e;color:#0d140f}.zs-actions{display:flex;gap:6px}.zs-actions button{flex:1;min-height:30px;padding:5px 8px;font-size:10px}
    .zs-chart{width:100%;height:126px;min-height:126px;margin-top:5px;border-radius:3px;background:linear-gradient(180deg,#a9b99c12,transparent);border:1px solid #69786b33}
    .zs-right{display:grid;grid-template-rows:auto minmax(0,1.45fr) minmax(150px,.75fr);gap:6px;min-height:0}.zs-right>h3{margin:0!important;padding:0 0 4px;border-bottom:1px solid #ffffff18}.zs-launch-panel{min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:5px}.zs-launch-panel>h3{margin:0!important;padding:0 0 4px;border-bottom:1px solid #ffffff18}.zs-launch-panel .zs-launches{flex:1 1 auto}.zs-positions,.zs-launches{max-height:none;min-height:0;overflow:auto;scrollbar-width:thin;scrollbar-color:#59665c #121816}.zs-launches .sniper-candidate{grid-template-columns:minmax(0,1fr) auto;gap:5px 8px;padding:9px 0;align-items:start}.zs-launches .sniper-candidate-main{min-width:0;display:grid;grid-template-columns:minmax(0,1fr);gap:4px}.zs-launches .sniper-token-name{display:block;min-width:0;white-space:normal;overflow-wrap:anywhere;line-height:1.35}.zs-launches .sniper-token-address{display:block;min-width:0;white-space:normal;overflow-wrap:anywhere;word-break:break-all;line-height:1.4;color:#aeb8af}.zs-launches .sniper-candidate-stats{display:flex;flex-wrap:wrap;gap:5px 12px;min-width:0}.zs-launches .sniper-candidate-stats{grid-column:1/-1}.zs-launches .sniper-link{display:none}.zs-launches .sniper-action{grid-column:2;grid-row:1}.zs-positions .sniper-position{display:grid;grid-template-columns:1fr auto;gap:5px;padding:8px 0;border-top:1px solid #ffffff16}.zs-position-chart{grid-column:1/-1}.zs-spark{width:100%;height:34px;display:block;background:linear-gradient(180deg,#9db39b0b,transparent);border-radius:3px}
    .zs-log{display:grid;gap:2px;max-height:76px;overflow:auto}.zs-logrow{display:grid;grid-template-columns:65px 68px 82px 1fr;gap:7px;padding:5px 7px;border-top:1px solid #ffffff10;font-size:10px;color:#c9d0c9}.zs-logkind{color:#b8d0ad}.zs-foot{margin:4px 0 0;color:#aeb8af;font-size:10px;line-height:1.35}.zs-hidden{display:none!important}.sniper-demo .sniper-muted{color:#aeb8af!important}.sniper-demo .sniper-action{border-radius:3px!important;background:#a8b79f!important;color:#111812!important;border:1px solid #c2cdbb!important}.sniper-demo .sniper-close{background:transparent!important;border:1px solid #68776c!important;color:#d2dcd2!important}
    .sniper-demo.zs-fullscreen{position:fixed!important;inset:0!important;z-index:2147483600!important;width:100vw!important;height:100vh!important;height:100dvh!important;min-height:100vh!important;min-height:100dvh!important;max-height:100vh!important;max-height:100dvh!important;box-sizing:border-box!important;margin:0!important;border:0!important;border-radius:0!important;padding:10px 14px!important;overflow:hidden!important;display:grid!important;grid-template-rows:auto auto auto minmax(0,1fr) 0 0 0!important;grid-auto-rows:0!important;align-content:stretch!important;gap:4px!important;background:linear-gradient(145deg,#171c1b,#0b1010 58%,#151a18)!important}
    .zs-fullscreen .zs-head{min-height:34px;padding-bottom:5px}.zs-fullscreen .zs-nav{margin:2px 0}.zs-fullscreen .zs-kpis{margin:1px 0 4px}.zs-fullscreen .zs-layout{height:auto!important;min-height:0!important;align-self:stretch}.zs-fullscreen .zs-panel{padding:8px 10px}.zs-fullscreen .zs-portrait{height:76px}.zs-fullscreen .zs-core{min-height:94px;width:min(100%,118px)}.zs-fullscreen .zs-chart{height:62px}.zs-fullscreen .zs-log{max-height:58px}.zs-fullscreen .zs-foot{font-size:9px;margin:0}.zs-fullscreen>.zs-foot{display:none!important}.zs-fullscreen .zs-field{padding:2px 0}.zs-fullscreen .zs-field .zs-number{min-height:24px}.zs-fullscreen .zs-kpi{padding:6px 9px}
    .zs-fullscreen .zs-right{grid-template-rows:auto minmax(0,.85fr) minmax(0,1.15fr)}.zs-fullscreen .zs-positions,.zs-fullscreen .zs-launches{overflow:auto}
    body.zs-lock{overflow:hidden!important}
    @media(max-width:1000px){.zs-layout{grid-template-columns:minmax(240px,1fr) minmax(190px,.8fr) minmax(280px,1.1fr)}.zs-fields{grid-template-columns:1fr}.zs-fullscreen .zs-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:760px){.zs-fullscreen{overflow:auto!important;display:block!important}.zs-fullscreen .zs-layout{height:auto;grid-template-columns:1fr}.zs-fullscreen .zs-right{min-height:340px}.zs-fullscreen .zs-panel{margin-bottom:8px}.zs-fullscreen .zs-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.zs-fullscreen .zs-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.zs-fullscreen .zs-log{max-height:140px}}
    @media(max-height:720px) and (min-width:761px){.zs-fullscreen{padding:6px 10px!important;grid-template-rows:auto auto auto minmax(0,1fr) auto!important}.zs-fullscreen .zs-portrait{height:54px}.zs-fullscreen .zs-core{min-height:80px;width:94px}.zs-fullscreen .zs-chart{height:48px}.zs-fullscreen .zs-kpi{padding:4px 7px}.zs-fullscreen .zs-field label{font-size:9px}}

    .zs-positions .sniper-position{grid-template-columns:minmax(0,1fr)!important;align-items:start!important;gap:6px!important;padding:12px 4px!important}
    .zs-positions .sniper-position-head{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:space-between!important;gap:5px 12px!important;min-width:0!important}
    .zs-positions .sniper-position-head strong{min-width:0!important;overflow-wrap:anywhere!important;font-size:12px!important;line-height:1.4!important}
    .zs-positions .sniper-position-detail{font-size:10px!important;line-height:1.5!important;overflow-wrap:anywhere!important;color:#bfc9bf!important}
    .zs-positions .zs-position-chart{width:100%!important;max-height:42px!important;overflow:hidden!important}
    .zs-positions .zs-position-chart .zs-spark{width:100%!important;height:38px!important}


    /* Full-viewport trading terminal and position contract row */
    .sniper-demo.zs-fullscreen{position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:0!important;inset:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;min-height:100vh!important;min-height:100dvh!important;max-height:100vh!important;max-height:100dvh!important;z-index:2147483600!important;box-sizing:border-box!important;margin:0!important;border:0!important;border-radius:0!important;overflow:hidden!important;grid-template-rows:auto auto auto minmax(0,1fr)!important;align-content:stretch!important}
    .zs-fullscreen .zs-layout{height:auto!important;min-height:0!important;align-self:stretch!important;min-width:0!important}
    .zs-fullscreen .zs-left,.zs-fullscreen .zs-center,.zs-fullscreen .zs-right{height:100%!important;min-height:0!important;min-width:0!important}
    .zs-fullscreen .zs-layout{min-height:0!important;height:100%!important}
    .zs-fullscreen .zs-left,.zs-fullscreen .zs-center,.zs-fullscreen .zs-right{min-height:0!important;overflow:auto!important;overscroll-behavior:contain!important}
    .zs-fullscreen .zs-position-section{min-height:0!important;overflow:auto!important}
    .zs-fullscreen .zs-positions-inner{min-height:0!important;overflow:visible!important}
    .zs-positions .zs-position-contract{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important;width:100%!important;padding:6px 7px!important;border:1px solid #ffffff17!important;border-radius:3px!important;background:#080e0b88!important;box-sizing:border-box!important}
    .zs-positions .zs-position-contract small{flex:0 0 auto!important;color:#9eaa9e!important;font-size:8px!important;letter-spacing:.08em!important}
    .zs-positions .zs-position-address{display:block!important;flex:1 1 auto!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#d5dfd3!important;font:10px ui-monospace,monospace!important}
    .zs-positions .zs-copy-address{flex:0 0 auto!important;min-height:26px!important;padding:4px 8px!important;border:1px solid #697a6b!important;border-radius:3px!important;background:#29352d!important;color:#dce6d9!important;font:700 9px system-ui!important;cursor:pointer!important}
    .zs-positions .zs-copy-address:disabled{opacity:.45!important;cursor:not-allowed!important}
    .zs-fullscreen .zs-head-actions{flex-wrap:nowrap!important}
    .zs-fullscreen .zs-expand{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:32px!important;white-space:nowrap!important;position:relative!important;z-index:2!important}
    @media(max-width:760px){.zs-fullscreen .zs-layout{height:auto!important}.zs-fullscreen .zs-left,.zs-fullscreen .zs-center,.zs-fullscreen .zs-right{overflow:visible!important}.zs-positions .zs-position-contract{flex-wrap:wrap!important}}

    /* Position monitor cards: explicit, non-overlapping information hierarchy */
    .zs-positions-inner{display:flex!important;flex-direction:column!important;gap:5px!important;padding:3px!important;min-width:0!important}
    .zs-positions .zs-position-card{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:5px!important;width:100%!important;min-width:0!important;box-sizing:border-box!important;padding:7px 8px!important;border:1px solid #536357!important;border-radius:5px!important;background:linear-gradient(135deg,#1c2520,#101714)!important;overflow:hidden!important}
    .zs-positions .zs-position-topline{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;width:100%!important;min-width:0!important}
    .zs-positions .zs-position-identity{display:flex!important;flex-direction:row!important;align-items:center!important;flex-wrap:wrap!important;gap:7px!important;min-width:0!important}
    .zs-positions .zs-position-symbol{display:block!important;position:static!important;max-width:100%!important;font-size:13px!important;line-height:1.25!important;letter-spacing:.04em!important;color:#eef2ec!important;overflow-wrap:anywhere!important}
    .zs-positions .zs-position-status{display:inline-flex!important;align-items:center!important;padding:3px 7px!important;border:1px solid #637464!important;border-radius:3px!important;font-size:9px!important;line-height:1.2!important;letter-spacing:.08em!important;color:#c3d0c0!important;white-space:nowrap!important}
    .zs-positions .zs-position-status.is-open{background:#314233!important;color:#d4e2ce!important}.zs-positions .zs-position-status.is-closed{background:#282d2a!important;color:#b8c0b8!important}
    .zs-positions .zs-position-pnl{display:block!important;position:static!important;flex:0 0 auto!important;text-align:right!important;font-size:13px!important;line-height:1.25!important;font-variant-numeric:tabular-nums!important;white-space:nowrap!important}
    .zs-positions .zs-position-pnl.is-positive{color:#b8d0ad!important}.zs-positions .zs-position-pnl.is-negative{color:#d99b9b!important}
    .zs-positions .zs-position-metrics{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px!important;width:100%!important;min-width:0!important}
    .zs-positions .zs-position-metric{display:flex!important;flex-direction:column!important;gap:2px!important;min-width:0!important;padding:4px 5px!important;border:1px solid #ffffff12!important;border-radius:3px!important;background:#080e0b66!important}
    .zs-positions .zs-position-metric small{font-size:7px!important;line-height:1.2!important;letter-spacing:.08em!important;color:#9eaa9e!important}
    .zs-positions .zs-position-metric strong{font-size:9px!important;line-height:1.3!important;color:#dce4da!important;overflow-wrap:anywhere!important;font-variant-numeric:tabular-nums!important}
    .zs-positions .zs-position-chart{display:none!important;width:100%!important;height:40px!important;min-width:0!important;overflow:hidden!important;grid-column:auto!important}
    .zs-positions .zs-position-chart .zs-spark{display:block!important;width:100%!important;height:40px!important}
    .zs-positions .zs-position-close{align-self:flex-end!important;min-width:110px!important;min-height:25px!important;padding:3px 8px!important;font-size:9px!important}
    .zs-positions .zs-position-reason{display:block!important;position:static!important;max-width:100%!important;font-size:10px!important;line-height:1.4!important;color:#bdc9b9!important;overflow-wrap:anywhere!important}
    @media(max-width:520px){.zs-positions .zs-position-metrics{grid-template-columns:1fr!important}.zs-positions .zs-position-topline{align-items:flex-start!important;flex-direction:column!important}.zs-positions .zs-position-pnl{text-align:left!important}}

    /* Central trading cockpit v3 */
    .zs-center{display:flex!important;flex-direction:column!important;gap:9px!important;min-height:0!important;overflow:hidden!important;background:radial-gradient(ellipse at 50% 0%,#354237 0%,#1b251e 42%,#101713 100%)!important}
    .zs-center>.zs-center-title{flex:0 0 auto}
    .zs-center .zs-portrait{flex:0 0 clamp(76px,11vh,108px)!important;height:clamp(76px,11vh,108px)!important;margin:0!important;border:1px solid #81947d88!important;box-shadow:0 8px 20px #0006!important}
    .zs-center .zs-portrait img{object-position:50% 20%!important;filter:grayscale(.38) contrast(1.12) brightness(.78)!important}
    .zs-center .zs-core{display:flex!important;flex:0 0 64px!important;width:100%!important;min-height:64px!important;aspect-ratio:auto!important;margin:0!important;padding:8px 14px!important;border-radius:5px!important;border:1px solid #778b78!important;background:linear-gradient(110deg,#26352a,#172019 62%,#202a22)!important;box-shadow:inset 0 1px #ffffff12,0 6px 18px #0004!important}
    .zs-center .zs-core>div{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
    .zs-center .zs-core strong:first-child{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#a7bf9a;color:#142016;font-size:17px;box-shadow:0 0 15px #a7bf9a35}
    .zs-center .zs-core strong:nth-child(2){font-size:15px;letter-spacing:.09em}
    .zs-center .zs-core span{font-size:11px;letter-spacing:.13em;color:#bdcdb7}
    .zs-center .zs-toggle{flex:0 0 40px!important;min-height:40px!important;margin:0!important;border-radius:4px!important;font-size:12px!important;letter-spacing:.06em!important}
    .zs-runtime-indicator{display:flex;align-items:center;justify-content:center;gap:9px;min-height:34px;padding:5px 9px;border:1px solid #607464;border-radius:4px;background:linear-gradient(90deg,#111a14,#202b21);color:#d8e5d2;font:700 11px/1.2 ui-monospace,Consolas,monospace;letter-spacing:.08em;font-variant-numeric:tabular-nums}.zs-runtime-indicator:before{content:'';width:8px;height:8px;flex:0 0 8px;border-radius:50%;background:#8b9a8d;box-shadow:0 0 0 3px #8b9a8d22}.zs-runtime-indicator.is-running:before{background:#a8d58d;box-shadow:0 0 0 3px #a8d58d25,0 0 12px #a8d58d88}.zs-runtime-indicator.is-offline:before{background:#d39b79;box-shadow:0 0 0 3px #d39b7922}
    .zs-center .zs-actions{flex:0 0 34px!important;margin:0!important}
    .zs-center .zs-actions button{min-height:34px!important}.zs-center .zs-runtime-indicator{flex:0 0 auto}
    .zs-center-summary{display:flex;flex:0 0 auto;align-items:center;justify-content:space-between;gap:12px;min-height:54px;padding:8px 12px;border:1px solid #596c5c;border-radius:4px;background:linear-gradient(110deg,#111a14,#202b21);box-shadow:inset 0 1px #ffffff0b}
    .zs-center-token{display:grid;gap:2px;min-width:0}.zs-center-token small{font-size:9px;letter-spacing:.11em;color:#aebbad}.zs-center-token strong{font-size:15px;letter-spacing:.05em;color:#edf2ea}.zs-center-token span{font-size:10px;color:#bdc9bc;font-variant-numeric:tabular-nums}
    .zs-center-pnl{display:grid;gap:2px;text-align:right;font-variant-numeric:tabular-nums}.zs-center-pnl strong{font-size:22px;line-height:1;color:#c6d9ba}.zs-center-pnl span{font-size:10px;color:#b9c7b7}.zs-equity-caption{font-size:9px;color:#9eae9d;letter-spacing:.04em}.zs-center-pnl.is-negative strong{color:#d49a9a}.zs-center-idle{font-size:10px;letter-spacing:.12em;color:#b8c6b6}
    .zs-chart-panel{display:flex;flex:1 1 150px;flex-direction:column;gap:6px;min-height:130px;padding:9px 10px;border:1px solid #526457;border-radius:4px;background:linear-gradient(180deg,#111a14,#0c120f);overflow:hidden}
    .zs-chart-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.zs-chart-head h3{margin:0!important;font-size:11px!important;letter-spacing:.09em}.zs-chart-range{font-size:9px;letter-spacing:.1em;color:#9eae9d}
    .zs-chart{flex:1 1 auto!important;width:100%!important;height:auto!important;min-height:96px!important;margin:0!important;border:0!important;background:linear-gradient(180deg,#a8c79b13,transparent)!important}
    .zs-chart svg{width:100%;height:100%;min-height:126px;display:block}.zs-chart svg.zs-equity-svg{width:100%;height:126px;min-height:126px;display:block;overflow:visible}
    .zs-stats-extra{flex:1;min-height:0}
    @media(max-height:760px) and (min-width:761px){.zs-center{gap:6px!important}.zs-center .zs-portrait{flex-basis:68px!important;height:68px!important}.zs-center .zs-core{flex-basis:54px!important;min-height:54px!important}.zs-center .zs-toggle{flex-basis:34px!important;min-height:34px!important}.zs-center-summary{min-height:46px;padding:6px 9px}.zs-center-pnl strong{font-size:18px}.zs-chart-panel{min-height:105px;padding:7px 9px}.zs-chart{min-height:75px!important}.zs-chart svg{min-height:75px}}
    @media(max-width:760px){.zs-center{overflow:visible!important}.zs-chart-panel{min-height:150px}.zs-chart{min-height:110px!important}}

    @media(max-width:600px){.zs-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.zs-title{font-size:18px}.zs-logrow{grid-template-columns:55px 60px 70px 1fr;font-size:9px}.zs-panel{padding:9px}.zs-portrait{height:80px}}`;


    style.textContent += `

    .zs-left{position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(90deg,#151c18f4 0%,#151c18e8 58%,#151c18b8 100%),url('/assets/zombcash-survivor-640.avif') right center/auto 100% no-repeat!important}
    .zs-left:before{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,#101713 0%,#101713d9 60%,#10171377 100%)}
    .zs-presets{margin-top:13px;padding:11px;border:1px solid #69796766;border-radius:5px;background:#0c130fbb;backdrop-filter:blur(4px)}
    .zs-presets h3{margin:0 0 5px!important;color:#d9e3d4!important;font-size:11px!important}
    .zs-preset-note{margin:0 0 8px;color:#aeb9ae;font-size:10px;line-height:1.45}
    .zs-preset-buttons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
    .zs-preset-btn{min-height:31px;padding:7px 8px;border:1px solid #59685d;border-radius:3px;background:#202a23;color:#dce5da;font-size:10px;font-weight:750;cursor:pointer}
    .zs-preset-btn:hover,.zs-preset-btn.is-selected{border-color:#a8bc9d;background:#3a4b3b;color:#fff}
    .zs-preset-applied{min-height:14px;margin:6px 0 0;color:#b9d3aa;font-size:10px}
    @media(max-width:760px){.zs-preset-buttons{grid-template-columns:1fr}}


    /* Zombie Sniper visual redesign v2 */
    .zs-layout{grid-template-columns:minmax(390px,1.08fr) minmax(300px,.82fr) minmax(430px,1.18fr);gap:12px}
    .zs-panel{position:relative;overflow:hidden;border-color:#607267;background:linear-gradient(145deg,#18231d 0%,#101813 58%,#0a100d 100%);box-shadow:0 10px 28px #0007,inset 0 1px #d9ead10d}
    .zs-left{isolation:isolate;background:linear-gradient(90deg,#101813fa 0%,#101813ed 42%,#101813a8 74%,#1018135c 100%),url('/assets/zombcash-survivor-640.avif') right 20%/auto 100% no-repeat!important}
    .zs-left:before{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,#0c130f 0%,#0c130fc9 42%,#0c130f35 100%);pointer-events:none}
    .zs-left>*{position:relative}
    .zs-left>h3{font-size:14px!important;letter-spacing:.13em!important;text-shadow:0 2px 12px #000}
    .zs-fields{position:relative;z-index:1;gap:9px 18px}
    .zs-field{padding:9px 0;border-bottom:1px solid #c4d5c00d}
    .zs-field label{font-size:11px;letter-spacing:.025em;color:#e0e8de}
    .zs-field .zs-range{height:9px;accent-color:#a8c59a;filter:drop-shadow(0 0 4px #9ec68c55)}
    .zs-field .zs-number{min-height:32px;border:1px solid #65786a;background:#0a100d;color:#f0f5ed;font-size:12px}
    .zs-presets{position:relative;z-index:1;margin-top:18px;padding:15px;border:1px solid #91a78a66;border-radius:6px;background:linear-gradient(135deg,#111a14ed,#101712c9);box-shadow:0 8px 25px #0006;backdrop-filter:blur(8px)}
    .zs-presets h3{font-size:13px!important;letter-spacing:.1em!important;color:#e5eee1!important}
    .zs-preset-note{font-size:11px;line-height:1.55;color:#c0cbbf}
    .zs-preset-buttons{gap:8px}
    .zs-preset-btn{min-height:40px;border-radius:4px;font-size:11px;letter-spacing:.025em;background:linear-gradient(180deg,#27352b,#19231c);box-shadow:inset 0 1px #ffffff13;transition:transform .18s,border-color .18s,background .18s}
    .zs-preset-btn:hover{transform:translateY(-1px)}
    .zs-preset-btn.is-selected{background:linear-gradient(180deg,#a9bf9d,#71896a);border-color:#d3e5c8;color:#0c150d;box-shadow:0 0 18px #9fc68b35,inset 0 1px #fff8}
    .zs-preset-applied{font-size:11px;font-weight:700}
    .zs-center{background:radial-gradient(ellipse at 50% 22%,#344437 0,#19231c 45%,#101713 80%)!important}
    .zs-portrait{height:clamp(125px,17vh,190px)!important;margin-bottom:13px!important;border:1px solid #7f967a66!important;border-radius:5px!important;overflow:hidden;box-shadow:0 12px 30px #0007}
    .zs-portrait img{object-fit:cover!important;object-position:50% 18%!important;filter:grayscale(.45) contrast(1.12) brightness(.76)!important;opacity:.94!important}
    .zs-portrait:after{background:linear-gradient(90deg,#0b100ef0 0%,#0b100e5c 58%,#0b100e15),linear-gradient(0deg,#0b100ebd,transparent 68%)!important}
    .zs-portrait b{font-size:13px!important;letter-spacing:.17em!important;text-shadow:0 2px 9px #000}
    .zs-core{width:min(100%,160px)!important;min-height:132px!important;border:1px solid #a5bd9b!important;box-shadow:0 0 25px #8dbb7833,inset 0 0 30px #c2d1bd1c!important}
    .zs-toggle{min-height:44px!important;box-shadow:0 0 18px #9dbd8d20,inset 0 1px #ffffff24}
    .zs-kpi{background:linear-gradient(135deg,#202e24,#111914)!important;border-color:#657b68!important}
    .zs-kpi strong{text-shadow:0 0 14px #b2d69a20}
    .zs-right{background:linear-gradient(145deg,#18231d,#0b110e)!important}
    .zs-position-section,.zs-launches{border-color:#526458!important;background:linear-gradient(180deg,#101a14,#0a100d)!important}
    .zs-position-chart{height:52px!important;max-height:none!important}
    .zs-spark{height:48px!important;filter:drop-shadow(0 0 5px #89c58b55)}
    @media(max-width:1100px){.zs-layout{grid-template-columns:minmax(0,1fr)!important}.zs-left{background-position:right center!important}}

    /* Cinematic terminal refinement */
    .zs-stats-extra{margin-top:10px;padding-top:10px;border-top:1px solid #ffffff19}.zs-stats-extra h3{margin-bottom:10px}.zs-stat-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.zs-stat-card{padding:13px;border:1px solid #536157;border-radius:4px;background:#121a15}.zs-stat-card small{display:block;color:#b9c4b9;font-size:10px;letter-spacing:.07em}.zs-stat-card strong{display:block;margin-top:7px;color:#e8eee5;font-size:clamp(17px,1.5vw,22px);font-variant-numeric:tabular-nums}.zs-stat-card .zs-negative{color:#d99b9b}

    .sniper-demo.zs-fullscreen{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;min-height:100dvh!important;max-height:none!important;box-sizing:border-box!important;display:grid!important;grid-template-rows:0 44px 38px 64px minmax(0,1fr) 0px!important;gap:7px!important;padding:12px 16px!important;background:radial-gradient(ellipse at 16% 0%,#303832 0,transparent 35%),linear-gradient(145deg,#151a18,#090e0d 55%,#1a201d)!important}
    .sniper-demo.zs-fullscreen>style{display:none!important}
    .sniper-demo.zs-fullscreen>.zs-head{grid-row:2;min-height:0;padding:0 4px 7px;align-self:stretch}
    .sniper-demo.zs-fullscreen>.zs-nav{grid-row:3;align-self:center}
    .sniper-demo.zs-fullscreen>.zs-kpis{grid-row:4;align-self:stretch}
    .sniper-demo.zs-fullscreen>.zs-layout{grid-row:5;min-height:0;height:100%;align-self:stretch}
    .sniper-demo.zs-fullscreen[data-active-tab="wallet"]{grid-template-rows:0 44px 38px 0 minmax(0,1fr) 0px!important}
    .sniper-demo.zs-fullscreen[data-active-tab="wallet"]>.zs-layout{display:none!important}
    .sniper-demo.zs-fullscreen[data-active-tab="wallet"]>.zs-wallet-view{grid-row:5!important;align-self:stretch!important;display:block!important;width:100%!important;max-width:none!important;height:100%!important;min-height:0!important;overflow:auto!important;box-sizing:border-box!important}
    .sniper-demo.zs-fullscreen[data-active-tab="wallet"] #zs-wallet-panel{grid-template-columns:minmax(0,1fr) auto!important}
    @media(max-width:760px){.sniper-demo.zs-fullscreen[data-active-tab="wallet"]{grid-template-rows:0 44px 38px minmax(0,1fr)!important}.sniper-demo.zs-fullscreen[data-active-tab="wallet"]>.zs-wallet-view{grid-row:4!important;height:auto!important;min-height:0!important}}
    .sniper-demo.zs-fullscreen>#zs-journal-panel{grid-row:6;min-height:0;overflow:hidden;padding:8px 12px}
    .sniper-demo.zs-fullscreen>.zs-help{grid-row:5;min-height:0;overflow:auto}
    .sniper-demo.zs-fullscreen>.zs-foot{display:none!important}
    .zs-head{border-bottom:1px solid #89958a44}.zs-brand{font-size:clamp(18px,1.7vw,24px);letter-spacing:.1em;color:#d3d9d1}.zs-title{font-size:clamp(20px,2vw,29px);letter-spacing:.12em;color:#f0f1ed;text-shadow:0 2px 14px #d9e0d522}.zs-demo{font-size:10px;background:#252d28;border-color:#69786d;color:#cbd5cb}
    .zs-expand{font-size:10px;letter-spacing:.07em;padding:8px 13px;background:#354037;border-color:#7d8b7e}
    .zs-nav{gap:7px;margin:0}.zs-nav button{min-width:92px;padding:9px 15px;font-size:11px;letter-spacing:.03em;border-radius:4px;background:#1b221e;border-color:#46534a}.zs-nav button.is-active{background:linear-gradient(180deg,#667560,#465344);border-color:#a7b59f;box-shadow:inset 0 -2px #d3ddcc;color:#fff}
    .zs-kpis{gap:9px;margin:0}.zs-kpi{padding:10px 13px;border-radius:5px;border-color:#58665b;background:linear-gradient(145deg,#202923,#131a16);box-shadow:0 4px 14px #0003}.zs-kpi small{font-size:11px;color:#bac4ba;letter-spacing:.035em}.zs-kpi strong{font-size:clamp(17px,1.65vw,24px);line-height:1.25}.zs-kpi-1 strong,.zs-kpi-3 strong{color:#c4d6b9}
    .zs-layout{grid-template-columns:minmax(350px,1.04fr) minmax(260px,.78fr) minmax(410px,1.28fr);gap:11px}
    .zs-panel{padding:13px 15px;border-radius:6px;border-color:#536158;background:linear-gradient(155deg,#202823,#111714 72%);box-shadow:0 7px 22px #0003,inset 0 1px #ffffff09}
    .zs-panel h3{font-size:12px;letter-spacing:.1em;color:#d7dfd5;margin-bottom:10px}
    .zs-fields{gap:7px 15px}.zs-field{grid-template-columns:minmax(0,1fr) 82px;gap:5px 9px;padding:7px 0}.zs-field label{font-size:11px;line-height:1.3;color:#cbd3cb}.zs-field .zs-range{height:7px;accent-color:#aebda5}.zs-field .zs-number{width:82px;min-height:30px;font-size:12px;border-color:#536157;background:#0b110e}
    .zs-portrait{height:78px;margin-bottom:10px;background:#111713}.zs-portrait img{object-position:50% 8%;filter:grayscale(.82) contrast(1.05) brightness(.62);opacity:.75}.zs-portrait:after{background:linear-gradient(90deg,#0b100ef2 0%,#0b100e66 58%,#0b100e22),linear-gradient(0deg,#0b100e99,transparent 65%)}.zs-portrait b{font-size:12px;letter-spacing:.15em}
    .zs-core{width:min(100%,148px);min-height:118px;margin:4px auto 10px;border-color:#8b9989;background:radial-gradient(circle,#303b32,#111813 70%);box-shadow:inset 0 0 28px #c2d1bd14,0 8px 25px #0005}.zs-core strong{font-size:14px;letter-spacing:.08em}.zs-core span{font-size:11px;color:#c3d2b8}
    .zs-toggle{min-height:38px;font-size:11px;letter-spacing:.05em;background:#354337;border-color:#9aaa91}.zs-toggle.is-on{background:#a8b99d;color:#111811}.zs-actions{margin:7px 0 12px}.zs-actions button{min-height:34px;font-size:10px}
    .zs-chart{height:84px;border-color:#65746566;background:linear-gradient(180deg,#b5c5a412,transparent)}
    .zs-right{grid-template-rows:auto minmax(0,.88fr) minmax(0,1.12fr);gap:9px}.zs-right>h3{padding-bottom:7px}.zs-position-section{min-height:0;overflow:auto;border:1px solid #344139;border-radius:4px;padding:0 10px;background:#0d1411}.zs-positions{max-height:none;min-height:0;overflow:visible}.zs-positions-inner{display:grid;gap:2px}.zs-positions .sniper-position{grid-template-columns:minmax(0,1fr) auto;padding:9px 0;gap:6px}.zs-position-head strong:first-child{font-size:13px;color:#e6ece4}.zs-position-detail{font-size:11px;line-height:1.45}.zs-position-chart{max-height:36px}.zs-spark{height:34px}
    .zs-launch-panel{display:flex;flex-direction:column;min-height:0;padding:10px 12px}.zs-launch-panel h3{margin-bottom:7px}.zs-source-select,.zs-name-filter,.zs-creator-select{min-width:0;max-width:100%;background:#101914;color:#dce7da;border:1px solid #526458;padding:6px 8px;font-size:10px}.zs-filter-label{display:flex;align-items:center;gap:4px;color:#cbd6c8;font-size:9px;white-space:nowrap}.zs-filter-label input{accent-color:#a8c59a}.zs-launch-panel .sniper-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin:0 0 7px;min-height:30px}.zs-launch-panel #sniper-feed-status{font-size:10px;line-height:1.3}.zs-launch-panel #sniper-refresh{min-height:29px;padding:6px 10px;font-size:9px;white-space:nowrap}.zs-launches{flex:1;min-height:0;max-height:none;overflow:auto;padding:0 7px;border:1px solid #36433a;border-radius:4px;background:#0d1411;scrollbar-width:thin}
    .zs-launches #sniper-candidates{display:grid}.zs-launches .sniper-candidate{grid-template-columns:minmax(0,1fr) auto;gap:5px 10px;padding:9px 3px;border-top:1px solid #ffffff12}.zs-launches .sniper-candidate-main{gap:3px}.zs-launches .sniper-token-name{font-size:12px;line-height:1.25;color:#e6ebe4}.zs-launches .sniper-candidate-main small{font-size:10px;line-height:1.25}.zs-launches .sniper-candidate-stats{grid-column:1;grid-row:2;display:flex;flex-wrap:wrap;gap:5px 12px;font-size:10px;color:#bac5ba}.zs-launches .sniper-link{display:none}.zs-launches .sniper-action{grid-column:2;grid-row:1/3;align-self:center;min-width:94px;min-height:30px;padding:6px 9px;font-size:9px}.zs-launches .sniper-action:disabled{background:#38423b!important;border-color:#526056!important;color:#bdc6bc!important;opacity:1}
    .zs-log{grid-template-columns:repeat(3,minmax(0,1fr));max-height:58px;overflow:auto}.zs-logrow{grid-template-columns:55px 52px minmax(50px,auto);gap:5px;padding:5px 7px;font-size:10px}.zs-logrow span{grid-column:1/-1;color:#aeb9af}.zs-logkind{font-size:9px;letter-spacing:.05em}
    .zs-foot{font-size:10px}.zs-fullscreen .zs-foot{display:none!important}
    .zs-tab-hidden{display:none!important}
    .zs-fullscreen .zs-fields{grid-template-columns:repeat(2,minmax(0,1fr))}
    @media(max-width:1180px) and (min-width:761px){.zs-layout{grid-template-columns:minmax(300px,1fr) minmax(230px,.8fr) minmax(330px,1.1fr)}.zs-fullscreen .zs-fields{grid-template-columns:1fr}.zs-fullscreen .zs-field label{font-size:10px}}
    @media(max-height:760px) and (min-width:761px){.sniper-demo.zs-fullscreen{grid-template-rows:0 38px 34px 56px minmax(0,1fr) 0px!important;padding:7px 12px!important;gap:5px!important}.zs-fullscreen .zs-panel{padding:9px 11px}.zs-fullscreen .zs-kpi{padding:7px 10px}.zs-fullscreen .zs-portrait{height:55px}.zs-fullscreen .zs-core{width:100px;min-height:82px}.zs-fullscreen .zs-chart{height:55px}.zs-fullscreen .zs-field{padding:3px 0}.zs-fullscreen .zs-field label{font-size:10px}.zs-fullscreen .zs-log{max-height:42px}}
    @media(min-width:761px){.sniper-demo.zs-fullscreen>.zs-layout{margin-top:8px!important;height:auto!important;min-height:0!important;align-self:stretch!important}}
    @media(max-width:760px){.sniper-demo.zs-fullscreen{display:block!important;overflow:auto!important;height:100dvh!important;padding:12px!important}.zs-fullscreen>.zs-head,.zs-fullscreen>.zs-nav,.zs-fullscreen>.zs-kpis,.zs-fullscreen>.zs-layout,.zs-fullscreen>#zs-journal-panel{display:block!important;margin-bottom:10px}.zs-fullscreen .zs-layout{height:auto;grid-template-columns:1fr}.zs-fullscreen .zs-right{min-height:520px}.zs-fullscreen .zs-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.zs-fullscreen .zs-kpis{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))}.zs-fullscreen .zs-log{grid-template-columns:1fr;max-height:150px}}
    `;
    style.textContent += `
    /* Keep the Sniper tab compact in the article: fixed dashboard height, internal panel scrolling. */
    .sniper-demo.zs-sniper-mode:not(.zs-fullscreen)>.zs-layout{height:clamp(520px,68vh,700px)!important;min-height:520px!important;max-height:700px!important;overflow:hidden!important;align-self:start!important;grid-template-columns:minmax(0,1.05fr) minmax(0,.85fr) minmax(0,1.1fr)!important}
    .sniper-demo.zs-sniper-mode:not(.zs-fullscreen)>.zs-layout>.zs-left,.sniper-demo.zs-sniper-mode:not(.zs-fullscreen)>.zs-layout>.zs-center,.sniper-demo.zs-sniper-mode:not(.zs-fullscreen)>.zs-layout>.zs-right{min-width:0!important;min-height:0!important;height:100%!important;overflow-y:auto!important;overscroll-behavior:contain}
    .sniper-demo.zs-sniper-mode:not(.zs-fullscreen) .zs-right{grid-template-rows:auto minmax(0,1fr) minmax(0,1fr)!important}
    .sniper-demo.zs-sniper-mode:not(.zs-fullscreen) .zs-position-section,.sniper-demo.zs-sniper-mode:not(.zs-fullscreen) .zs-launches{min-height:0!important;max-height:100%!important;overflow-y:auto!important}
    @media(max-width:760px){.sniper-demo.zs-sniper-mode:not(.zs-fullscreen)>.zs-layout{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;grid-template-columns:minmax(0,1fr)!important}.sniper-demo.zs-sniper-mode:not(.zs-fullscreen)>.zs-layout>.zs-left,.sniper-demo.zs-sniper-mode:not(.zs-fullscreen)>.zs-layout>.zs-center,.sniper-demo.zs-sniper-mode:not(.zs-fullscreen)>.zs-layout>.zs-right{height:auto!important;max-height:none!important;overflow:visible!important}.sniper-demo.zs-sniper-mode:not(.zs-fullscreen) .zs-right{min-height:520px!important}}

    /* History: compact trade rows; reserve real viewport space for the event log */
    .sniper-demo.zs-fullscreen.zs-history-mode{grid-template-rows:0 44px 38px 0 minmax(0,1fr) 196px!important}
    /* Keep the normal History tab compact; scroll inside its two history panes. */
    .sniper-demo.zs-history-mode:not(.zs-fullscreen)>.zs-layout{height:clamp(260px,48vh,430px)!important;min-height:260px!important;max-height:430px!important;overflow:hidden!important;align-self:start!important}
    .sniper-demo.zs-history-mode:not(.zs-fullscreen) .zs-right{grid-template-rows:auto minmax(0,1fr)!important;height:100%!important;min-height:0!important;overflow:hidden!important}
    .sniper-demo.zs-history-mode:not(.zs-fullscreen) .zs-position-section{min-height:0!important;max-height:100%!important;overflow-y:auto!important;overscroll-behavior:contain}
    .sniper-demo.zs-history-mode:not(.zs-fullscreen)>.zs-layout+.zs-panel#zs-journal-panel{display:flex!important;flex-direction:column!important;gap:6px!important;height:190px!important;min-height:0!important;max-height:190px!important;overflow:hidden!important;margin-top:8px!important;padding:9px 12px!important}
    .sniper-demo.zs-history-mode:not(.zs-fullscreen) #zs-journal-panel h3,.sniper-demo.zs-history-mode:not(.zs-fullscreen) #zs-journal-panel>.sniper-toolbar{flex:0 0 auto!important;margin:0!important}
    .sniper-demo.zs-history-mode:not(.zs-fullscreen) #zs-log{flex:1 1 auto!important;min-height:0!important;height:auto!important;max-height:none!important;overflow-y:auto!important;overscroll-behavior:contain;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-content:start!important}
    @media(max-width:760px){.sniper-demo.zs-history-mode:not(.zs-fullscreen)>.zs-layout{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important}.sniper-demo.zs-history-mode:not(.zs-fullscreen) .zs-right{height:360px!important;min-height:360px!important}.sniper-demo.zs-history-mode:not(.zs-fullscreen)>.zs-layout+.zs-panel#zs-journal-panel{height:190px!important;max-height:190px!important}.sniper-demo.zs-history-mode:not(.zs-fullscreen) #zs-log{grid-template-columns:1fr!important}}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-right{grid-template-rows:auto minmax(0,1fr)!important;align-content:stretch!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-position-section{height:100%;min-height:0!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions-inner{gap:4px!important;padding:2px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-position-card{gap:4px!important;padding:5px 7px!important;border-radius:4px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-position-topline{gap:4px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-position-symbol{font-size:12px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-position-status{padding:2px 5px!important;font-size:8px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-position-pnl{font-size:12px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-position-metrics{gap:4px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-position-metric{padding:3px 6px!important;gap:1px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-position-metric small{font-size:7px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-position-metric strong{font-size:9px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-position-contract{min-height:21px!important;padding:3px 6px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-position-contract small{font-size:7px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-position-address{font-size:9px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-copy-address{min-height:20px!important;padding:2px 6px!important;font-size:8px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-position-chart{display:none!important}
    .sniper-demo.zs-fullscreen.zs-history-mode .zs-positions .zs-position-reason{font-size:8px!important;line-height:1.2!important}
    .sniper-demo.zs-fullscreen.zs-history-mode #zs-journal-panel{display:flex!important;flex-direction:column!important;gap:5px!important;min-height:0!important;padding:8px 12px!important;overflow:hidden!important}
    .sniper-demo.zs-fullscreen.zs-history-mode #zs-journal-panel h3{flex:0 0 auto!important;margin:0!important}
    .sniper-demo.zs-fullscreen.zs-history-mode #zs-log{display:grid!important;flex:1 1 auto!important;min-height:0!important;height:auto!important;max-height:none!important;overflow:auto!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;align-content:start!important}
    .sniper-demo.zs-fullscreen.zs-history-mode #zs-log .zs-logrow{padding:5px 7px!important}
    .sniper-demo.zs-fullscreen.zs-history-mode #zs-journal-panel>.sniper-toolbar{flex:0 0 auto!important;margin:0!important}
    @media(max-height:760px) and (min-width:761px){.sniper-demo.zs-fullscreen.zs-history-mode{grid-template-rows:0 38px 34px 0 minmax(0,1fr) 180px!important}}
    @media(max-width:760px){.sniper-demo.zs-fullscreen.zs-history-mode{display:block!important;overflow:auto!important}.sniper-demo.zs-fullscreen.zs-history-mode #zs-journal-panel{min-height:180px!important}.sniper-demo.zs-fullscreen.zs-history-mode #zs-log{max-height:135px!important}}
    `;
    const header=dashNode('div','zs-head');const brand=dashNode('span','zs-brand','☣ ZOMBCASH');const title=dashNode('strong','zs-title','ZOMBIE SNIPER');const headActions=dashNode('div','zs-head-actions');headActions.append(dashNode('span','zs-demo',dcopy().demo));const expand=dashNode('button','zs-expand','⛶ '+dcopy().fullScreen);expand.type='button';expand.title='Open terminal full screen';const refreshResultsBtn=dashNode('button','zs-refresh-results','↻ '+dcopy().refreshResults);refreshResultsBtn.type='button';refreshResultsBtn.title='Synchronize paper positions and refresh P/L';function syncFullscreenButton(){const on=root.classList.contains('zs-fullscreen');document.body.classList.toggle('zs-lock',on);expand.textContent=on?'✕ '+dcopy().exitFullScreen:'⛶ '+dcopy().fullScreen;}
    function enterDashboardFullscreen(){
      // Use the browser content viewport; keep Chrome's browser chrome visible.
      mountDashboardOverlay();
      root.classList.add('zs-fullscreen');
      const viewportStyles={position:'fixed',top:'0px',right:'0px',bottom:'0px',left:'0px',width:'100vw',height:'100vh',minHeight:'100vh',maxHeight:'none',margin:'0px',boxSizing:'border-box',zIndex:'2147483600',overflow:'hidden'};
      Object.entries(viewportStyles).forEach(([key,value])=>root.style.setProperty(key,value,'important'));
      root.style.setProperty('height','100dvh','important');
      root.style.setProperty('min-height','100dvh','important');
      if(root.dataset.activeTab==='wallet'){
        root.style.setProperty('grid-template-rows','0px 44px 38px 0px minmax(0,1fr) 0px','important');
        layout.style.setProperty('display','none','important');
        walletView.style.setProperty('display','block','important');
        walletView.style.setProperty('grid-row','5','important');
        walletView.style.setProperty('width','100%','important');
        walletView.style.setProperty('max-width','none','important');
        walletView.style.setProperty('height','100%','important');
        walletView.style.setProperty('min-height','0','important');
        walletView.style.setProperty('overflow','auto','important');
      }
      root.dataset.nativeFullscreen='0';
      syncFullscreenButton();
    }
    function exitDashboardFullscreen(){
      root.classList.remove('zs-fullscreen');
      ['position','top','right','bottom','left','width','height','min-height','max-height','margin','box-sizing','z-index','overflow','grid-template-rows'].forEach(key=>root.style.removeProperty(key));
      layout.style.removeProperty('display');
      ['display','grid-row','width','max-width','height','min-height','overflow'].forEach(key=>walletView.style.removeProperty(key));
      root.dataset.nativeFullscreen='0';
      document.body.classList.remove('zs-lock');
      restoreDashboardToPage();
      syncFullscreenButton();
    }
    // One exit path for both the visible control and Escape. This prevents
    // stale fixed inline styles from leaving an invisible full-screen layer.
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&root.classList.contains('zs-fullscreen')){
        event.preventDefault();
        exitDashboardFullscreen();
      }
    });
    refreshResultsBtn.addEventListener('click',refreshResultsNow);
    expand.addEventListener('click',()=>{
      if(root.classList.contains('zs-fullscreen'))exitDashboardFullscreen();
      else enterDashboardFullscreen();
    });
    headActions.append(refreshResultsBtn,expand);header.append(brand,title,headActions);
    const nav=dashNode('nav','zs-nav');nav.setAttribute('aria-label','Zombie Sniper navigation');
    const tabTargets=['sniper','stats','history','settings','help','wallet'];
    function selectTab(tab){
      root.dataset.activeTab=tab;
      // Full-screen wallet mode previously left !important inline styles behind,
      // hiding the trading layout even after another tab was selected.
      if(root.classList.contains('zs-fullscreen')){
        root.style.removeProperty('grid-template-rows');
        layout.style.removeProperty('display');
        ['display','grid-row','width','max-width','height','min-height','overflow'].forEach(key=>walletView.style.removeProperty(key));
      }
      root.classList.toggle('zs-history-mode',tab==='history');
      root.classList.toggle('zs-sniper-mode',tab==='sniper');
      nav.querySelectorAll('button[data-zs-nav]').forEach(b=>{const active=tabTargets[Number(b.dataset.zsNav)]===tab;b.classList.toggle('is-active',active);b.setAttribute('aria-selected',active?'true':'false');});
      left.classList.toggle('zs-tab-hidden',tab!=='sniper'&&tab!=='settings');
      center.classList.toggle('zs-tab-hidden',tab!=='sniper'&&tab!=='stats');
      right.classList.toggle('zs-tab-hidden',tab!=='sniper'&&tab!=='history');
      launchPanel.classList.toggle('zs-tab-hidden',tab!=='sniper');
      posSection.classList.toggle('zs-tab-hidden',tab!=='sniper'&&tab!=='history');
      if(tab==='history'){rightTitle.textContent=uiText('history');renderPositions('history');}
      else{rightTitle.textContent=dcopy().active;}
      journal.classList.toggle('zs-tab-hidden',tab!=='history');
      kpis.classList.toggle('zs-tab-hidden',tab!=='sniper'&&tab!=='stats');
      helpPanel.classList.toggle('zs-tab-hidden',tab!=='help');
      layout.classList.toggle('zs-stats-layout',tab==='stats');layout.classList.toggle('zs-single-layout',tab==='history'||tab==='settings');walletView.classList.toggle('zs-tab-hidden',tab!=='wallet');if(tab==='wallet')refreshWalletInfo();layout.classList.toggle('zs-tab-hidden',tab==='help');
      
      if(tab==='stats'){renderStats();statsPanel.classList.remove('zs-tab-hidden');portrait.classList.add('zs-tab-hidden');core.classList.add('zs-tab-hidden');toggle.classList.add('zs-tab-hidden');uptime.classList.add('zs-tab-hidden');chartPanel.classList.add('zs-tab-hidden');}
      else{statsPanel.classList.add('zs-tab-hidden');portrait.classList.remove('zs-tab-hidden');core.classList.remove('zs-tab-hidden');toggle.classList.remove('zs-tab-hidden');uptime.classList.remove('zs-tab-hidden');chartPanel.classList.remove('zs-tab-hidden');}
    }
    dcopy().nav.forEach((label,i)=>{if(i===5)label=walletText('nav');const b=dashNode('button','',label);b.dataset.zsNav=String(i);b.type='button';b.setAttribute('role','tab');b.addEventListener('click',()=>selectTab(tabTargets[i]||'sniper'));nav.append(b);});
    const walletTab=dashNode('button','',walletText('nav'));walletTab.dataset.zsNav='5';walletTab.type='button';walletTab.setAttribute('role','tab');walletTab.addEventListener('click',()=>selectTab('wallet'));nav.append(walletTab);
    const kpis=dashNode('div','zs-kpis');kpis.id='zs-kpis';
    const layout=dashNode('div','zs-layout');const left=dashNode('section','zs-panel zs-left');left.id='zs-settings';const leftTitle=dashNode('h3','',dcopy().settings);leftTitle.id='zs-settings-title';left.append(leftTitle);

    const presetPanel=dashNode('section','zs-presets');presetPanel.id='zs-presets';
    const presetHeading=dashNode('h3','',uiText('recommended'));presetHeading.id='zs-presets-title';presetPanel.append(presetHeading);
    const presetNote=dashNode('p','zs-preset-note',uiText('presetNote'));presetNote.id='zs-preset-note';presetPanel.append(presetNote);
    const presetButtons=dashNode('div','zs-preset-buttons');
    const presets=[
      {id:'conservative',label:uiText('conservative'),v:{capital:10,size:0.02,target:8,stop:10,network:0.00001,priority:0.00005,dex:0.5,slip:0.5,max:0.05,liq:20000}},
      {id:'balanced',label:uiText('balanced'),v:{capital:10,size:0.05,target:12,stop:15,network:0.00001,priority:0.0001,dex:0.5,slip:1,max:0.05,liq:10000}},
      {id:'aggressive',label:uiText('aggressive'),v:{capital:10,size:0.05,target:20,stop:25,network:0.00002,priority:0.0002,dex:0.5,slip:2,max:0.05,liq:5000}}
    ];
    presets.forEach(p=>{
      const b=dashNode('button','zs-preset-btn',p.label);b.type='button';b.dataset.preset=p.id;
      b.addEventListener('click',()=>{
        const v=p.v,map={'sniper-size':v.size,'sniper-target':v.target,'sniper-stop':v.stop,'sniper-network':v.network,'sniper-priority':v.priority,'sniper-dex':v.dex,'sniper-slip':v.slip,'sniper-capital':v.capital,'sniper-max-size':v.max,'sniper-liquidity':v.liq};
        Object.entries(map).forEach(([id,value])=>{const el=$(id);if(el){el.value=String(value);const r=el.parentElement&&el.parentElement.querySelector('.zs-range');if(r)r.value=String(value);}});
        terminal.capital=v.capital;terminal.maxTradeSize=v.max;terminal.minLiquidity=v.liq;terminal.selectedPreset=p.id;saveTerminal();renderStats();
        presetButtons.querySelectorAll('button').forEach(x=>x.classList.toggle('is-selected',x===b));
        applied.textContent=(uiText('presetAppliedPrefix'))+p.label;logEvent('PRESET','SYSTEM','','presetApplied',{preset:p.label});
      });
      presetButtons.append(b);
    });
    const applied=dashNode('p','zs-preset-applied','');applied.id='zs-preset-applied';
    presetPanel.append(presetButtons,applied);

    const fieldHost=dashNode('div','zs-fields');fields.forEach((f,i)=>{f.classList.add('zs-field');const input=f.querySelector('input');if(input){const lim={ 'sniper-size':[0.001,10,0.001], 'sniper-target':[0.1,100,0.1], 'sniper-stop':[0,99,0.5], 'sniper-network':[0,0.1,0.000001], 'sniper-priority':[0,0.1,0.000001], 'sniper-dex':[0,20,0.05], 'sniper-slip':[0,50,0.1] }[input.id];if(lim)addRange(f,input.id,...lim);}fieldHost.append(f);});
    addVirtualField(fieldHost,'sniper-capital',dcopy().capital,0.1,1000,0.1,terminal.capital||10);
    terminal.maxTradeSize=Math.max(0.001,Number(terminal.capital)||10);
    addVirtualField(fieldHost,'sniper-liquidity',dcopy().minliq,0,1000000,100,terminal.minLiquidity||5000);
    addVirtualField(fieldHost,'sniper-idle-timeout',uiText('idleTimeout'),15,300,5,terminal.idleTimeout||60);
    addVirtualField(fieldHost,'sniper-min-move',uiText('minMove'),0.05,2,0.05,terminal.minMovePct||0.2);
    addVirtualField(fieldHost,'sniper-min-buys',uiText('minBuys'),1,30,1,terminal.minBuyCount||3);
    addVirtualField(fieldHost,'sniper-max-daily-loss',uiText('maxDailyLoss'),0,1000,0.01,terminal.maxDailyLossSol??1,false);
    const maxOpenField=addVirtualField(fieldHost,'sniper-max-open',uiText('maxOpen'),1,20,1,Number.isFinite(Number(terminal.maxOpenPositions))?Number(terminal.maxOpenPositions):4);
    const maxOpenInput=$('sniper-max-open');
    if(maxOpenInput){
      maxOpenInput.value=String(Math.max(1,Math.min(20,Math.round(Number(maxOpenInput.value)))));
      terminal.maxOpenPositions=Number(maxOpenInput.value);
      const valueLabel=dashNode('strong','zs-limit-value',String(terminal.maxOpenPositions));
      maxOpenField.append(valueLabel);
      const syncLimit=()=>{terminal.maxOpenPositions=Math.max(1,Math.min(20,Math.round(Number(maxOpenInput.value)||1)));maxOpenInput.value=String(terminal.maxOpenPositions);valueLabel.textContent=String(terminal.maxOpenPositions);saveTerminal();};
      maxOpenInput.addEventListener('input',syncLimit);
      maxOpenInput.addEventListener('change',syncLimit);
    }
    const sizeInput=$('sniper-size');if(sizeInput){sizeInput.max=Math.max(0.001,Number(terminal.capital)||10);const sizeSlider=sizeInput.parentElement&&sizeInput.parentElement.querySelector('.zs-range');if(sizeSlider)sizeSlider.max=sizeInput.max;}
    const walletPanel=dashNode('div','zs-foot');walletPanel.id='zs-wallet-panel';
    left.append(fieldHost,presetPanel,dashNode('p','zs-foot',dcopy().hint));
    const walletView=dashNode('section','zs-panel zs-wallet-view zs-tab-hidden');walletView.id='zs-wallet-view';
    walletView.append(dashNode('h3','',walletText('title')),dashNode('p','zs-foot',walletText('privateKey')),walletPanel);
    const center=dashNode('section','zs-panel zs-center');center.id='zs-center';const centerTitle=dashNode('h3','',dcopy().autopilot);centerTitle.id='zs-center-title';center.append(centerTitle);
    const portrait=dashNode('div','zs-portrait');const pic=dashNode('img','');pic.src='/assets/zombcash-survivor-640.avif';pic.alt='ZombieCash anime survivor heroine';portrait.append(pic,dashNode('b','','$ZOMBCASH SURVIVOR'));
    const core=dashNode('div','zs-core');const coreText=dashNode('div','');coreText.append(dashNode('strong','', '◉'),dashNode('strong','',dcopy().autoCore),dashNode('span','', 'PAPER ENGINE'));core.append(coreText);
    const toggle=dashNode('button','zs-toggle',dcopy().paused);toggle.id='zs-auto-toggle';toggle.type='button';toggle.addEventListener('click',async()=>{if(terminal.auto){if(!await setServerPaperEnabled(false))return;terminal.auto=false;terminal.stoppedAt=Date.now();saveTerminal();renderDashboardState();logEvent('PAUSED','SYSTEM','','paused');}else showLaunchConfirm();});
    const uptime=dashNode('div','zs-runtime-indicator');uptime.id='zs-runtime-indicator';uptime.setAttribute('role','status');
    const statsPanel=dashNode('div','zs-stats-extra zs-tab-hidden');statsPanel.id='zs-stats-extra';
    const statsHeading=dashNode('h3','',uiText('statsHeading'));statsHeading.id='zs-stats-heading';
    const statsGrid=dashNode('div','zs-stat-grid');statsGrid.id='zs-stat-grid';statsPanel.append(statsHeading,statsGrid);
    const centerSummary=dashNode('div','zs-center-summary');centerSummary.id='zs-center-summary';const chartPanel=dashNode('div','zs-chart-panel');const chartHead=dashNode('div','zs-chart-head');const chartTitle=dashNode('h3','',uiText('equityCurve'));chartTitle.id='zs-chart-title';chartHead.append(chartTitle,dashNode('span','zs-chart-range',uiText('sinceStart')));chartPanel.append(chartHead,dashNode('small','zs-equity-caption',''));const chart=dashNode('div','zs-chart');chart.id='zs-main-chart';chartPanel.append(chart);
    center.append(portrait,core,toggle,uptime,centerSummary,chartPanel,statsPanel);
    const right=dashNode('section','zs-panel zs-right');const rightTitle=dashNode('h3','',dcopy().active);rightTitle.id='zs-right-title';right.append(rightTitle);const posSection=dashNode('div','zs-position-section');const posWrap=dashNode('div','zs-positions');posWrap.id='zs-positions-wrap';if(positions){positions.classList.add('zs-positions-inner');posWrap.append(positions);}posSection.append(posWrap);right.append(posSection);
    const launchPanel=dashNode('section','zs-panel zs-launch-panel');const launchTitle=dashNode('h3','',dcopy().launches);launchTitle.id='zs-launch-title';launchPanel.append(launchTitle);const toolbar=dashNode('div','sniper-toolbar');
    const sourceSelect=dashNode('select','zs-source-select');sourceSelect.setAttribute('aria-label','Candidate source');
    [['all','allSources'],['pumpportal','pumpLaunches'],['boosts','boostMonitor'],['community','community']].forEach(([v,key])=>{const option=document.createElement('option');option.value=v;option.textContent=uiText(key);sourceSelect.append(option);});
    sourceSelect.value=state.source;sourceSelect.addEventListener('change',()=>{state.source=sourceSelect.value;if(terminal.auto)refreshFeed();});
    const socialsLabel=dashNode('label','zs-filter-label');const socialsCheck=dashNode('input','');socialsCheck.type='checkbox';socialsCheck.checked=state.requireSocials;socialsCheck.addEventListener('change',()=>{state.requireSocials=socialsCheck.checked;renderCandidates();if(terminal.auto&&authToken())setServerPaperEnabled(true);});socialsLabel.append(socialsCheck,dashNode('span','',uiText('socialsOnly')));
    const nameFilter=dashNode('input','zs-name-filter');nameFilter.type='search';nameFilter.placeholder=uiText('filterTicker');nameFilter.value=state.nameQuery;nameFilter.addEventListener('input',()=>{state.nameQuery=nameFilter.value;renderCandidates();});
    const creatorSelect=dashNode('select','zs-creator-select');creatorSelect.setAttribute('aria-label','Creator history');
    [['any','anyDev'],['first','firstSeen'],['repeat','repeatDev']].forEach(([v,key])=>{const option=document.createElement('option');option.value=v;option.textContent=uiText(key);creatorSelect.append(option);});
    creatorSelect.value=state.creatorFilter;creatorSelect.addEventListener('change',()=>{state.creatorFilter=creatorSelect.value;renderCandidates();if(terminal.auto&&authToken())setServerPaperEnabled(true);});
    toolbar.append(sourceSelect,socialsLabel,nameFilter,creatorSelect);if(refresh)toolbar.append(refresh);if(status)toolbar.append(status);launchPanel.append(toolbar);const launchWrap=dashNode('div','zs-launches');if(candidates)launchWrap.append(candidates);launchPanel.append(launchWrap);
    right.append(launchPanel);layout.append(left,center,right);
    const journal=dashNode('section','zs-panel');journal.id='zs-journal-panel';const logTitle=dashNode('h3','',dcopy().journal);logTitle.id='zs-log-title';journal.append(logTitle);const log=dashNode('div','zs-log');log.id='zs-log';journal.append(log);
    const clearBar=dashNode('div','sniper-toolbar');if(clear)clearBar.append(clear);journal.append(clearBar);
    const foot=dashNode('p','zs-foot',dcopy().hint+' '+t('source'));
    const helpPanel=dashNode('section','zs-panel zs-help zs-tab-hidden');helpPanel.id='zs-help-panel';
    style.textContent += `
      .zs-help{min-height:0;overflow:auto!important;padding:clamp(14px,2vw,24px)!important}
      .zs-help-heading{margin:0 0 12px!important;font-size:clamp(16px,1.5vw,21px)!important;letter-spacing:.1em;color:#e2e9df}
      .zs-help-notice{margin:0 0 16px;padding:13px 16px;border:1px solid #8c9a7b;border-left:4px solid #b3c39f;border-radius:4px;background:linear-gradient(100deg,#303a30,#1b241e);color:#f0f3e9;font-size:13px;line-height:1.65;font-weight:650}
      .zs-help-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-content:start}
      .zs-help-card{min-width:0;padding:14px 16px;border:1px solid #465449;border-radius:5px;background:linear-gradient(145deg,#18221b,#101713);box-shadow:inset 0 1px #ffffff09}
      .zs-help-card h4{margin:0 0 8px;color:#c5d3ba;font:750 11px/1.45 Orbitron,system-ui,sans-serif;letter-spacing:.06em}
      .zs-help-card p{margin:0;color:#c4cec3;font:500 13px/1.65 Rajdhani,system-ui,sans-serif}
      @media(max-width:760px){.zs-help-grid{grid-template-columns:1fr;gap:9px}.zs-help-card{padding:12px}.zs-help-notice{font-size:12px}}
    `;
    renderHelpPanel();
    style.textContent += '.zs-wallet-view{width:100%!important;max-width:none!important;min-width:0!important;min-height:0!important;box-sizing:border-box!important}.zs-wallet-view #zs-wallet-panel{display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-items:stretch!important;width:100%!important;max-width:none!important;min-width:0!important;box-sizing:border-box!important;gap:12px!important}.zs-wallet-view #zs-wallet-panel>*{grid-column:1/-1!important;min-width:0!important}.zs-wallet-view #zs-wallet-panel code{display:block!important;max-width:100%!important;overflow-wrap:anywhere!important;word-break:break-word!important}.zs-wallet-view #zs-wallet-panel .zs-wallet-balance{display:flex!important;grid-column:1/-1!important;flex-wrap:wrap!important;min-width:0!important}.zs-wallet-view #zs-wallet-panel .zs-wallet-refresh{margin-left:auto!important}.sniper-demo.zs-fullscreen[data-active-tab="wallet"]{grid-template-rows:0 44px 38px minmax(0,1fr)!important;grid-auto-rows:0!important;min-height:0!important}.sniper-demo.zs-fullscreen[data-active-tab="wallet"]>.zs-wallet-view{grid-row:4!important;display:block!important;width:100%!important;max-width:none!important;height:100%!important;min-height:0!important;overflow:auto!important;align-self:stretch!important}.sniper-demo.zs-fullscreen[data-active-tab="wallet"] #zs-wallet-panel{grid-template-columns:minmax(0,1fr)!important}.sniper-demo.zs-fullscreen[data-active-tab="wallet"]>.zs-layout{display:none!important}.zs-wallet-view #zs-wallet-panel>*{overflow-wrap:anywhere!important}'+'.zs-wallet-activity{display:grid;gap:8px;width:100%}.zs-wallet-activity-item{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(184,198,190,.12);font-size:12px}.zs-wallet-activity-item a{color:#c4d2b2;text-decoration:underline}.zs-wallet-activity-item small{opacity:.7}'+ ' .zs-wallet-balance{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:14px 0;border-top:1px solid rgba(184,198,190,.18);border-bottom:1px solid rgba(184,198,190,.18)}.zs-wallet-balance strong{font-size:20px;color:#c4d2b2}.zs-wallet-refresh{margin-left:auto;background:transparent;border:1px solid #9eaf8d;color:#c4d2b2;padding:8px 12px;cursor:pointer}.zs-wallet-note{color:#c3b99c;line-height:1.6}'+'.zs-wallet-view{max-width:900px;min-height:300px;padding:clamp(18px,3vw,30px)!important}.zs-wallet-view h3{font:750 18px/1.4 Orbitron,system-ui,sans-serif;letter-spacing:.1em;color:#e1e5df;margin:0 0 12px}#zs-wallet-panel{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;padding:18px;border:1px solid rgba(184,198,190,.22);background:rgba(8,13,14,.7);margin-top:20px}#zs-wallet-panel strong,#zs-wallet-panel small{grid-column:1/-1}#zs-wallet-panel code{overflow-wrap:anywhere;color:#c4d2b2;font-size:13px}.zs-wallet-provision,.zs-copy-address{border:1px solid #9eaf8d;background:#a9bf91;color:#101610;padding:10px 14px;font-weight:800;cursor:pointer}.zs-wallet-provision:disabled{opacity:.55;cursor:wait}.zs-wallet-error{color:#e1a6a6}';
    style.textContent += '.zs-wallet-view{width:100%!important;max-width:none!important;min-width:0!important;min-height:0!important;box-sizing:border-box!important}.zs-wallet-view #zs-wallet-panel{display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-items:stretch!important;width:100%!important;max-width:none!important;min-width:0!important;box-sizing:border-box!important;gap:12px!important}.zs-wallet-view #zs-wallet-panel>*{grid-column:1/-1!important;min-width:0!important}.zs-wallet-view #zs-wallet-panel code{display:block!important;max-width:100%!important;overflow-wrap:anywhere!important;word-break:break-word!important}.zs-wallet-view #zs-wallet-panel .zs-wallet-balance{display:flex!important;grid-column:1/-1!important;flex-wrap:wrap!important;min-width:0!important}.zs-wallet-view #zs-wallet-panel .zs-wallet-refresh{margin-left:auto!important}.sniper-demo.zs-fullscreen[data-active-tab="wallet"]{grid-template-rows:0 44px 38px minmax(0,1fr)!important;grid-auto-rows:0!important;min-height:0!important}.sniper-demo.zs-fullscreen[data-active-tab="wallet"]>.zs-wallet-view{grid-row:4!important;display:block!important;width:100%!important;max-width:none!important;height:100%!important;min-height:0!important;overflow:auto!important;align-self:stretch!important}.sniper-demo.zs-fullscreen[data-active-tab="wallet"] #zs-wallet-panel{grid-template-columns:minmax(0,1fr)!important}.sniper-demo.zs-fullscreen[data-active-tab="wallet"]>.zs-layout{display:none!important}.zs-wallet-view #zs-wallet-panel>*{overflow-wrap:anywhere!important}';
    style.textContent += '.zs-wallet-view{width:100%!important;max-width:1120px!important;margin:0 auto!important;padding:clamp(14px,2vw,24px)!important;box-sizing:border-box!important}.zs-wallet-view #zs-wallet-panel{width:100%!important;max-width:980px!important;margin:14px auto 0!important;grid-template-columns:auto minmax(180px,1fr) auto!important;align-items:center!important;gap:10px 14px!important;padding:18px!important}.zs-wallet-view #zs-wallet-panel>.zs-wallet-provision{grid-column:1!important;width:auto!important;min-width:190px!important;justify-self:start!important;white-space:nowrap!important}.zs-wallet-view #zs-wallet-panel>.zs-wallet-address{grid-column:2!important;display:block!important;min-width:0!important;max-width:100%!important;overflow-wrap:anywhere!important}.zs-wallet-view #zs-wallet-panel>.zs-copy-address{grid-column:3!important;width:auto!important;min-width:88px!important;justify-self:end!important}.zs-wallet-view #zs-wallet-panel>.zs-wallet-balance,.zs-wallet-view #zs-wallet-panel>.zs-wallet-note,.zs-wallet-view #zs-wallet-panel>.zs-wallet-reconciliation,.zs-wallet-view #zs-wallet-panel>.zs-wallet-activity-title,.zs-wallet-view #zs-wallet-panel>.zs-wallet-activity,.zs-wallet-view #zs-wallet-panel>small{grid-column:1/-1!important}.zs-wallet-view #zs-wallet-panel>.zs-wallet-reconciliation{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:8px!important}.zs-wallet-view #zs-wallet-panel>.zs-wallet-reconciliation button{width:auto!important}.zs-wallet-view #zs-wallet-panel>.zs-wallet-activity{max-height:260px!important;overflow:auto!important;overscroll-behavior:contain!important}.zs-wallet-view #zs-wallet-panel .zs-wallet-activity-item{grid-template-columns:minmax(100px,1fr) minmax(120px,1fr) auto!important;min-width:0!important}@media(max-width:760px){.zs-wallet-view{max-width:100%!important;padding:12px!important}.zs-wallet-view #zs-wallet-panel{grid-template-columns:minmax(0,1fr)!important;gap:10px!important;padding:12px!important}.zs-wallet-view #zs-wallet-panel>.zs-wallet-provision,.zs-wallet-view #zs-wallet-panel>.zs-wallet-address,.zs-wallet-view #zs-wallet-panel>.zs-copy-address{grid-column:1!important;width:100%!important;min-width:0!important;justify-self:stretch!important}.zs-wallet-view #zs-wallet-panel>.zs-wallet-address{overflow-wrap:anywhere!important}.zs-wallet-view #zs-wallet-panel .zs-wallet-activity-item{grid-template-columns:minmax(0,1fr)!important}.zs-wallet-view #zs-wallet-panel>.zs-wallet-balance{gap:8px!important}.zs-wallet-view #zs-wallet-panel .zs-wallet-refresh{margin-left:auto!important}}';
    style.textContent += '.sniper-demo.zs-fullscreen[data-active-tab="wallet"]>.zs-wallet-view{max-width:1120px!important;margin-left:auto!important;margin-right:auto!important}.zs-wallet-activity-header{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;grid-column:1/-1!important;min-width:0!important}.zs-wallet-activity-header .zs-wallet-activity-title{grid-column:auto!important;margin:0!important}.zs-wallet-activity-refresh{flex:0 0 auto!important;width:auto!important;padding:7px 10px!important;border:1px solid #718078!important;background:#202724!important;color:#dce2dc!important;font-size:10px!important;font-weight:700!important;cursor:pointer!important}.zs-wallet-activity-refresh:disabled{opacity:.55!important;cursor:wait!important}@media(max-width:760px){.sniper-demo.zs-fullscreen[data-active-tab="wallet"]>.zs-wallet-view{max-width:100%!important;margin-left:0!important;margin-right:0!important}.zs-wallet-activity-header{flex-wrap:wrap!important}.zs-wallet-activity-refresh{width:auto!important}}';
    root.replaceChildren(style,header,nav,kpis,layout,journal,helpPanel,walletView,foot);
    renderDashboardState();renderPositions();renderCandidates();selectTab('sniper');
  }

  async function refreshResultsNow(){
    if(state.resultsRefreshing)return;
    state.resultsRefreshing=true;
    const button=$('zs-refresh-results');
    if(button){button.disabled=true;button.textContent='UPDATING…';}
    try{
      // Registered accounts first pull the persistent server ledger, then
      // refresh market quotes so the displayed P/L is not left at an old snapshot.
      if(authToken())await syncFromServer();
      await updatePositions();
      renderDashboardState();
      renderPositions();
      if(button)button.textContent='UPDATED '+new Date().toLocaleTimeString();
    }catch(_){
      if(button)button.textContent='UPDATE FAILED';
    }finally{
      state.resultsRefreshing=false;
      if(button)button.disabled=false;
    }
  }

  function init(){
    readStore();activeStorageKey=storageKey();detectLang();buildDashboard();translate();
    $('sniper-refresh').addEventListener('click',()=>refreshFeed(true));
    $('sniper-clear').addEventListener('click',async()=>{
      const button=$('sniper-clear');
      if(button)button.disabled=true;
      try{
        if(!await clearServerHistory())return;
        state.positions=[];
        saveStore();
        const now=Date.now();
        terminal.logs=[];
        terminal.equityHistory=[];
        terminal.seen=[];
        terminal.lastAuto=0;
        terminal.startedAt=terminal.auto?now:0;
        terminal.stoppedAt=terminal.auto?0:now;
        terminal.sessionStartCapital=Math.max(0.000001,Number($('sniper-capital')&&$('sniper-capital').value)||Number(terminal.capital)||10);
        if(terminal.auto)terminal.equityHistory=[{at:now,value:terminal.sessionStartCapital}];
        saveTerminal();
        renderDashboardState();
        renderPositions();
        if($('sniper-feed-status'))$('sniper-feed-status').textContent=t('cleared');
      }finally{if(button)button.disabled=false;}
    });
    ['sniper-network','sniper-priority','sniper-dex','sniper-slip','sniper-target','sniper-stop'].forEach(id=>$(id).addEventListener('change',updatePositions));
    ['sniper-capital','sniper-size','sniper-target','sniper-stop','sniper-min-move','sniper-idle-timeout','sniper-network','sniper-priority','sniper-dex','sniper-slip','sniper-min-buys','sniper-max-daily-loss','sniper-max-open'].forEach(id=>$(id)?.addEventListener('change',()=>{if(terminal.auto&&authToken())setServerPaperEnabled(true);}));
    refreshFeed(true);if(authToken())syncFromServer();else{updateSyncStatus('loginToSync');updatePositions();if(terminal.auto)setServerPaperEnabled(true);}
    window.addEventListener('pagehide',()=>{if(terminal.auto&&!authToken()){try{fetch(AUTH_API+'/api/sniper/demo-feed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:false}),keepalive:true});}catch(_){}}});
    if(terminal.auto&&!Number(terminal.startedAt)){terminal.startedAt=Date.now();saveTerminal();}const updateRuntimeIndicator=()=>{const node=$('zs-runtime-indicator');if(!node)return;const running=!!terminal.auto;const elapsed=running?Math.max(0,Math.floor((Date.now()-(Number(terminal.startedAt)||Date.now()))/1000)):0;const hh=String(Math.floor(elapsed/3600)).padStart(2,'0');const mm=String(Math.floor((elapsed%3600)/60)).padStart(2,'0');const ss=String(elapsed%60).padStart(2,'0');node.classList.toggle('is-running',running);node.classList.toggle('is-offline',!running);node.textContent=(running?uiText('runtimeRunning'):uiText('runtimeStopped'))+'  '+hh+':'+mm+':'+ss;};
    updateRuntimeIndicator();window.setInterval(updateRuntimeIndicator,1000);
    state.timer=window.setInterval(()=>{checkAccountChange();if(terminal.auto&&!document.hidden)refreshFeed();},15000);
    state.positionTimer=window.setInterval(()=>{if(terminal.auto&&!document.hidden)refreshResultsNow();},10000);
    document.addEventListener('visibilitychange',()=>{if(terminal.auto&&!document.hidden){refreshFeed();refreshResultsNow();}});

    document.addEventListener('zombcash:languagechange',()=>{detectLang();translate();if($('zs-kpis'))renderDashboardState();if($('zs-kpis'))renderHelpPanel();});
    document.addEventListener('zombcash:survivorlogin',()=>{if(!checkAccountChange())syncFromServer();});
    document.addEventListener('click',event=>{if(event.target&&event.target.closest&&event.target.closest('#survivor-logout'))Promise.resolve().then(checkAccountChange);});
    window.addEventListener('storage',event=>{if(event.key===TOKEN_KEY||event.key===PROFILE_KEY){if(!checkAccountChange()&&authToken())syncFromServer().then(updatePositions);}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();