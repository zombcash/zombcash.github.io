(() => {
  'use strict';
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
      cap:'Demo trade size is capped at 0.05 SOL. A registered profile may have an empty Vault-backed wallet, but paper mode never uses or funds it. Live trading remains disabled.',
      ageUnknown:'unknown', justNow:'just now', mins:'m ago', hours:'h ago', days:'d ago', liveConnected:'LIVE LAUNCH STREAM CONNECTED', liveDisconnected:'LAUNCH STREAM OFFLINE — DEXSCREENER FALLBACK', waitingForPool:'WAITING FOR SOL POOL', liveTag:'LIVE LAUNCH',
      needAmount:'Enter a paper buy size greater than zero and no more than 0.05 SOL.',
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
      cap:'Размер демо-сделки ограничен 0,05 SOL. У зарегистрированного пользователя может быть пустой кошелёк, защищённый Vault, но демо его не использует и не пополняет. Реальная торговля отключена.',
      ageUnknown:'неизвестно', justNow:'только что', mins:' мин. назад', hours:' ч. назад', days:' дн. назад', liveConnected:'ПОТОК ЗАПУСКОВ АКТИВЕН', liveDisconnected:'ПОТОК ОТКЛЮЧЁН — РЕЗЕРВ DEXSCREENER', waitingForPool:'ОЖИДАНИЕ SOL-ПУЛА', liveTag:'НОВЫЙ ЗАПУСК',
      needAmount:'Укажите размер демо-покупки больше нуля и не более 0,05 SOL.',
      noPair:'Для этого токена нет текущего пула с котировкой в SOL.', buyOk:'Демо-позиция открыта. Транзакция не отправлялась.',
      positionLimit:'В демо допускается только одна открытая позиция одновременно.', clear:'ОЧИСТИТЬ ЛОКАЛЬНУЮ ИСТОРИЮ', cleared:'Локальная история демо очищена.',
      refreshDone:'Лента обновлена.', feeWarning:'Только примерные допущения'
    },
    de: {title:'ZOMBIE SNIPER // PAPER-DEMO',intro:'Teste Ein- und Ausstiegsregeln mit öffentlichen DEX-Marktdaten. Keine Wallet-Verbindung und keine Transaktionen.',demo:'NUR DEMO',refresh:'TOKENLISTE AKTUALISIEREN',loading:'Neueste öffentliche Tokenprofile werden geladen…',failed:'Der öffentliche Feed ist vorübergehend nicht verfügbar.',source:'Quelle: kostenloser PumpPortal-WebSocket für neue Token/Migrationen plus DexScreener-SOL-Paare; DexScreener-Profile dienen als Fallback. Feed und Indexierung können verzögert sein; Einstieg in der ersten Minute ist nicht garantiert.',amount:'DEMO-KAUFGRÖSSE (SOL)',target:'NETTO-GEWINNZIEL (%)',stop:'NETTO-STOP-LOSS (%)',network:'NETZWERKGEBÜHR / TX (SOL)',priority:'PRIORITÄTSGEBÜHR / TX (SOL)',dex:'DEX-GEBÜHR / SEITE (%)',slip:'SLIPPAGE / SEITE (%)',assumptions:'Bearbeitbare Kostenannahmen, keine Live-Gebührenquotes.',candidates:'NEUESTE SOLANA-TOKENPROFILE',noCandidates:'Keine passenden SOL-Paare gefunden.',token:'TOKEN',age:'PAIR-ALTER',liquidity:'LIQUIDITÄT',price:'PREIS (SOL)',action:'DEMO-KAUF',positions:'DEMO-POSITIONEN',noPositions:'Noch keine Demo-Positionen.',open:'OFFEN',closed:'GESCHLOSSEN',entry:'EINSTIEG',current:'AKTUELL',net:'NETTO-P/L',targetHit:'NETTOZIEL ERREICHT — DEMO-VERKAUF',stopHit:'STOP-LOSS ERREICHT — DEMO-VERKAUF',manualClose:'DEMO-POSITION SCHLIESSEN',saved:'Demo-Verlauf wird nur lokal in diesem Browser gespeichert.', synced:'Demo-Verlauf mit deinem Telegram-Profil synchronisiert.', loginToSync:'Mit Telegram anmelden, um den Demo-Verlauf zu synchronisieren.', loginAgain:'Telegram-Sitzung abgelaufen. Bitte erneut anmelden.', syncError:'Synchronisierung nicht verfügbar; lokale Kopie bleibt erhalten.',rules:'Netto-P/L berücksichtigt DEX-Gebühren und Slippage auf beiden Seiten sowie Netzwerk- und Prioritätsgebühren für beide Transaktionen.',cap:'Demo-Größe maximal 0,05 SOL. Keine Wallet, keine echten Trades.',ageUnknown:'unbekannt',justNow:'gerade eben',mins:' Min.',hours:' Std.',days:' Tg.',needAmount:'Demo-Kaufgröße muss größer als 0 und höchstens 0,05 SOL sein.',noPair:'Kein aktuelles SOL-Paar verfügbar.',buyOk:'Demo-Position eröffnet. Keine Transaktion gesendet.',positionLimit:'Nur eine offene Demo-Position gleichzeitig.',clear:'LOKALE DEMO-HISTORIE LÖSCHEN',cleared:'Lokale Demo-Historie gelöscht.',refreshDone:'Feed aktualisiert.'},
    fr: {title:'ZOMBIE SNIPER // DÉMO PAPIER',intro:'Testez les règles avec des données DEX publiques. Aucun portefeuille ni aucune transaction.',demo:'DÉMO UNIQUEMENT',refresh:'ACTUALISER LES TOKENS',loading:'Analyse des derniers profils publics…',failed:'Flux public temporairement indisponible.',source:'Source : flux WebSocket gratuit PumpPortal (nouveaux tokens/migrations) et paires SOL DexScreener ; les profils DexScreener servent de secours. Le flux et l’indexation peuvent être retardés ; aucune entrée dans la première minute n’est garantie.',amount:'TAILLE ACHAT DÉMO (SOL)',target:'OBJECTIF DE PROFIT NET (%)',stop:'STOP-LOSS NET (%)',network:'FRAIS RÉSEAU / TX (SOL)',priority:'FRAIS PRIORITAIRES / TX (SOL)',dex:'FRAIS DEX / CÔTÉ (%)',slip:'GLISSEMENT / CÔTÉ (%)',assumptions:'Hypothèses modifiables, pas des devis de frais en direct.',candidates:'DERNIERS PROFILS DE TOKENS SOLANA',noCandidates:'Aucune paire SOL appropriée trouvée.',token:'TOKEN',age:'ÂGE DE PAIRE',liquidity:'LIQUIDITÉ',price:'PRIX (SOL)',action:'ACHAT DÉMO',positions:'POSITIONS DÉMO',noPositions:'Aucune position démo pour le moment.',open:'OUVERTE',closed:'FERMÉE',entry:'ENTRÉE',current:'ACTUEL',net:'P/L NET',targetHit:'OBJECTIF NET ATTEINT — VENTE SIMULÉE',stopHit:'STOP-LOSS NET ATTEINT — VENTE SIMULÉE',manualClose:'FERMER LA POSITION DÉMO',saved:'Historique enregistré uniquement dans ce navigateur.', synced:'Historique synchronisé avec votre profil Telegram.', loginToSync:'Connectez-vous avec Telegram pour synchroniser l’historique.', loginAgain:'Session Telegram expirée. Reconnectez-vous.', syncError:'Synchronisation indisponible ; copie locale conservée.',rules:'Le P/L net inclut frais DEX et glissement à l’achat et à la vente, plus frais réseau et prioritaires des deux transactions.',cap:'Taille démo limitée à 0,05 SOL. Aucun portefeuille ni ordre réel.',ageUnknown:'inconnu',justNow:'à l’instant',mins:' min',hours:' h',days:' j',needAmount:'La taille doit être supérieure à zéro et inférieure ou égale à 0,05 SOL.',noPair:'Aucune paire SOL actuelle disponible.',buyOk:'Position démo ouverte. Aucune transaction envoyée.',positionLimit:'Une seule position démo ouverte à la fois.',clear:'EFFACER L’HISTORIQUE LOCAL',cleared:'Historique local effacé.',refreshDone:'Flux actualisé.'},
    it: {title:'ZOMBIE SNIPER // DEMO CARTA',intro:'Prova le regole con dati DEX pubblici. Nessun wallet e nessuna transazione.',demo:'SOLO DEMO',refresh:'AGGIORNA TOKEN',loading:'Scansione degli ultimi profili pubblici…',failed:'Feed pubblico temporaneamente non disponibile.',source:'Fonte: WebSocket gratuito PumpPortal per nuovi token/migrazioni e snapshot delle coppie SOL DexScreener; i profili DexScreener sono il fallback. Feed e indicizzazione possono subire ritardi; l’ingresso nel primo minuto non è garantito.',amount:'DIMENSIONE ACQUISTO DEMO (SOL)',target:'OBIETTIVO PROFITTO NETTO (%)',stop:'STOP-LOSS NETTO (%)',network:'FEE RETE / TX (SOL)',priority:'FEE PRIORITARIA / TX (SOL)',dex:'FEE DEX / LATO (%)',slip:'SLIPPAGE / LATO (%)',assumptions:'Ipotesi di costo modificabili, non preventivi live.',candidates:'ULTIMI PROFILI TOKEN SOLANA',noCandidates:'Nessuna coppia SOL idonea trovata.',token:'TOKEN',age:'ETÀ COPPIA',liquidity:'LIQUIDITÀ',price:'PREZZO (SOL)',action:'ACQUISTO DEMO',positions:'POSIZIONI DEMO',noPositions:'Nessuna posizione demo ancora.',open:'APERTA',closed:'CHIUSA',entry:'INGRESSO',current:'ATTUALE',net:'P/L NETTO',targetHit:'OBIETTIVO NETTO RAGGIUNTO — VENDITA SIMULATA',stopHit:'STOP-LOSS NETTO RAGGIUNTO — VENDITA SIMULATA',manualClose:'CHIUDI POSIZIONE DEMO',saved:'Cronologia salvata solo in questo browser.', synced:'Cronologia sincronizzata con il profilo Telegram.', loginToSync:'Accedi con Telegram per sincronizzare la cronologia.', loginAgain:'Sessione Telegram scaduta. Accedi di nuovo.', syncError:'Sincronizzazione non disponibile; copia locale conservata.',rules:'Il P/L netto include fee DEX e slippage su entrambi i lati, oltre alle fee di rete e priorità per entrambe le transazioni.',cap:'Demo limitata a 0,05 SOL. Nessun wallet o ordine reale.',ageUnknown:'sconosciuta',justNow:'adesso',mins:' min fa',hours:' h fa',days:' gg fa',needAmount:'La dimensione deve essere maggiore di zero e non oltre 0,05 SOL.',noPair:'Nessuna coppia SOL attuale disponibile.',buyOk:'Posizione demo aperta. Nessuna transazione inviata.',positionLimit:'Una sola posizione demo aperta alla volta.',clear:'CANCELLA CRONOLOGIA LOCALE',cleared:'Cronologia locale cancellata.',refreshDone:'Feed aggiornato.'},
    ja: {title:'ZOMBIE SNIPER // ペーパーデモ',intro:'公開DEXデータで売買ルールをテストします。ウォレット接続や実取引はありません。',demo:'デモ専用',refresh:'トークン一覧を更新',loading:'最新の公開トークンプロフィールを確認中…',failed:'公開フィードを一時的に取得できません。',source:'出典：PumpPortalの無料新規トークン／移行WebSocketとDexScreenerのSOLペア情報。DexScreener最新プロフィールは代替ソースです。配信やDEXの反映には遅延があり、最初の1分以内の約定は保証されません。',amount:'デモ購入額 (SOL)',target:'純利益目標 (%)',stop:'純損失ストップ (%)',network:'ネットワーク手数料 / TX (SOL)',priority:'優先手数料 / TX (SOL)',dex:'DEX手数料 / 片道 (%)',slip:'スリッページ / 片道 (%)',assumptions:'編集可能な費用仮定です。リアルタイム手数料見積もりではありません。',candidates:'最新のSOLANAトークンプロフィール',noCandidates:'対象となるSOLペアが見つかりません。',token:'トークン',age:'ペア経過時間',liquidity:'流動性',price:'価格 (SOL)',action:'デモ購入',positions:'デモポジション',noPositions:'デモポジションはまだありません。',open:'保有中',closed:'終了',entry:'購入時',current:'現在',net:'純損益',targetHit:'純利益目標達成 — 模擬売却',stopHit:'ストップ到達 — 模擬売却',manualClose:'デモポジションを終了',saved:'履歴はこのブラウザー内にのみ保存されます。', synced:'Telegramプロフィールとデモ履歴を同期しました。', loginToSync:'Telegramにログインするとデモ履歴を同期できます。', loginAgain:'Telegramセッションの期限が切れました。再ログインしてください。', syncError:'同期できません。ローカルコピーは保存されています。',rules:'純損益には往復のDEX手数料、スリッページ、ネットワーク・優先手数料を含みます。',cap:'デモ購入額は0.05 SOL以下。ウォレット作成・実取引なし。',ageUnknown:'不明',justNow:'たった今',mins:'分前',hours:'時間前',days:'日前',needAmount:'購入額は0より大きく0.05 SOL以下にしてください。',noPair:'現在のSOLペアがありません。',buyOk:'デモポジションを開始しました。取引は送信されていません。',positionLimit:'同時に保有できるデモポジションは1つです。',clear:'ローカル履歴を消去',cleared:'ローカル履歴を消去しました。',refreshDone:'フィードを更新しました。'},
    'zh-CN': {title:'ZOMBIE SNIPER // 模拟演练',intro:'使用公开DEX行情测试买卖规则。不连接钱包，不发送真实交易。',demo:'仅限模拟',refresh:'刷新代币列表',loading:'正在扫描最新公开代币资料…',failed:'公开数据暂时不可用，请稍后再试。',source:'来源：PumpPortal免费新代币/迁移WebSocket及DexScreener的SOL交易对快照；DexScreener最新资料作为备用。数据推送和DEX索引可能延迟，不能保证在首分钟内成交。',amount:'模拟买入金额 (SOL)',target:'净利润目标 (%)',stop:'净止损 (%)',network:'网络费 / 每笔 (SOL)',priority:'优先费 / 每笔 (SOL)',dex:'DEX费用 / 单边 (%)',slip:'滑点 / 单边 (%)',assumptions:'可编辑的成本假设，不是实时交易费用报价。',candidates:'最新SOLANA代币资料',noCandidates:'未找到符合条件的SOL交易对。',token:'代币',age:'交易对年龄',liquidity:'流动性',price:'价格 (SOL)',action:'模拟买入',positions:'模拟持仓',noPositions:'暂无模拟持仓。',open:'持有中',closed:'已关闭',entry:'买入价',current:'当前价',net:'净盈亏',targetHit:'达到净利润目标 — 模拟卖出',stopHit:'达到净止损 — 模拟卖出',manualClose:'关闭模拟持仓',saved:'模拟记录仅保存在此浏览器中。', synced:'模拟记录已同步到Telegram幸存者档案。', loginToSync:'登录Telegram以同步模拟记录。', loginAgain:'Telegram会话已过期，请重新登录。', syncError:'暂时无法同步；本地副本已保留。',rules:'净盈亏包含买卖两边的DEX费用和滑点，以及两笔交易的网络费和优先费。',cap:'模拟金额上限0.05 SOL。不创建钱包，不进行真实交易。',ageUnknown:'未知',justNow:'刚刚',mins:'分钟前',hours:'小时前',days:'天前',needAmount:'模拟金额必须大于0且不超过0.05 SOL。',noPair:'当前没有可用的SOL交易对。',buyOk:'模拟持仓已开启。未发送交易。',positionLimit:'同时只允许一个模拟持仓。',clear:'清除本地模拟记录',cleared:'本地模拟记录已清除。',refreshDone:'列表已刷新。'},
    tr: {title:'ZOMBIE SNIPER // DEMO',intro:'Herkese açık DEX verileriyle giriş/çıkış kurallarını test edin. Cüzdan bağlanmaz, işlem gönderilmez.',demo:'SADECE DEMO',refresh:'TOKEN AKIŞINI YENİLE',loading:'En yeni herkese açık token profilleri taranıyor…',failed:'Herkese açık akış geçici olarak kullanılamıyor.',source:'Kaynak: PumpPortal ücretsiz yeni token/geçiş WebSocket akışı ve DexScreener SOL paritesi anlık görüntüleri; DexScreener profilleri yedek kaynaktır. Akış ve indeksleme gecikebilir; ilk dakika içinde giriş garanti edilmez.',amount:'DEMO ALIM MİKTARI (SOL)',target:'NET KÂR HEDEFİ (%)',stop:'NET ZARAR DURDUR (%)',network:'AĞ ÜCRETİ / TX (SOL)',priority:'ÖNCELİK ÜCRETİ / TX (SOL)',dex:'DEX ÜCRETİ / TARAF (%)',slip:'KAYMA / TARAF (%)',assumptions:'Düzenlenebilir maliyet varsayımları; canlı ücret teklifi değildir.',candidates:'SON SOLANA TOKEN PROFİLLERİ',noCandidates:'Uygun SOL paritesi bulunamadı.',token:'TOKEN',age:'PARİTE YAŞI',liquidity:'LİKİDİTE',price:'FİYAT (SOL)',action:'DEMO ALIM',positions:'DEMO POZİSYONLARI',noPositions:'Henüz demo pozisyonu yok.',open:'AÇIK',closed:'KAPALI',entry:'GİRİŞ',current:'GÜNCEL',net:'NET K/Z',targetHit:'NET HEDEFE ULAŞILDI — SİMÜLE SATIŞ',stopHit:'STOP-LOSS TETİKLENDİ — SİMÜLE SATIŞ',manualClose:'DEMO POZİSYONUNU KAPAT',saved:'Demo geçmişi yalnızca bu tarayıcıda saklanır.', synced:'Demo geçmişi Telegram profilinizle eşitlendi.', loginToSync:'Demo geçmişini eşitlemek için Telegram ile giriş yapın.', loginAgain:'Telegram oturumunun süresi doldu. Yeniden giriş yapın.', syncError:'Eşitleme kullanılamıyor; yerel kopya korundu.',rules:'Net K/Z; iki yönlü DEX ücreti ve kaymayı, ayrıca iki işlem için ağ ve öncelik ücretlerini içerir.',cap:'Demo işlem limiti 0,05 SOL. Cüzdan ve gerçek işlem yok.',ageUnknown:'bilinmiyor',justNow:'şimdi',mins:' dk önce',hours:' sa önce',days:' gün önce',needAmount:'Miktar sıfırdan büyük ve 0,05 SOL veya daha az olmalı.',noPair:'Güncel SOL paritesi bulunmuyor.',buyOk:'Demo pozisyonu açıldı. İşlem gönderilmedi.',positionLimit:'Aynı anda yalnızca bir açık demo pozisyonu olabilir.',clear:'YEREL DEMO GEÇMİŞİNİ TEMİZLE',cleared:'Yerel demo geçmişi temizlendi.'},
    hi: {title:'ZOMBIE SNIPER // डेमो मोड',intro:'सार्वजनिक DEX डेटा पर एंट्री और एग्ज़िट नियम जाँचें। वॉलेट कनेक्ट नहीं होता और कोई असली लेनदेन नहीं भेजा जाता।',demo:'केवल डेमो',refresh:'टोकन फ़ीड रीफ़्रेश करें',loading:'नवीनतम सार्वजनिक टोकन प्रोफ़ाइल स्कैन हो रही हैं…',failed:'सार्वजनिक फ़ीड अस्थायी रूप से उपलब्ध नहीं है।',source:'स्रोत: PumpPortal की मुफ़्त नए-टोकन/माइग्रेशन WebSocket फ़ीड और DexScreener SOL-पेयर स्नैपशॉट; DexScreener प्रोफ़ाइल बैकअप स्रोत हैं। फ़ीड और इंडेक्सिंग में देरी हो सकती है; पहले मिनट में एंट्री की गारंटी नहीं।',amount:'डेमो खरीद राशि (SOL)',target:'शुद्ध लाभ लक्ष्य (%)',stop:'शुद्ध स्टॉप-लॉस (%)',network:'नेटवर्क शुल्क / TX (SOL)',priority:'प्रायोरिटी शुल्क / TX (SOL)',dex:'DEX शुल्क / पक्ष (%)',slip:'स्लिपेज / पक्ष (%)',assumptions:'बदलने योग्य लागत अनुमान; लाइव शुल्क कोट नहीं।',candidates:'नवीनतम SOLANA टोकन प्रोफ़ाइल',noCandidates:'उपयुक्त SOL पेयर नहीं मिला।',token:'टोकन',age:'पेयर आयु',liquidity:'लिक्विडिटी',price:'कीमत (SOL)',action:'डेमो खरीद',positions:'डेमो पोज़िशन',noPositions:'अभी कोई डेमो पोज़िशन नहीं।',open:'खुली',closed:'बंद',entry:'एंट्री',current:'वर्तमान',net:'शुद्ध P/L',targetHit:'शुद्ध लक्ष्य पूरा — सिम्युलेटेड बिक्री',stopHit:'स्टॉप-लॉस पूरा — सिम्युलेटेड बिक्री',manualClose:'डेमो पोज़िशन बंद करें',saved:'डेमो इतिहास केवल इसी ब्राउज़र में सहेजा जाता है।', synced:'डेमो इतिहास Telegram प्रोफ़ाइल से सिंक हो गया।', loginToSync:'डेमो इतिहास सिंक करने के लिए Telegram से लॉग इन करें।', loginAgain:'Telegram सत्र समाप्त हो गया। फिर से लॉग इन करें।', syncError:'सिंक उपलब्ध नहीं है; स्थानीय कॉपी सुरक्षित है।',rules:'शुद्ध P/L में दोनों तरफ़ के DEX शुल्क और स्लिपेज तथा दोनों लेनदेन के नेटवर्क और प्रायोरिटी शुल्क शामिल हैं।',cap:'डेमो सीमा 0.05 SOL। कोई वॉलेट या वास्तविक ट्रेड नहीं।',ageUnknown:'अज्ञात',justNow:'अभी',mins:' मिनट पहले',hours:' घंटे पहले',days:' दिन पहले',needAmount:'राशि शून्य से अधिक और 0.05 SOL से अधिक नहीं होनी चाहिए।',noPair:'वर्तमान SOL पेयर उपलब्ध नहीं है।',buyOk:'डेमो पोज़िशन खुली। कोई लेनदेन नहीं भेजा गया।',positionLimit:'एक समय में केवल एक खुली डेमो पोज़िशन।',clear:'स्थानीय डेमो इतिहास साफ़ करें',cleared:'स्थानीय डेमो इतिहास साफ़ किया गया।'}
  };

  const $ = id => document.getElementById(id);
  const state = { lang:'en', candidates:[], positions:[], timer:null, positionTimer:null, busy:false, syncStatusKey:'saved' };
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
      state.positions = Array.isArray(value.positions) ? value.positions.slice(0,20).map(p=>({...p,_ownerTelegramId:telegramId()||'guest'})) : [];
    } catch (_) { state.positions = []; }
  }
  function saveStore(){
    try { localStorage.setItem(storageKey(), JSON.stringify({positions:state.positions.slice(0,20),savedAt:Date.now()})); } catch (_) {}
  }
  function updateSyncStatus(key){state.syncStatusKey=key;const node=document.querySelector('.sniper-demo [data-sniper-i18n="saved"]');if(node)node.textContent=t(key);}
  function makeUuid(){if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16);});}
  function mapServerPosition(p){return {id:String(p.id),address:String(p.mint),symbol:String(p.symbol||'TOKEN'),name:String(p.name||''),buySol:Number(p.buySol),entryPrice:Number(p.entryPrice),lastPrice:Number(p.lastPrice),quantity:Number(p.quantity),netPnl:Number(p.netPnl||0),netPct:Number(p.netPct||0),status:p.status==='closed'?'closed':'open',exitReason:p.exitReason||null,openedAt:Number(p.openedAt)||Date.now(),closedAt:p.closedAt?Number(p.closedAt):null,_ownerTelegramId:telegramId()};}
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
    if(!token)return true; // Guest demo remains local-only.
    try{
      const response=await fetch(AUTH_API+'/api/sniper/settings',{
        method:'POST',
        headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
        body:JSON.stringify({
          enabled:!!enabled,mode:'paper',
          paperCapitalSol:Number($('sniper-capital')&&$('sniper-capital').value)||10,
          maxTradeSol:Math.min(0.05,Number($('sniper-size')&&$('sniper-size').value)||0.05),
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
      window.alert(state.lang==='ru'?'Не удалось связаться с серверным демо-снайпером.':'Could not reach the server paper engine.');
      return false;
    }
  }

  async function refreshWalletInfo(){
    const panel=$('zs-wallet-panel');if(!panel)return;
    panel.replaceChildren();
    const title=dashNode('strong','',state.lang==='ru'?'ВАШ SOLANA-КОШЕЛЁК':'YOUR SOLANA WALLET');
    panel.append(title);
    const token=authToken();
    if(!token){
      panel.append(dashNode('small','',state.lang==='ru'?'Войдите через Telegram — для профиля будет создан отдельный кошелёк.':'Sign in with Telegram to create your dedicated wallet.'));
      return;
    }
    try{
      const response=await fetch(AUTH_API+'/api/sniper/wallet',{headers:{'Authorization':'Bearer '+token},cache:'no-store'});
      if(!response.ok)throw new Error('wallet lookup '+response.status);
      const data=await response.json(),wallet=data.wallet;
      if(data.trading&&data.trading.mode==='paper'){
        const serverEnabled=!!data.trading.enabled;
        if(terminal.auto!==serverEnabled){terminal.auto=serverEnabled;saveTerminal();renderDashboardState();}
      }
      if(!wallet||!wallet.publicKey){
        panel.append(dashNode('small','',state.lang==='ru'?'Кошелёк создаётся или временно недоступен.':'Wallet is provisioning or temporarily unavailable.'));
        return;
      }
      const address=String(wallet.publicKey);
      const line=dashNode('code','zs-wallet-address',address.slice(0,8)+'…'+address.slice(-8));
      line.title=address;
      const copy=dashNode('button','zs-copy-address',state.lang==='ru'?'КОПИРОВАТЬ':'COPY');
      copy.type='button';
      copy.addEventListener('click',async()=>{
        try{await navigator.clipboard.writeText(address);copy.textContent=state.lang==='ru'?'СКОПИРОВАНО':'COPIED';}
        catch(_){copy.textContent=state.lang==='ru'?'ОШИБКА':'FAILED';}
      });
      panel.append(line,copy,dashNode('small','',state.lang==='ru'?'Ключ хранится в защищённом хранилище. В демо-режиме средства не используются.':'Private key is held in protected server storage. Paper mode never uses wallet funds.'));
    }catch(_){
      panel.append(dashNode('small','',state.lang==='ru'?'Не удалось загрузить адрес кошелька.':'Could not load wallet address.'));
    }
  }

  async function syncFromServer(){
    const token=authToken(),accountId=telegramId();if(!token||!accountId){updateSyncStatus('loginToSync');refreshWalletInfo();return;}
    try{
      const response=await fetch(AUTH_API+'/api/sniper/paper',{headers:{'Authorization':'Bearer '+token},cache:'no-store'});
      if(telegramId()!==accountId||authToken()!==token)return;
      if(response.status===401){updateSyncStatus('loginAgain');return;}
      if(!response.ok){updateSyncStatus('syncError');return;}
      const data=await response.json();
      if(telegramId()!==accountId||authToken()!==token)return;
      const remote=Array.isArray(data.positions)?data.positions.map(mapServerPosition):[];
      if(remote.length){state.positions=remote;saveStore();renderPositions();}
      else if(state.positions.length){for(const p of state.positions)await persistPosition(p);}
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
    const token=authToken(),accountId=telegramId();if(!token||!accountId)return;
    try{const response=await fetch(AUTH_API+'/api/sniper/paper/clear',{method:'POST',headers:{'Authorization':'Bearer '+token},cache:'no-store'});if(telegramId()!==accountId||authToken()!==token)return;if(!response.ok)updateSyncStatus(response.status===401?'loginAgain':'syncError');else updateSyncStatus('synced');}catch(_){if(telegramId()===accountId&&authToken()===token)updateSyncStatus('syncError');}
  }
  function setText(id,key){ const el=$(id); if(el) el.textContent=t(key); }
  function translate(){
    detectLang();
    document.querySelectorAll('[data-sniper-i18n]').forEach(el=>{el.textContent=t(el.dataset.sniperI18n);});
    document.querySelectorAll('[data-sniper-placeholder]').forEach(el=>{el.placeholder=t(el.dataset.sniperPlaceholder);});
    renderCandidates(); renderPositions();updateSyncStatus(state.syncStatusKey||'saved');
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
    if(!state.candidates.length){
      host.append(make('p','sniper-muted',state.busy?t('loading'):t('noCandidates')));
      return;
    }
    state.candidates.forEach(item=>{
      const row=make('div','sniper-candidate');
      const main=make('div','sniper-candidate-main');
      main.append(make('strong','sniper-token-name',item.symbol+' · '+item.name));
      const age=item.eventAt||item.pairCreatedAt;
      const sourceLabel=item.source==='pumpportal'?' · '+t('liveTag'):' · DEX PROFILE';
      main.append(make('small','sniper-muted',item.address.slice(0,5)+'…'+item.address.slice(-5)+' · '+ageLabel(age)+sourceLabel));
      const stats=make('div','sniper-candidate-stats');
      if(item.source==='pumpportal'){
        const m=item.firstMinute||{};
        stats.append(make('span','','BUY '+Number(m.buyCount||0)+' / SELL '+Number(m.sellCount||0)));
        stats.append(make('span','','NET '+fmt(m.netSol||0,4)+' SOL'));
        stats.append(make('span','','MOVE '+(m.priceChangePct==null?'—':fmt(m.priceChangePct,2)+'%')));
        stats.append(make('span','',t('price')+': '+(item.priceNative>0?fmt(item.priceNative,9):t('waitingForPool'))+' SOL'));
      }else{
        stats.append(make('span','',t('liquidity')+': USD '+fmt(item.liquidityUsd,0)));
        stats.append(make('span','',t('price')+': '+(item.priceNative>0?fmt(item.priceNative,9):t('waitingForPool'))));
      }
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
  function renderPositions(){
    const host=$('sniper-positions');if(!host)return;
    host.replaceChildren();
    if(!state.positions.length){host.append(make('p','sniper-muted',t('noPositions')));renderStats();return;}
    state.positions.slice().sort((a,b)=>{if(a.status!==b.status)return a.status==='open'?-1:1;return Number(b.openedAt||0)-Number(a.openedAt||0);}).forEach(p=>{
      const row=make('article','sniper-position zs-position-card');
      const head=make('div','zs-position-topline');
      const identity=make('div','zs-position-identity');
      identity.append(make('strong','zs-position-symbol',String(p.symbol||'TOKEN').toUpperCase()));
      identity.append(make('span','zs-position-status '+(p.status==='open'?'is-open':'is-closed'),p.status==='open'?(state.lang==='ru'?'ОТКРЫТА':'OPEN'):(state.lang==='ru'?'ЗАКРЫТА':'CLOSED')));
      const pnl=make('strong','zs-position-pnl '+(Number(p.netPnl)>=0?'is-positive':'is-negative'),(p.netPnl>=0?'+':'')+fmt(p.netPnl||0,6)+' SOL');
      head.append(identity,pnl);
      const detail=make('div','zs-position-metrics');
      const metric=(label,value)=>{const cell=make('div','zs-position-metric');cell.append(make('small','',label),make('strong','',value));detail.append(cell);};
      metric(state.lang==='ru'?'ВХОД':'ENTRY',fmt(p.entryPrice,9)+' SOL');
      metric(state.lang==='ru'?'ТЕКУЩАЯ':'CURRENT',fmt(p.lastPrice||p.entryPrice,9)+' SOL');
      metric('NET P/L',fmt(p.netPct||0,2)+'%');
      const contract=make('div','zs-position-contract');
      const contractLabel=make('small','',state.lang==='ru'?'КОНТРАКТ':'CONTRACT');
      const address=String(p.address||'');
      const addressText=make('code','zs-position-address',address?address.slice(0,7)+'…'+address.slice(-7):(state.lang==='ru'?'Адрес недоступен':'Address unavailable'));
      const copyBtn=make('button','zs-copy-address',state.lang==='ru'?'КОПИРОВАТЬ':'COPY');
      copyBtn.type='button';copyBtn.disabled=!address;copyBtn.addEventListener('click',async()=>{
        try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(address);else{const temp=document.createElement('textarea');temp.value=address;temp.style.position='fixed';temp.style.opacity='0';document.body.append(temp);temp.select();document.execCommand('copy');temp.remove();}
          copyBtn.textContent=state.lang==='ru'?'СКОПИРОВАНО':'COPIED';window.setTimeout(()=>{copyBtn.textContent=state.lang==='ru'?'КОПИРОВАТЬ':'COPY';},1300);
        }catch(_){copyBtn.textContent=state.lang==='ru'?'ОШИБКА':'FAILED';}
      });
      contract.append(contractLabel,addressText,copyBtn);
      const graph=make('div','zs-position-chart');graph.append(sparkline(p.priceHistory&&p.priceHistory.length?p.priceHistory:[p.entryPrice,p.lastPrice||p.entryPrice]));
      row.append(head,detail,contract,graph);
      if(p.status==='open'){const close=make('button','sniper-action sniper-close zs-position-close',dcopy().close||t('manualClose'));close.type='button';close.addEventListener('click',()=>closePaper(p.id,'manual'));row.append(close);}
      else if(p.exitReason){const reasons={stagnant:state.lang==='ru'?'Нет движения более минуты · переход к следующему запуску':'No movement · rotated to next launch',target:t('targetHit'),stop:t('stopHit')};row.append(make('small','zs-position-reason',reasons[p.exitReason]||t('closed')));}
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
  async function refreshFeed(){
    if(state.busy)return;
    state.busy=true;renderCandidates();
    try{
      const liveResponse=await fetch(AUTH_API+'/api/sniper/launches?limit=30',{cache:'no-store'});
      if(!liveResponse.ok)throw new Error('launch stream '+liveResponse.status);
      const liveData=await liveResponse.json();
      const feed=liveData.feed||{};
      const launches=Array.isArray(liveData.launches)?liveData.launches:[];
      const now=Date.now();
      state.candidates=launches.map(launch=>{
        const address=String(launch.mint||'');
        const firstMinute=launch.firstMinute||{};
        const curvePrice=Number(firstMinute.lastPriceSol)>0
          ? Number(firstMinute.lastPriceSol)
          : (Number(launch.vSolInBondingCurve)>0&&Number(launch.vTokensInBondingCurve)>0
            ? Number(launch.vSolInBondingCurve)/Number(launch.vTokensInBondingCurve) : 0);
        const eventAt=Number(launch.eventAt)||Number(launch.receivedAt)||0;
        return {address,name:launch.name||'New launch',symbol:launch.symbol||'TOKEN',
          priceNative:curvePrice,liquidityUsd:0,pairCreatedAt:eventAt,eventAt,firstMinute,
          url:'https://pump.fun/coin/'+encodeURIComponent(address),source:'pumpportal',
          status:launch.status||'detected',tradeStreamingEnabled:!!feed.tradeStreamingEnabled};
      }).filter(item=>item.address&&item.eventAt&&now-item.eventAt>=0&&now-item.eventAt<=10*60*1000).slice(0,12);
      if(state.candidates.length){
        $('sniper-feed-status').textContent=feed.connected
          ? (feed.tradeStreamingEnabled?'LIVE MINT + BONDING-CURVE TRADES':'MINT STREAM CONNECTED · TRADE API KEY REQUIRED')
          : 'LAUNCH STREAM OFFLINE';
      }else{
        $('sniper-feed-status').textContent=feed.tradeStreamingEnabled?'WAITING FOR NEW MINTS':'TRADE STREAM REQUIRES PUMPPORTAL API KEY';
      }
    }catch(_){
      // DEX profiles are display-only fallback; they cannot trigger automatic first-minute entry.
      try{
        const r=await fetch(API+'/token-profiles/latest/v1',{cache:'no-store'});
        if(!r.ok)throw new Error('profile feed '+r.status);
        const profiles=await r.json();
        const list=(Array.isArray(profiles)?profiles:[]).filter(x=>x&&x.chainId==='solana'&&x.tokenAddress&&x.tokenAddress!==OFFICIAL_MINT).slice(0,8);
        const resolved=await Promise.allSettled(list.map(async profile=>{
          const pair=await fetchPairs(profile.tokenAddress);if(!pair)return null;
          return {address:profile.tokenAddress,name:pair.baseToken.name||'Unknown',symbol:pair.baseToken.symbol||'TOKEN',
            priceNative:Number(pair.priceNative),liquidityUsd:Number(pair.liquidity&&pair.liquidity.usd)||0,
            pairCreatedAt:Number(pair.pairCreatedAt)||0,eventAt:0,firstMinute:null,source:'dexscreener',
            url:'https://dexscreener.com/solana/'+encodeURIComponent(profile.tokenAddress)};
        }));
        state.candidates=resolved.filter(x=>x.status==='fulfilled'&&x.value).map(x=>x.value).slice(0,8);
        $('sniper-feed-status').textContent=state.candidates.length?'DEXSCREENER DISPLAY FALLBACK · AUTO ENTRY DISABLED':t('failed');
      }catch(__){state.candidates=[];$('sniper-feed-status').textContent=t('failed');}
    }finally{state.busy=false;renderCandidates();}
  }
  function openPaper(item,automatic){
    if(state.positions.some(p=>p.status==='open')){if(!automatic)alert(t('positionLimit'));return;}
    const buySol=Number($('sniper-size').value);
    const maxTrade=Math.max(0.001,Math.min(10,Number($('sniper-max-size')&&$('sniper-max-size').value)||0.05));if(!Number.isFinite(buySol)||buySol<=0||buySol>maxTrade){if(!automatic)alert(state.lang==='ru'?'Размер сделки должен быть больше нуля и не превышать установленный максимум.':'Trade size must be positive and within your configured maximum.');return;}
    if(!item||!Number.isFinite(item.priceNative)||item.priceNative<=0){if(!automatic)alert(t('noPair'));return;}
    if(item.source!=='pumpportal'&&Number(item.liquidityUsd||0)<Number(terminal.minLiquidity||0)){if(!automatic)alert(state.lang==='ru'?'Ликвидность ниже установленного минимума.':'Token liquidity is below your configured minimum.');return;}
    const c=getCosts();
    const closed=state.positions.filter(x=>x.status==='closed').reduce((a,x)=>a+(Number(x.netPnl)||0),0);
    const used=state.positions.filter(x=>x.status==='open').reduce((a,x)=>a+(Number(x.buySol)||0),0);
    if(buySol+used>Number(terminal.capital||10)+closed){if(!automatic)alert(state.lang==='ru'?'Недостаточно виртуального баланса.':'Insufficient virtual balance.');return;}
    const quantity=buySol*(1-c.dex)*(1-c.slip)/item.priceNative;
    const now=Date.now();const p={id:makeUuid(),address:item.address,symbol:item.symbol,name:item.name,buySol,entryPrice:item.priceNative,lastPrice:item.priceNative,lastObservedPrice:item.priceNative,lastMovementAt:now,lastQuoteAt:now,quantity,openedAt:now,status:'open',netPnl:0,netPct:0,exitReason:null,priceHistory:[item.priceNative],source:item.source||'manual',_ownerTelegramId:telegramId()||'guest'};
    state.positions.push(p);saveStore();renderPositions();renderStats();persistPosition(p);logEvent('BUY',item.symbol,(automatic?'Auto demo entry':'Manual demo entry')+' · '+fmt(buySol,4)+' SOL');if(!automatic)alert(t('buyOk'));
  }
  function closePaper(id,reason){
    const p=state.positions.find(x=>x.id===id&&x.status==='open');if(!p)return;
    const m=metrics(p,p.lastPrice||p.entryPrice);
    p.status='closed';p.closedAt=Date.now();p.netPnl=m.net;p.netPct=m.pct;p.exitReason=reason;
    saveStore();renderPositions();renderStats();persistPosition(p);logEvent('SELL',p.symbol,'Manual demo close · '+fmt(m.pct,2)+'%');
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
        if(m.pct>=target){p.status='closed';p.closedAt=now;p.exitReason='target';logEvent('SELL',p.symbol,'Net target reached · '+fmt(m.pct,2)+'%');rotated=true;}
        else if(stop>0&&m.pct<=-stop){p.status='closed';p.closedAt=now;p.exitReason='stop';logEvent('SELL',p.symbol,'Net stop-loss reached · '+fmt(m.pct,2)+'%');rotated=true;}
        else if(now-Number(p.lastMovementAt||p.openedAt)>=idleSeconds*1000){
          p.status='closed';p.closedAt=now;p.exitReason='stagnant';
          logEvent('ROTATE',p.symbol,'No price movement ≥ '+threshold+'% for '+idleSeconds+'s; moving to next launch');rotated=true;
        }
      }catch(_){}
    }
    saveStore();renderPositions();renderStats();
    for(const p of open)await persistPosition(p);
    if(rotated&&terminal.auto){terminal.lastAuto=0;maybeAutoEnter();}
  }

  const DASH_COPY = {
    en:{nav:['Sniper','Stats','History','Settings','Help'],balance:'Virtual balance',profit:'Total P/L',trades:'Trades',wins:'Win rate',active:'Open positions',settings:'SIMULATION SETTINGS',capital:'Starting capital (SOL)',minliq:'DEX fallback liquidity only (USD)',maxsize:'Maximum trade size (SOL)',autopilot:'AUTO SNIPER',armed:'AUTOSNIPER ACTIVE',paused:'AUTOSNIPER PAUSED',start:'START',pause:'PAUSE',stop:'STOP',launches:'LIVE LAUNCH FEED',journal:'SYSTEM LOG',empty:'No events yet',chart:'POSITION PERFORMANCE',demo:'DEMO MODE · PAPER TRADING',hint:'All settings are virtual and editable. No wallet or real transactions.',open:'OPEN',closed:'CLOSED',entry:'Entry',current:'Current',net:'Net',close:'Close demo position'},
    ru:{nav:['Снайпер','Статистика','История','Настройки','Помощь'],balance:'Виртуальный баланс',profit:'Общий P/L',trades:'Сделки',wins:'Успешных',active:'Активные позиции',settings:'ПАРАМЕТРЫ СИМУЛЯЦИИ',capital:'Стартовый капитал (SOL)',minliq:'Ликвидность только для DEX fallback (USD)',maxsize:'Макс. размер сделки (SOL)',autopilot:'АВТОСНАЙПЕР',armed:'АВТОСНАЙПЕР АКТИВЕН',paused:'АВТОСНАЙПЕР НА ПАУЗЕ',start:'ЗАПУСТИТЬ',pause:'ПАУЗА',stop:'СТОП',launches:'ЛЕНТА ЗАПУСКОВ LIVE',journal:'ЖУРНАЛ СИСТЕМЫ',empty:'Событий пока нет',chart:'ДИНАМИКА ПОЗИЦИИ',demo:'ДЕМО-РЕЖИМ · PAPER TRADING',hint:'Все параметры виртуальные и редактируемые. Без кошелька и реальных транзакций.',open:'ОТКРЫТА',closed:'ЗАКРЫТА',entry:'Вход',current:'Сейчас',net:'Чистый P/L',close:'Закрыть демо-позицию'},
    de:{nav:['Sniper','Statistik','Verlauf','Einstellungen','Hilfe'],balance:'Virtuelles Guthaben',profit:'Gesamt-P/L',trades:'Trades',wins:'Erfolgsquote',active:'Offene Positionen',settings:'SIMULATIONSEINSTELLUNGEN',capital:'Startkapital (SOL)',minliq:'Mindestliquidität (USD)',maxsize:'Maximale Handelsgröße (SOL)',autopilot:'AUTO-SNIPER',armed:'AUTO-SNIPER AKTIV',paused:'AUTO-SNIPER PAUSIERT',start:'START',pause:'PAUSE',stop:'STOPP',launches:'LIVE TOKEN-STARTS',journal:'SYSTEMPROTOKOLL',empty:'Noch keine Ereignisse',chart:'POSITIONSVERLAUF',demo:'DEMO-MODUS · PAPER TRADING',hint:'Alle Werte sind virtuell und editierbar. Keine Wallet oder echten Transaktionen.',open:'OFFEN',closed:'GESCHLOSSEN',entry:'Einstieg',current:'Aktuell',net:'Netto',close:'Demo-Position schließen'},
    fr:{nav:['Sniper','Stats','Historique','Réglages','Aide'],balance:'Solde virtuel',profit:'P/L total',trades:'Transactions',wins:'Taux de réussite',active:'Positions ouvertes',settings:'PARAMÈTRES DE SIMULATION',capital:'Capital initial (SOL)',minliq:'Liquidité minimale (USD)',maxsize:'Taille maximale de transaction (SOL)',autopilot:'AUTO-SNIPER',armed:'AUTO-SNIPER ACTIF',paused:'AUTO-SNIPER EN PAUSE',start:'DÉMARRER',pause:'PAUSE',stop:'ARRÊTER',launches:'NOUVEAUX TOKENS LIVE',journal:'JOURNAL SYSTÈME',empty:'Aucun événement',chart:'PERFORMANCE',demo:'MODE DÉMO · PAPER TRADING',hint:'Tous les paramètres sont virtuels et modifiables. Aucun portefeuille ni transaction réelle.',open:'OUVERTE',closed:'FERMÉE',entry:'Entrée',current:'Actuel',net:'Net',close:'Fermer la position démo'},
    it:{nav:['Sniper','Statistiche','Cronologia','Impostazioni','Aiuto'],balance:'Saldo virtuale',profit:'P/L totale',trades:'Operazioni',wins:'Successi',active:'Posizioni aperte',settings:'PARAMETRI SIMULAZIONE',capital:'Capitale iniziale (SOL)',minliq:'Liquidità minima (USD)',maxsize:'Dimensione massima operazione (SOL)',autopilot:'AUTO-SNIPER',armed:'AUTO-SNIPER ATTIVO',paused:'AUTO-SNIPER IN PAUSA',start:'AVVIA',pause:'PAUSA',stop:'STOP',launches:'NUOVI TOKEN LIVE',journal:'LOG DI SISTEMA',empty:'Nessun evento',chart:'ANDAMENTO POSIZIONE',demo:'MODALITÀ DEMO · PAPER TRADING',hint:'Tutti i parametri sono virtuali e modificabili. Nessun wallet o trade reale.',open:'APERTA',closed:'CHIUSA',entry:'Ingresso',current:'Attuale',net:'Netto',close:'Chiudi posizione demo'},
    ja:{nav:['スナイパー','統計','履歴','設定','ヘルプ'],balance:'仮想残高',profit:'合計損益',trades:'取引',wins:'勝率',active:'保有ポジション',settings:'シミュレーション設定',capital:'開始資金 (SOL)',minliq:'最低流動性 (USD)',maxsize:'最大交易额 (SOL)',autopilot:'自動スナイパー',armed:'自動スナイパー稼働中',paused:'自動スナイパー一時停止',start:'開始',pause:'一時停止',stop:'停止',launches:'ライブ新規トークン',journal:'システムログ',empty:'イベントはありません',chart:'ポジション推移',demo:'デモモード · PAPER TRADING',hint:'設定はすべて仮想で変更可能。ウォレットや実取引はありません。',open:'保有中',closed:'終了',entry:'購入',current:'現在',net:'純損益',close:'デモポジションを閉じる'},
    'zh-CN':{nav:['狙击','统计','历史','设置','帮助'],balance:'虚拟余额',profit:'总盈亏',trades:'交易',wins:'胜率',active:'当前持仓',settings:'模拟参数',capital:'初始资金 (SOL)',minliq:'最低流动性 (USD)',maxsize:'最大交易额 (SOL)',autopilot:'自动狙击',armed:'自动狙击已启动',paused:'自动狙击已暂停',start:'启动',pause:'暂停',stop:'停止',launches:'实时新币',journal:'系统日志',empty:'暂无事件',chart:'持仓走势',demo:'模拟模式 · PAPER TRADING',hint:'所有参数均为可编辑的虚拟设置，不连接钱包，不进行真实交易。',open:'持有中',closed:'已关闭',entry:'买入',current:'当前',net:'净盈亏',close:'关闭模拟仓位'},
    tr:{nav:['Sniper','İstatistik','Geçmiş','Ayarlar','Yardım'],balance:'Sanal bakiye',profit:'Toplam K/Z',trades:'İşlemler',wins:'Başarı oranı',active:'Açık pozisyonlar',settings:'SİMÜLASYON AYARLARI',capital:'Başlangıç sermayesi (SOL)',minliq:'Minimum likidite (USD)',maxsize:'Maksimum işlem boyutu (SOL)',autopilot:'OTOMATİK SNIPER',armed:'OTOMATİK SNIPER AKTİF',paused:'OTOMATİK SNIPER DURAKLATILDI',start:'BAŞLAT',pause:'DURAKLAT',stop:'DURDUR',launches:'CANLI TOKEN AKIŞI',journal:'SİSTEM GÜNLÜĞÜ',empty:'Henüz olay yok',chart:'POZİSYON GRAFİĞİ',demo:'DEMO MODU · PAPER TRADING',hint:'Tüm ayarlar sanaldır ve düzenlenebilir. Cüzdan veya gerçek işlem yoktur.',open:'AÇIK',closed:'KAPALI',entry:'Giriş',current:'Güncel',net:'Net',close:'Demo pozisyonunu kapat'},
    hi:{nav:['स्नाइपर','आँकड़े','इतिहास','सेटिंग्स','मदद'],balance:'वर्चुअल बैलेंस',profit:'कुल P/L',trades:'ट्रेड',wins:'सफलता दर',active:'खुली पोज़िशन',settings:'सिमुलेशन सेटिंग्स',capital:'शुरुआती पूँजी (SOL)',minliq:'न्यूनतम लिक्विडिटी (USD)',maxsize:'अधिकतम ट्रेड आकार (SOL)',autopilot:'ऑटो स्नाइपर',armed:'ऑटो स्नाइपर सक्रिय',paused:'ऑटो स्नाइपर रुका हुआ',start:'शुरू',pause:'रोकें',stop:'बंद',launches:'लाइव टोकन लॉन्च',journal:'सिस्टम लॉग',empty:'अभी कोई इवेंट नहीं',chart:'पोज़िशन प्रदर्शन',demo:'डेमो मोड · PAPER TRADING',hint:'सभी सेटिंग्स वर्चुअल और संपादन योग्य हैं। कोई वॉलेट या वास्तविक लेनदेन नहीं।',open:'खुली',closed:'बंद',entry:'एंट्री',current:'वर्तमान',net:'नेट',close:'डेमो पोज़िशन बंद करें'}
  };
  const terminal={auto:false,capital:10,minLiquidity:5000,maxTradeSize:0.05,idleTimeout:60,minMovePct:0.2,logs:[],seen:[],lastAuto:0};
  const TERMINAL_KEY='zombcash_sniper_terminal_v1';
  const dcopy=()=>DASH_COPY[state.lang]||DASH_COPY.en;
  function saveTerminal(){try{terminal.settings={};['sniper-size','sniper-target','sniper-stop','sniper-network','sniper-priority','sniper-dex','sniper-slip','sniper-idle-timeout','sniper-min-move'].forEach(id=>{const el=$(id);if(el)terminal.settings[id]=el.value;});localStorage.setItem(TERMINAL_KEY,JSON.stringify(terminal));}catch(_){}}
  function loadTerminal(){try{const v=JSON.parse(localStorage.getItem(TERMINAL_KEY)||'null');if(v&&typeof v==='object'){Object.assign(terminal,v);if(v.settings)Object.keys(v.settings).forEach(id=>{const el=$(id);if(el)el.value=v.settings[id];});}}catch(_){}}
  function logEvent(kind,symbol,detail){terminal.logs.unshift({at:Date.now(),kind,symbol:symbol||'SYSTEM',detail:detail||''});terminal.logs=terminal.logs.slice(0,18);saveTerminal();renderLog();}
  function dashNode(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
  function addRange(field,id,min,max,step){
    const input=$(id);if(!input||!field)return;
    const range=dashNode('input','zs-range');range.type='range';range.min=min;range.max=max;range.step=step;range.value=input.value;
    input.classList.add('zs-number');input.addEventListener('input',()=>{range.value=input.value;saveTerminal();renderStats();});
    range.addEventListener('input',()=>{input.value=range.value;input.dispatchEvent(new Event('change',{bubbles:true}));renderStats();});
    field.append(range,input);
  }
  function addVirtualField(host,id,label,min,max,step,value,range=true){
    const field=dashNode('div','zs-field');const fieldLabel=dashNode('label','',label);if(id==='sniper-capital')fieldLabel.id='zs-capital-label';if(id==='sniper-liquidity')fieldLabel.id='zs-liquidity-label';field.append(fieldLabel);
    const input=dashNode('input','zs-number');input.id=id;input.type='number';input.min=min;input.max=max;input.step=step;input.value=value;
    field.querySelector('label').htmlFor=id;
    if(range){const slider=dashNode('input','zs-range');slider.type='range';slider.min=min;slider.max=max;slider.step=step;slider.value=value;slider.addEventListener('input',()=>{input.value=slider.value;input.dispatchEvent(new Event('change',{bubbles:true}));});input.addEventListener('input',()=>slider.value=input.value);field.append(slider);}
    input.addEventListener('change',()=>{if(id==='sniper-capital')terminal.capital=Math.max(0,Number(input.value)||0);if(id==='sniper-liquidity')terminal.minLiquidity=Math.max(0,Number(input.value)||0);if(id==='sniper-idle-timeout')terminal.idleTimeout=Math.max(15,Number(input.value)||60);if(id==='sniper-min-move')terminal.minMovePct=Math.max(0.05,Number(input.value)||0.2);if(id==='sniper-max-size'){terminal.maxTradeSize=Math.max(0.001,Math.min(10,Number(input.value)||0.05));const size=$('sniper-size');if(size){size.max=terminal.maxTradeSize;const slider=size.parentElement&&size.parentElement.querySelector('.zs-range');if(slider)slider.max=terminal.maxTradeSize;if(Number(size.value)>terminal.maxTradeSize){size.value=terminal.maxTradeSize;if(slider)slider.value=size.value;}}}saveTerminal();renderStats();});
    field.append(input);host.append(field);return field;
  }
  function sparkline(values){
    const nums=(values||[]).filter(v=>Number.isFinite(Number(v))).map(Number);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 180 48');svg.setAttribute('class','zs-spark');svg.setAttribute('role','img');svg.setAttribute('aria-label','Observed token price since simulated entry');
    if(nums.length<2)return svg;
    const lo=Math.min(...nums),hi=Math.max(...nums),span=hi-lo||Math.max(hi*.001,1e-12);
    const points=nums.map((v,i)=>((i/(nums.length-1))*176+2)+','+(44-((v-lo)/span)*38)).join(' ');
    const line=document.createElementNS(svg.namespaceURI,'polyline');line.setAttribute('points',points);line.setAttribute('fill','none');line.setAttribute('stroke',nums[nums.length-1]>=nums[0]?'#00f59a':'#ff4d8d');line.setAttribute('stroke-width','2.2');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');svg.append(line);return svg;
  }
  function renderStats(){
    const host=$('zs-kpis');if(!host)return;
    const total=state.positions.reduce((a,p)=>a+(Number(p.netPnl)||0),0);
    const closed=state.positions.filter(p=>p.status==='closed'),wins=closed.filter(p=>(Number(p.netPnl)||0)>0).length;
    const open=state.positions.filter(p=>p.status==='open'),used=open.reduce((a,p)=>a+(Number(p.buySol)||0),0);
    const available=Math.max(0,Number(terminal.capital||10)+closed.reduce((a,p)=>a+(Number(p.netPnl)||0),0)-used);
    const vals=[[dcopy().balance,available.toFixed(4)+' SOL'],[dcopy().profit,(total>=0?'+':'')+total.toFixed(5)+' SOL'],[dcopy().trades,String(state.positions.length)],[dcopy().wins,closed.length?Math.round(wins/closed.length*100)+'%':'—'],[dcopy().active,String(open.length)]];
    host.replaceChildren();vals.forEach((v,i)=>{const card=dashNode('div','zs-kpi zs-kpi-'+i);card.append(dashNode('small','',v[0]),dashNode('strong','zs-counter',v[1]));host.append(card);});
    const mainChart=$('zs-main-chart');if(mainChart){mainChart.replaceChildren();const p=open[0];mainChart.append(sparkline(p?(p.priceHistory||[p.entryPrice,p.lastPrice||p.entryPrice]):[]));}
    const centerSummary=$('zs-center-summary');if(centerSummary){centerSummary.replaceChildren();const p=open[0];if(p){const left=dashNode('div','zs-center-token');left.append(dashNode('small','',state.lang==='ru'?'ТЕКУЩАЯ ПОЗИЦИЯ':'CURRENT POSITION'),dashNode('strong','',String(p.symbol||'TOKEN').toUpperCase()),dashNode('span','',fmt(p.lastPrice||p.entryPrice,9)+' SOL'));const right=dashNode('div','zs-center-pnl '+((Number(p.netPnl)||0)>=0?'is-positive':'is-negative'));right.append(dashNode('strong','',(p.netPct>=0?'+':'')+fmt(p.netPct||0,2)+'%'),dashNode('span','',(p.netPnl>=0?'+':'')+fmt(p.netPnl||0,6)+' SOL'));centerSummary.append(left,right);}else{centerSummary.append(dashNode('div','zs-center-idle',state.lang==='ru'?'ОЖИДАНИЕ ПОДХОДЯЩЕГО SOL-ПУЛА':'WAITING FOR ELIGIBLE SOL POOL'));}}
    const statGrid=$('zs-stat-grid');if(statGrid){
      const avg=closed.length?closed.reduce((a,p)=>a+(Number(p.netPct)||0),0)/closed.length:0;
      const best=closed.length?Math.max(...closed.map(p=>Number(p.netPct)||0)):0;
      const worst=closed.length?Math.min(...closed.map(p=>Number(p.netPct)||0)):0;
      const realized=closed.reduce((a,p)=>a+(Number(p.netPnl)||0),0);
      const items=[[state.lang==='ru'?'РЕАЛИЗОВАННЫЙ P/L':'REALIZED P/L',(realized>=0?'+':'')+realized.toFixed(5)+' SOL'],[state.lang==='ru'?'СРЕДНИЙ РЕЗУЛЬТАТ':'AVERAGE RESULT',(avg>=0?'+':'')+avg.toFixed(2)+'%'],[state.lang==='ru'?'ЛУЧШАЯ СДЕЛКА':'BEST TRADE',(best>=0?'+':'')+best.toFixed(2)+'%'],[state.lang==='ru'?'ХУДШАЯ СДЕЛКА':'WORST TRADE',worst.toFixed(2)+'%']];
      statGrid.replaceChildren();items.forEach((v,i)=>{const card=dashNode('div','zs-stat-card');card.append(dashNode('small','',v[0]),dashNode('strong',i===3&&worst<0?'zs-negative':'',v[1]));statGrid.append(card);});
    }

  }
  function renderLog(){
    const host=$('zs-log');if(!host)return;host.replaceChildren();
    if(!terminal.logs.length){host.append(dashNode('p','sniper-muted',dcopy().empty));return;}
    terminal.logs.slice(0,12).forEach(e=>{const row=dashNode('div','zs-logrow');row.append(dashNode('time','',new Date(e.at).toLocaleTimeString()),dashNode('b','zs-logkind',e.kind),dashNode('strong','',e.symbol),dashNode('span','',e.detail));host.append(row);});
  }
  function renderDashboardState(){
    const btn=$('zs-auto-toggle');if(btn){btn.classList.toggle('is-on',!!terminal.auto);btn.textContent=terminal.auto?dcopy().armed:dcopy().paused;}
    const nav=document.querySelectorAll('[data-zs-nav]');nav.forEach(b=>{const i=Number(b.dataset.zsNav);if(dcopy().nav[i])b.textContent=dcopy().nav[i];});
    [['zs-settings-title',dcopy().settings],['zs-center-title',dcopy().autopilot],['zs-right-title',dcopy().active],['zs-launch-title',dcopy().launches],['zs-log-title',dcopy().journal],['zs-chart-title',dcopy().chart]].forEach(([id,label])=>{const el=$(id);if(el)el.textContent=label;});
    const capLabel=$('zs-capital-label'),liqLabel=$('zs-liquidity-label');if(capLabel)capLabel.textContent=dcopy().capital;if(liqLabel)liqLabel.textContent=dcopy().minliq;
    renderStats();renderLog();
  }
  function maybeAutoEnter(){
    // Registered users are entered by the persistent server paper engine. Do not
    // create a duplicate browser-side position for the same Mint.
    if(authToken())return;
    if(!terminal.auto||state.positions.some(p=>p.status==='open'))return;
    const now=Date.now();
    const item=state.candidates.find(c=>{
      if(c.source!=='pumpportal'||!c.tradeStreamingEnabled||!(c.priceNative>0)||terminal.seen.includes(c.address))return false;
      const age=now-Number(c.eventAt||0),m=c.firstMinute||{};
      const buys=Number(m.buyCount||0),sells=Number(m.sellCount||0);
      const net=Number(m.netSol||0),move=Number(m.priceChangePct||0);
      return age>=0&&age<=60000&&Number(m.tradeCount||0)>=3&&buys>sells&&net>0&&move>=Math.max(0.05,Number(terminal.minMovePct)||0.2);
    });
    if(!item)return;
    terminal.seen.push(item.address);terminal.seen=terminal.seen.slice(-250);terminal.lastAuto=Date.now();saveTerminal();
    openPaper(item,true);
  }

  async function showLaunchConfirm(){
    const n=id=>Number($(id)&&$(id).value);
    const errors=[];
    if(!(n('sniper-size')>0))errors.push('Размер сделки должен быть больше нуля.');
    if(n('sniper-size')>n('sniper-max-size'))errors.push('Размер сделки выше максимума.');
    if(n('sniper-size')>n('sniper-capital'))errors.push('Размер сделки выше виртуального капитала.');
    if(!(n('sniper-capital')>0))errors.push('Капитал должен быть больше нуля.');
    if(!(n('sniper-target')>0))errors.push('Цель прибыли должна быть больше нуля.');
    if(errors.length){window.alert('Нельзя запустить:\n'+errors.join('\n'));return;}
    const lines=[
      'ПРОВЕРКА ПЕРЕД ЗАПУСКОМ',
      'Капитал: '+n('sniper-capital')+' SOL',
      'Размер сделки: '+n('sniper-size')+' SOL',
      'Take Profit: +'+n('sniper-target')+'%',
      'Stop Loss: -'+n('sniper-stop')+'%',
      
      'DEX / сторона: '+n('sniper-dex')+'%',
      'Проскальзывание / сторона: '+n('sniper-slip')+'%',
      'Сеть / приоритет: '+n('sniper-network')+' / '+n('sniper-priority')+' SOL'
    ];
    if(n('sniper-slip')>5)lines.push('⚠ Проскальзывание выше 5% на сторону.');
    if(n('sniper-dex')>2)lines.push('⚠ Комиссия DEX выше 2% на сторону.');
    if(n('sniper-size')>0.05)lines.push('⚠ Сделка выше стартовой рекомендации 0,05 SOL.');
    
    lines.push('Запустить автоснайпер в ДЕМО-РЕЖИМЕ? Реальных транзакций не будет.');
    if(!window.confirm(lines.join('\n')))return;
    if(!await setServerPaperEnabled(true))return;
    terminal.auto=true;saveTerminal();renderDashboardState();
    logEvent('ARMED','SYSTEM','Подтверждён paper mode · '+n('sniper-size')+' SOL');
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
    function restoreDashboardToPage(){if(rootAnchor.parentNode){rootAnchor.parentNode.insertBefore(root,rootAnchor);rootAnchor.remove();}}loadTerminal();
    const fields=['sniper-size','sniper-target','sniper-stop','sniper-network','sniper-priority','sniper-dex','sniper-slip'].map(id=>$(id)?.closest('.sniper-field')).filter(Boolean);
    const candidates=$('sniper-candidates'),positions=$('sniper-positions'),refresh=$('sniper-refresh'),clear=$('sniper-clear'),status=$('sniper-feed-status');
    const style=dashNode('style','');style.textContent=`.sniper-demo{position:relative;overflow:hidden;border:1px solid #68736d!important;border-radius:8px!important;padding:clamp(12px,1.5vw,20px)!important;background:linear-gradient(145deg,#171c1b,#0b1010 58%,#151a18)!important;box-shadow:0 12px 40px #0008,inset 0 0 0 1px #ffffff08!important;color:#e5e9e4;font-family:Inter,system-ui,sans-serif}
    .zs-head{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:38px;padding:0 0 8px;border-bottom:1px solid #65706855}.zs-brand{font:900 clamp(17px,2vw,25px)/1 system-ui;color:#c3d0c2;letter-spacing:.08em}.zs-title{font:800 clamp(19px,2.5vw,30px)/1 system-ui;color:#e8ece8;letter-spacing:.07em}.zs-demo{border:1px solid #78857b;border-radius:3px;padding:6px 10px;color:#d0d8d0;font:700 10px system-ui;letter-spacing:.08em;background:#202724}
    .zs-head-actions{display:flex;align-items:center;gap:8px}.zs-expand{border:1px solid #718078;border-radius:3px;background:#29312d;color:#eef1ec;padding:8px 12px;font:700 11px system-ui;cursor:pointer}.zs-expand:hover{background:#39443d}
    .zs-nav{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-start;margin:6px 0}.zs-nav button{border:1px solid #515e56;background:#202724;color:#dce2dc;border-radius:3px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer}.zs-nav button.is-active,.zs-nav button[aria-selected=true]{border-color:#b7c8b0;background:#465246;color:#fff;box-shadow:inset 0 -2px #b7c8b0}.zs-tab-hidden{display:none!important}.zs-stats-layout,.zs-single-layout{grid-template-columns:minmax(0,1fr)!important}.zs-stats-layout .zs-center{max-width:none}.zs-stats-layout .zs-core{width:110px;min-height:110px}
    .zs-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin:3px 0 8px}.zs-kpi{min-width:0;padding:8px 11px;border:1px solid #4d5a52;border-radius:4px;background:linear-gradient(135deg,#202724,#141a18)}.zs-kpi small{display:block;color:#aeb8af;font-size:10px;letter-spacing:.04em}.zs-kpi strong{display:block;margin-top:3px;font:800 clamp(15px,1.6vw,21px) system-ui;color:#e7ece6;font-variant-numeric:tabular-nums;transition:color .25s}.zs-kpi-1 strong,.zs-kpi-3 strong{color:#b8d0ad}
    .zs-layout{display:grid;grid-template-columns:minmax(270px,1.02fr) minmax(210px,.78fr) minmax(340px,1.28fr);gap:9px;align-items:stretch;min-height:0;height:100%}.zs-panel{min-width:0;min-height:0;padding:10px 12px;border:1px solid #526057;border-radius:5px;background:linear-gradient(145deg,#1a211e,#101614);box-shadow:inset 0 1px #ffffff08}.zs-panel h3{margin:0 0 7px;color:#c6d0c6;font:800 11px system-ui;letter-spacing:.09em}
    .zs-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3px 10px}.zs-field{display:grid;grid-template-columns:minmax(0,1fr) 76px;gap:3px 7px;align-items:center;padding:4px 0;border-bottom:1px solid #ffffff10;min-width:0}.zs-field label{grid-column:1/-1;color:#c1cac2;font-size:10px;font-weight:650;line-height:1.2}.zs-field .zs-range{grid-column:1;width:100%;accent-color:#9eae9c;min-width:0}.zs-field .zs-number{grid-column:2;width:76px;min-height:27px;padding:4px 6px;border:1px solid #4b5850;border-radius:3px;background:#0d1311;color:#f0f2ee;text-align:right;font:650 11px system-ui}.zs-range{appearance:auto;height:6px}
    .zs-portrait{position:relative;height:92px;border-radius:4px;overflow:hidden;background:#202724;display:flex;align-items:flex-end;justify-content:flex-start;margin-bottom:7px}.zs-portrait img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 25%;filter:grayscale(.72) contrast(1.08) brightness(.7);opacity:.88}.zs-portrait:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#0b100ee8,transparent 70%),linear-gradient(0deg,#0b100eaa,transparent 65%)}.zs-portrait b{z-index:1;margin:0 0 8px 12px;color:#e3e8e1;font:800 11px system-ui;letter-spacing:.12em}
    .zs-core{display:grid;place-items:center;min-height:112px;text-align:center;border:1px solid #758278;border-radius:50%;width:min(100%,142px);aspect-ratio:1;margin:0 auto 7px;background:radial-gradient(circle,#28332d,#101613 68%);box-shadow:inset 0 0 20px #aab9a311}.zs-core strong{display:block;color:#e9eee8;font:800 13px system-ui;letter-spacing:.06em}.zs-core span{display:block;color:#b8d0ad;font-size:11px;font-weight:800}
    .zs-toggle{border:1px solid #82917f;border-radius:3px;background:#29332c;color:#e8eee6;padding:7px 10px;font-weight:800;font-size:11px;cursor:pointer;width:100%;margin:3px 0}.zs-toggle.is-on{background:#71856e;color:#0d140f}.zs-actions{display:flex;gap:6px}.zs-actions button{flex:1;min-height:30px;padding:5px 8px;font-size:10px}
    .zs-chart{width:100%;height:72px;margin-top:5px;border-radius:3px;background:linear-gradient(180deg,#a9b99c12,transparent);border:1px solid #69786b33}
    .zs-right{display:grid;grid-template-rows:auto minmax(0,.85fr) minmax(0,1.15fr);gap:6px}.zs-right>h3{margin:0!important;padding:0 0 4px;border-bottom:1px solid #ffffff18}.zs-launch-panel{min-height:0;overflow:hidden}.zs-positions,.zs-launches{max-height:none;min-height:0;overflow:auto;scrollbar-width:thin;scrollbar-color:#59665c #121816}.zs-launches .sniper-candidate{grid-template-columns:minmax(0,1fr) auto;gap:5px;padding:7px 0}.zs-launches .sniper-candidate-stats{grid-column:1/-1}.zs-launches .sniper-link{display:none}.zs-launches .sniper-action{grid-column:2;grid-row:1}.zs-positions .sniper-position{display:grid;grid-template-columns:1fr auto;gap:5px;padding:8px 0;border-top:1px solid #ffffff16}.zs-position-chart{grid-column:1/-1}.zs-spark{width:100%;height:34px;display:block;background:linear-gradient(180deg,#9db39b0b,transparent);border-radius:3px}
    .zs-log{display:grid;gap:2px;max-height:76px;overflow:auto}.zs-logrow{display:grid;grid-template-columns:65px 68px 82px 1fr;gap:7px;padding:5px 7px;border-top:1px solid #ffffff10;font-size:10px;color:#c9d0c9}.zs-logkind{color:#b8d0ad}.zs-foot{margin:4px 0 0;color:#aeb8af;font-size:10px;line-height:1.35}.zs-hidden{display:none!important}.sniper-demo .sniper-muted{color:#aeb8af!important}.sniper-demo .sniper-action{border-radius:3px!important;background:#a8b79f!important;color:#111812!important;border:1px solid #c2cdbb!important}.sniper-demo .sniper-close{background:transparent!important;border:1px solid #68776c!important;color:#d2dcd2!important}
    .sniper-demo.zs-fullscreen{position:fixed!important;inset:0!important;z-index:2147483600!important;width:100vw!important;height:auto!important;min-height:100vh!important;min-height:100dvh!important;max-height:none!important;box-sizing:border-box!important;margin:0!important;border:0!important;border-radius:0!important;padding:10px 14px!important;overflow:hidden!important;display:grid!important;grid-template-rows:auto auto auto minmax(0,1fr) auto!important;gap:4px!important;background:linear-gradient(145deg,#171c1b,#0b1010 58%,#151a18)!important}
    .zs-fullscreen .zs-head{min-height:34px;padding-bottom:5px}.zs-fullscreen .zs-nav{margin:2px 0}.zs-fullscreen .zs-kpis{margin:1px 0 4px}.zs-fullscreen .zs-layout{height:100%;min-height:0}.zs-fullscreen .zs-panel{padding:8px 10px}.zs-fullscreen .zs-portrait{height:76px}.zs-fullscreen .zs-core{min-height:94px;width:min(100%,118px)}.zs-fullscreen .zs-chart{height:62px}.zs-fullscreen .zs-log{max-height:58px}.zs-fullscreen .zs-foot{font-size:9px;margin:0}.zs-fullscreen>.zs-foot{display:none!important}.zs-fullscreen .zs-field{padding:2px 0}.zs-fullscreen .zs-field .zs-number{min-height:24px}.zs-fullscreen .zs-kpi{padding:6px 9px}
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
    .sniper-demo.zs-fullscreen{position:fixed!important;inset:0!important;width:100vw!important;height:auto!important;min-height:100vh!important;min-height:100dvh!important;max-height:none!important;z-index:2147483600!important;box-sizing:border-box!important;margin:0!important;border:0!important;border-radius:0!important;overflow:hidden!important}
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
    .zs-positions-inner{display:flex!important;flex-direction:column!important;gap:8px!important;padding:4px!important;min-width:0!important}
    .zs-positions .zs-position-card{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:8px!important;width:100%!important;min-width:0!important;box-sizing:border-box!important;padding:12px!important;border:1px solid #536357!important;border-radius:5px!important;background:linear-gradient(135deg,#1c2520,#101714)!important;overflow:hidden!important}
    .zs-positions .zs-position-topline{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;width:100%!important;min-width:0!important}
    .zs-positions .zs-position-identity{display:flex!important;flex-direction:row!important;align-items:center!important;flex-wrap:wrap!important;gap:7px!important;min-width:0!important}
    .zs-positions .zs-position-symbol{display:block!important;position:static!important;max-width:100%!important;font-size:15px!important;line-height:1.25!important;letter-spacing:.04em!important;color:#eef2ec!important;overflow-wrap:anywhere!important}
    .zs-positions .zs-position-status{display:inline-flex!important;align-items:center!important;padding:3px 7px!important;border:1px solid #637464!important;border-radius:3px!important;font-size:9px!important;line-height:1.2!important;letter-spacing:.08em!important;color:#c3d0c0!important;white-space:nowrap!important}
    .zs-positions .zs-position-status.is-open{background:#314233!important;color:#d4e2ce!important}.zs-positions .zs-position-status.is-closed{background:#282d2a!important;color:#b8c0b8!important}
    .zs-positions .zs-position-pnl{display:block!important;position:static!important;flex:0 0 auto!important;text-align:right!important;font-size:15px!important;line-height:1.25!important;font-variant-numeric:tabular-nums!important;white-space:nowrap!important}
    .zs-positions .zs-position-pnl.is-positive{color:#b8d0ad!important}.zs-positions .zs-position-pnl.is-negative{color:#d99b9b!important}
    .zs-positions .zs-position-metrics{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important;width:100%!important;min-width:0!important}
    .zs-positions .zs-position-metric{display:flex!important;flex-direction:column!important;gap:3px!important;min-width:0!important;padding:6px 7px!important;border:1px solid #ffffff12!important;border-radius:3px!important;background:#080e0b66!important}
    .zs-positions .zs-position-metric small{font-size:8px!important;line-height:1.2!important;letter-spacing:.08em!important;color:#9eaa9e!important}
    .zs-positions .zs-position-metric strong{font-size:10px!important;line-height:1.3!important;color:#dce4da!important;overflow-wrap:anywhere!important;font-variant-numeric:tabular-nums!important}
    .zs-positions .zs-position-chart{display:block!important;width:100%!important;height:40px!important;min-width:0!important;overflow:hidden!important;grid-column:auto!important}
    .zs-positions .zs-position-chart .zs-spark{display:block!important;width:100%!important;height:40px!important}
    .zs-positions .zs-position-close{align-self:flex-start!important;min-width:150px!important;min-height:30px!important}
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
    .zs-center .zs-actions{flex:0 0 34px!important;margin:0!important}
    .zs-center .zs-actions button{min-height:34px!important}
    .zs-center-summary{display:flex;flex:0 0 auto;align-items:center;justify-content:space-between;gap:12px;min-height:54px;padding:8px 12px;border:1px solid #596c5c;border-radius:4px;background:linear-gradient(110deg,#111a14,#202b21);box-shadow:inset 0 1px #ffffff0b}
    .zs-center-token{display:grid;gap:2px;min-width:0}.zs-center-token small{font-size:9px;letter-spacing:.11em;color:#aebbad}.zs-center-token strong{font-size:15px;letter-spacing:.05em;color:#edf2ea}.zs-center-token span{font-size:10px;color:#bdc9bc;font-variant-numeric:tabular-nums}
    .zs-center-pnl{display:grid;gap:2px;text-align:right;font-variant-numeric:tabular-nums}.zs-center-pnl strong{font-size:22px;line-height:1;color:#c6d9ba}.zs-center-pnl span{font-size:10px;color:#b9c7b7}.zs-center-pnl.is-negative strong{color:#d49a9a}.zs-center-idle{font-size:10px;letter-spacing:.12em;color:#b8c6b6}
    .zs-chart-panel{display:flex;flex:1 1 150px;flex-direction:column;gap:6px;min-height:130px;padding:9px 10px;border:1px solid #526457;border-radius:4px;background:linear-gradient(180deg,#111a14,#0c120f);overflow:hidden}
    .zs-chart-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.zs-chart-head h3{margin:0!important;font-size:11px!important;letter-spacing:.09em}.zs-chart-range{font-size:9px;letter-spacing:.1em;color:#9eae9d}
    .zs-chart{flex:1 1 auto!important;width:100%!important;height:auto!important;min-height:96px!important;margin:0!important;border:0!important;background:linear-gradient(180deg,#a8c79b13,transparent)!important}
    .zs-chart svg{width:100%;height:100%;min-height:96px;display:block}
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

    .sniper-demo.zs-fullscreen{display:grid!important;grid-template-rows:0 44px 38px 64px minmax(0,1fr) 94px!important;gap:7px!important;padding:12px 16px!important;background:radial-gradient(ellipse at 16% 0%,#303832 0,transparent 35%),linear-gradient(145deg,#151a18,#090e0d 55%,#1a201d)!important}
    .sniper-demo.zs-fullscreen>style{display:none!important}
    .sniper-demo.zs-fullscreen>.zs-head{grid-row:2;min-height:0;padding:0 4px 7px;align-self:stretch}
    .sniper-demo.zs-fullscreen>.zs-nav{grid-row:3;align-self:center}
    .sniper-demo.zs-fullscreen>.zs-kpis{grid-row:4;align-self:stretch}
    .sniper-demo.zs-fullscreen>.zs-layout{grid-row:5;min-height:0;height:100%;align-self:stretch}
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
    .zs-launch-panel{display:flex;flex-direction:column;min-height:0;padding:10px 12px}.zs-launch-panel h3{margin-bottom:7px}.zs-launch-panel .sniper-toolbar{display:flex;align-items:center;gap:9px;margin:0 0 7px;min-height:30px}.zs-launch-panel #sniper-feed-status{font-size:10px;line-height:1.3}.zs-launch-panel #sniper-refresh{min-height:29px;padding:6px 10px;font-size:9px;white-space:nowrap}.zs-launches{flex:1;min-height:0;max-height:none;overflow:auto;padding:0 7px;border:1px solid #36433a;border-radius:4px;background:#0d1411;scrollbar-width:thin}
    .zs-launches #sniper-candidates{display:grid}.zs-launches .sniper-candidate{grid-template-columns:minmax(0,1fr) auto;gap:5px 10px;padding:9px 3px;border-top:1px solid #ffffff12}.zs-launches .sniper-candidate-main{gap:3px}.zs-launches .sniper-token-name{font-size:12px;line-height:1.25;color:#e6ebe4}.zs-launches .sniper-candidate-main small{font-size:10px;line-height:1.25}.zs-launches .sniper-candidate-stats{grid-column:1;grid-row:2;display:flex;flex-wrap:wrap;gap:5px 12px;font-size:10px;color:#bac5ba}.zs-launches .sniper-link{display:none}.zs-launches .sniper-action{grid-column:2;grid-row:1/3;align-self:center;min-width:94px;min-height:30px;padding:6px 9px;font-size:9px}.zs-launches .sniper-action:disabled{background:#38423b!important;border-color:#526056!important;color:#bdc6bc!important;opacity:1}
    .zs-log{grid-template-columns:repeat(3,minmax(0,1fr));max-height:58px;overflow:auto}.zs-logrow{grid-template-columns:55px 52px minmax(50px,auto);gap:5px;padding:5px 7px;font-size:10px}.zs-logrow span{grid-column:1/-1;color:#aeb9af}.zs-logkind{font-size:9px;letter-spacing:.05em}
    .zs-foot{font-size:10px}.zs-fullscreen .zs-foot{display:none!important}
    .zs-tab-hidden{display:none!important}
    .zs-fullscreen .zs-fields{grid-template-columns:repeat(2,minmax(0,1fr))}
    @media(max-width:1180px) and (min-width:761px){.zs-layout{grid-template-columns:minmax(300px,1fr) minmax(230px,.8fr) minmax(330px,1.1fr)}.zs-fullscreen .zs-fields{grid-template-columns:1fr}.zs-fullscreen .zs-field label{font-size:10px}}
    @media(max-height:760px) and (min-width:761px){.sniper-demo.zs-fullscreen{grid-template-rows:0 38px 34px 56px minmax(0,1fr) 76px!important;padding:7px 12px!important;gap:5px!important}.zs-fullscreen .zs-panel{padding:9px 11px}.zs-fullscreen .zs-kpi{padding:7px 10px}.zs-fullscreen .zs-portrait{height:55px}.zs-fullscreen .zs-core{width:100px;min-height:82px}.zs-fullscreen .zs-chart{height:55px}.zs-fullscreen .zs-field{padding:3px 0}.zs-fullscreen .zs-field label{font-size:10px}.zs-fullscreen .zs-log{max-height:42px}}
    @media(max-width:760px){.sniper-demo.zs-fullscreen{display:block!important;overflow:auto!important;height:100dvh!important;padding:12px!important}.zs-fullscreen>.zs-head,.zs-fullscreen>.zs-nav,.zs-fullscreen>.zs-kpis,.zs-fullscreen>.zs-layout,.zs-fullscreen>#zs-journal-panel{display:block!important;margin-bottom:10px}.zs-fullscreen .zs-layout{height:auto;grid-template-columns:1fr}.zs-fullscreen .zs-right{min-height:520px}.zs-fullscreen .zs-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.zs-fullscreen .zs-kpis{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))}.zs-fullscreen .zs-log{grid-template-columns:1fr;max-height:150px}}
    `;
    style.textContent += `
    /* History: compact trade rows; reserve real viewport space for the event log */
    .sniper-demo.zs-fullscreen.zs-history-mode{grid-template-rows:0 44px 38px 0 minmax(0,1fr) 196px!important}
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
    const header=dashNode('div','zs-head');const brand=dashNode('span','zs-brand','☣ ZOMBCASH');const title=dashNode('strong','zs-title','ZOMBIE SNIPER');const headActions=dashNode('div','zs-head-actions');headActions.append(dashNode('span','zs-demo',dcopy().demo));const expand=dashNode('button','zs-expand','⛶ FULL SCREEN');expand.type='button';expand.title='Open terminal full screen';function syncFullscreenButton(){const on=root.classList.contains('zs-fullscreen');document.body.classList.toggle('zs-lock',on);expand.textContent=on?'✕ EXIT FULL SCREEN':'⛶ FULL SCREEN';}
    async function enterDashboardFullscreen(useNative){
      mountDashboardOverlay();
      root.classList.add('zs-fullscreen');syncFullscreenButton();
      if(useNative&&document.fullscreenElement!==document.documentElement&&document.documentElement.requestFullscreen){
        try{await document.documentElement.requestFullscreen();root.dataset.nativeFullscreen='1';}
        catch(_){root.dataset.nativeFullscreen='0';}
      }
    }
    async function exitDashboardFullscreen(){
      if(document.fullscreenElement){try{await document.exitFullscreen();}catch(_){}}
      root.dataset.nativeFullscreen='0';
      root.classList.remove('zs-fullscreen');syncFullscreenButton();
      restoreDashboardToPage();
    }
    expand.addEventListener('click',()=>{
      if(root.classList.contains('zs-fullscreen')){exitDashboardFullscreen();return;}
      enterDashboardFullscreen(true);
    });
    document.addEventListener('fullscreenchange',()=>{
      if(!document.fullscreenElement&&root.dataset.nativeFullscreen==='1'){
        root.dataset.nativeFullscreen='0';root.classList.remove('zs-fullscreen');syncFullscreenButton();restoreDashboardToPage();
      }
    });headActions.append(expand);header.append(brand,title,headActions);
    const nav=dashNode('nav','zs-nav');nav.setAttribute('aria-label','Zombie Sniper navigation');
    const tabTargets=['sniper','stats','history','settings','help'];
    function selectTab(tab){
      root.dataset.activeTab=tab;
      root.classList.toggle('zs-history-mode',tab==='history');
      nav.querySelectorAll('button[data-zs-nav]').forEach(b=>{const active=tabTargets[Number(b.dataset.zsNav)]===tab;b.classList.toggle('is-active',active);b.setAttribute('aria-selected',active?'true':'false');});
      left.classList.toggle('zs-tab-hidden',tab!=='sniper'&&tab!=='settings');
      center.classList.toggle('zs-tab-hidden',tab!=='sniper'&&tab!=='stats');
      right.classList.toggle('zs-tab-hidden',tab!=='sniper'&&tab!=='history');
      launchPanel.classList.toggle('zs-tab-hidden',tab!=='sniper');
      posSection.classList.toggle('zs-tab-hidden',tab!=='sniper'&&tab!=='history');
      journal.classList.toggle('zs-tab-hidden',tab!=='history');
      kpis.classList.toggle('zs-tab-hidden',tab!=='sniper'&&tab!=='stats');
      helpPanel.classList.toggle('zs-tab-hidden',tab!=='help');
      layout.classList.toggle('zs-stats-layout',tab==='stats');layout.classList.toggle('zs-single-layout',tab==='history'||tab==='settings');layout.classList.toggle('zs-tab-hidden',tab==='help');
      if(tab==='history')renderPositions();
      if(tab==='stats'){renderStats();statsPanel.classList.remove('zs-tab-hidden');portrait.classList.add('zs-tab-hidden');core.classList.add('zs-tab-hidden');toggle.classList.add('zs-tab-hidden');actions.classList.add('zs-tab-hidden');chartPanel.classList.add('zs-tab-hidden');}
      else{statsPanel.classList.add('zs-tab-hidden');portrait.classList.remove('zs-tab-hidden');core.classList.remove('zs-tab-hidden');toggle.classList.remove('zs-tab-hidden');actions.classList.remove('zs-tab-hidden');chartPanel.classList.remove('zs-tab-hidden');}
    }
    dcopy().nav.forEach((label,i)=>{const b=dashNode('button','',label);b.dataset.zsNav=String(i);b.type='button';b.setAttribute('role','tab');b.addEventListener('click',()=>selectTab(tabTargets[i]||'sniper'));nav.append(b);});
    const kpis=dashNode('div','zs-kpis');kpis.id='zs-kpis';
    const layout=dashNode('div','zs-layout');const left=dashNode('section','zs-panel zs-left');left.id='zs-settings';const leftTitle=dashNode('h3','',dcopy().settings);leftTitle.id='zs-settings-title';left.append(leftTitle);

    const presetPanel=dashNode('section','zs-presets');presetPanel.id='zs-presets';
    presetPanel.append(dashNode('h3','',state.lang==='ru'?'РЕКОМЕНДУЕМЫЕ ПРОФИЛИ':'RECOMMENDED PROFILES'));
    presetPanel.append(dashNode('p','zs-preset-note',state.lang==='ru'?'Готовые наборы для виртуальных испытаний. Меняют только демо-параметры.':'Ready-made paper-testing profiles. Demo settings only.'));
    const presetButtons=dashNode('div','zs-preset-buttons');
    const presets=[
      {id:'conservative',label:state.lang==='ru'?'Консервативный':'Conservative',v:{capital:10,size:0.02,target:8,stop:10,network:0.00001,priority:0.00005,dex:0.5,slip:0.5,max:0.05,liq:20000}},
      {id:'balanced',label:state.lang==='ru'?'Сбалансированный':'Balanced',v:{capital:10,size:0.05,target:12,stop:15,network:0.00001,priority:0.0001,dex:0.5,slip:1,max:0.05,liq:10000}},
      {id:'aggressive',label:state.lang==='ru'?'Агрессивный':'Aggressive',v:{capital:10,size:0.05,target:20,stop:25,network:0.00002,priority:0.0002,dex:0.5,slip:2,max:0.05,liq:5000}}
    ];
    presets.forEach(p=>{
      const b=dashNode('button','zs-preset-btn',p.label);b.type='button';b.dataset.preset=p.id;
      b.addEventListener('click',()=>{
        const v=p.v,map={'sniper-size':v.size,'sniper-target':v.target,'sniper-stop':v.stop,'sniper-network':v.network,'sniper-priority':v.priority,'sniper-dex':v.dex,'sniper-slip':v.slip,'sniper-capital':v.capital,'sniper-max-size':v.max,'sniper-liquidity':v.liq};
        Object.entries(map).forEach(([id,value])=>{const el=$(id);if(el){el.value=String(value);const r=el.parentElement&&el.parentElement.querySelector('.zs-range');if(r)r.value=String(value);}});
        terminal.capital=v.capital;terminal.maxTradeSize=v.max;terminal.minLiquidity=v.liq;terminal.selectedPreset=p.id;saveTerminal();renderStats();
        presetButtons.querySelectorAll('button').forEach(x=>x.classList.toggle('is-selected',x===b));
        applied.textContent=(state.lang==='ru'?'Применён профиль: ':'Applied profile: ')+p.label;logEvent('PRESET','SYSTEM',p.label+' profile applied');
      });
      presetButtons.append(b);
    });
    const applied=dashNode('p','zs-preset-applied','');applied.id='zs-preset-applied';
    presetPanel.append(presetButtons,applied);

    const fieldHost=dashNode('div','zs-fields');fields.forEach((f,i)=>{f.classList.add('zs-field');const input=f.querySelector('input');if(input){const lim={ 'sniper-size':[0.001,10,0.001], 'sniper-target':[0.1,100,0.1], 'sniper-stop':[0,99,0.5], 'sniper-network':[0,0.1,0.000001], 'sniper-priority':[0,0.1,0.000001], 'sniper-dex':[0,20,0.05], 'sniper-slip':[0,50,0.1] }[input.id];if(lim)addRange(f,input.id,...lim);}fieldHost.append(f);});
    addVirtualField(fieldHost,'sniper-capital',dcopy().capital,0.1,1000,0.1,terminal.capital||10);
    addVirtualField(fieldHost,'sniper-max-size',dcopy().maxsize,0.001,0.05,0.001,Math.min(0.05,terminal.maxTradeSize||0.05));
    addVirtualField(fieldHost,'sniper-liquidity',dcopy().minliq,0,1000000,100,terminal.minLiquidity||5000);
    addVirtualField(fieldHost,'sniper-idle-timeout',state.lang==='ru'?'ТАЙМ-АУТ БЕЗ ДВИЖЕНИЯ (СЕК.)':'NO-MOVEMENT TIMEOUT (SEC)',15,300,5,terminal.idleTimeout||60);
    addVirtualField(fieldHost,'sniper-min-move',state.lang==='ru'?'МИН. ДВИЖЕНИЕ ЦЕНЫ (%)':'MINIMUM PRICE MOVE (%)',0.05,2,0.05,terminal.minMovePct||0.2);
    const sizeInput=$('sniper-size');if(sizeInput){sizeInput.max=terminal.maxTradeSize||0.05;const sizeSlider=sizeInput.parentElement&&sizeInput.parentElement.querySelector('.zs-range');if(sizeSlider)sizeSlider.max=sizeInput.max;}
    const walletPanel=dashNode('div','zs-foot');walletPanel.id='zs-wallet-panel';
    left.append(fieldHost,presetPanel,walletPanel,dashNode('p','zs-foot',dcopy().hint));
    const center=dashNode('section','zs-panel zs-center');center.id='zs-center';const centerTitle=dashNode('h3','',dcopy().autopilot);centerTitle.id='zs-center-title';center.append(centerTitle);
    const portrait=dashNode('div','zs-portrait');const pic=dashNode('img','');pic.src='/assets/zombcash-survivor-640.avif';pic.alt='ZombieCash anime survivor heroine';portrait.append(pic,dashNode('b','','$ZOMBCASH SURVIVOR'));
    const core=dashNode('div','zs-core');const coreText=dashNode('div','');coreText.append(dashNode('strong','', '◉'),dashNode('strong','', 'AUTO SNIPER'),dashNode('span','', 'PAPER ENGINE'));core.append(coreText);
    const toggle=dashNode('button','zs-toggle',dcopy().paused);toggle.id='zs-auto-toggle';toggle.type='button';toggle.addEventListener('click',async()=>{if(terminal.auto){if(!await setServerPaperEnabled(false))return;terminal.auto=false;saveTerminal();renderDashboardState();logEvent('PAUSED','SYSTEM','Server paper engine paused; open position remains managed.');}else showLaunchConfirm();});
    const actions=dashNode('div','zs-actions');const pause=dashNode('button','sniper-action sniper-close',dcopy().pause);pause.type='button';pause.addEventListener('click',async()=>{if(!await setServerPaperEnabled(false))return;terminal.auto=false;saveTerminal();renderDashboardState();logEvent('PAUSE','SYSTEM','Server paper engine paused; open position remains managed.');});
    const stop=dashNode('button','sniper-action sniper-close',dcopy().stop);stop.type='button';stop.addEventListener('click',async()=>{if(!await setServerPaperEnabled(false))return;terminal.auto=false;saveTerminal();renderDashboardState();logEvent('STOP','SYSTEM','Server paper engine stopped; no live orders exist');});actions.append(pause,stop);
    const statsPanel=dashNode('div','zs-stats-extra zs-tab-hidden');statsPanel.id='zs-stats-extra';
    const statsHeading=dashNode('h3','',state.lang==='ru'?'РЕЗУЛЬТАТЫ СИМУЛЯЦИИ':'SIMULATION PERFORMANCE');
    const statsGrid=dashNode('div','zs-stat-grid');statsGrid.id='zs-stat-grid';statsPanel.append(statsHeading,statsGrid);
    const centerSummary=dashNode('div','zs-center-summary');centerSummary.id='zs-center-summary';const chartPanel=dashNode('div','zs-chart-panel');const chartHead=dashNode('div','zs-chart-head');const chartTitle=dashNode('h3','',dcopy().chart);chartTitle.id='zs-chart-title';chartHead.append(chartTitle,dashNode('span','zs-chart-range','LIVE · 20 SEC'));chartPanel.append(chartHead);const chart=dashNode('div','zs-chart');chart.id='zs-main-chart';chartPanel.append(chart);
    center.append(portrait,core,toggle,actions,centerSummary,chartPanel,statsPanel);
    const right=dashNode('section','zs-panel zs-right');const rightTitle=dashNode('h3','',dcopy().active);rightTitle.id='zs-right-title';right.append(rightTitle);const posSection=dashNode('div','zs-position-section');const posWrap=dashNode('div','zs-positions');posWrap.id='zs-positions-wrap';if(positions){positions.classList.add('zs-positions-inner');posWrap.append(positions);}posSection.append(posWrap);right.append(posSection);
    const launchPanel=dashNode('section','zs-panel zs-launch-panel');const launchTitle=dashNode('h3','',dcopy().launches);launchTitle.id='zs-launch-title';launchPanel.append(launchTitle);const toolbar=dashNode('div','sniper-toolbar');if(refresh)toolbar.append(refresh);if(status)toolbar.append(status);launchPanel.append(toolbar);const launchWrap=dashNode('div','zs-launches');if(candidates)launchWrap.append(candidates);launchPanel.append(launchWrap);
    right.append(launchPanel);layout.append(left,center,right);
    const journal=dashNode('section','zs-panel');journal.id='zs-journal-panel';const logTitle=dashNode('h3','',dcopy().journal);logTitle.id='zs-log-title';journal.append(logTitle);const log=dashNode('div','zs-log');log.id='zs-log';journal.append(log);
    const clearBar=dashNode('div','sniper-toolbar');if(clear)clearBar.append(clear);journal.append(clearBar);
    const foot=dashNode('p','zs-foot',dcopy().hint+' '+t('source'));
    const helpPanel=dashNode('section','zs-panel zs-help zs-tab-hidden');helpPanel.innerHTML='';const helpTitle=dashNode('h3','',state.lang==='ru'?'СПРАВКА И БЕЗОПАСНОСТЬ':'HELP & SAFETY');helpPanel.append(helpTitle,dashNode('p','zs-foot',state.lang==='ru'?'Это симулятор. Все сделки виртуальные. Реальные кошельки, ключи и транзакции не используются.':'This is a paper-trading simulator. No live wallets, private keys or transactions are used.'),dashNode('p','zs-foot',state.lang==='ru'?'Настройте размер сделки, комиссии, проскальзывание, стоп-лосс и цель чистой прибыли. Автовход использует только новые запуски с доступной SOL-парой и заданной минимальной ликвидностью.':'Adjust trade size, fees, slippage, stop loss and net profit target. Auto-entry only uses new launches with a live SOL pair and your minimum liquidity threshold.'));
    root.replaceChildren(style,header,nav,kpis,layout,journal,helpPanel,foot);
    renderDashboardState();renderPositions();renderCandidates();selectTab('sniper');mountDashboardOverlay();root.classList.add('zs-fullscreen');document.body.classList.add('zs-lock');expand.textContent='✕ EXIT FULL SCREEN';
  }

  function init(){
    readStore();activeStorageKey=storageKey();detectLang();buildDashboard();translate();
    $('sniper-refresh').addEventListener('click',refreshFeed);
    $('sniper-clear').addEventListener('click',()=>{state.positions=[];saveStore();clearServerHistory();renderPositions();$('sniper-feed-status').textContent=t('cleared');});
    ['sniper-network','sniper-priority','sniper-dex','sniper-slip','sniper-target','sniper-stop'].forEach(id=>$(id).addEventListener('change',updatePositions));
    ['sniper-capital','sniper-size','sniper-target','sniper-stop','sniper-min-move','sniper-idle-timeout'].forEach(id=>$(id)?.addEventListener('change',()=>{if(terminal.auto&&authToken())setServerPaperEnabled(true);}));
    refreshFeed();if(authToken())syncFromServer();else{updateSyncStatus('loginToSync');updatePositions();}
    state.timer=window.setInterval(()=>{checkAccountChange();if(!document.hidden)refreshFeed();},15000);
    state.positionTimer=window.setInterval(()=>{if(!document.hidden){if(authToken())syncFromServer();else updatePositions();}},10000);
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&root.classList.contains('zs-fullscreen')&&!document.fullscreenElement){root.classList.remove('zs-fullscreen');root.dataset.nativeFullscreen='0';document.body.classList.remove('zs-lock');restoreDashboardToPage();const b=root.querySelector('.zs-expand');if(b)b.textContent='⛶ FULL SCREEN';}});
    document.addEventListener('zombcash:languagechange',()=>{detectLang();translate();if($('zs-kpis'))renderDashboardState();});
    document.addEventListener('zombcash:survivorlogin',()=>{if(!checkAccountChange())syncFromServer();});
    document.addEventListener('click',event=>{if(event.target&&event.target.closest&&event.target.closest('#survivor-logout'))Promise.resolve().then(checkAccountChange);});
    window.addEventListener('storage',event=>{if(event.key===TOKEN_KEY||event.key===PROFILE_KEY){if(!checkAccountChange()&&authToken())syncFromServer().then(updatePositions);}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();