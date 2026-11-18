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
      title:'ZOMBIE SNIPER // PAPER DEMO', intro:'Test the entry and exit rules against public DEX market data. This sandbox never connects a wallet and never submits a transaction.',
      demo:'DEMO ONLY', refresh:'REFRESH TOKEN FEED', loading:'Scanning the latest public token profiles…', failed:'The public feed is temporarily unavailable. Try again later.',
      source:'Source: DexScreener latest token profiles + current token-pair snapshots. A profile is not proof of a fresh launch; indexing can be delayed and this is not a first-minute launch feed.',
      amount:'PAPER BUY SIZE (SOL)', target:'NET PROFIT TARGET (%)', stop:'NET STOP-LOSS (%)',
      network:'NETWORK FEE / TX (SOL)', priority:'PRIORITY FEE / TX (SOL)', dex:'DEX FEE / SIDE (%)', slip:'SLIPPAGE / SIDE (%)',
      assumptions:'Editable cost assumptions — not live transaction quotes. Actual costs depend on the route, congestion, liquidity and wallet account state.',
      candidates:'LATEST SOLANA TOKEN PROFILES', noCandidates:'No suitable SOL-quoted pools found in the latest profile batch.',
      token:'TOKEN', age:'PAIR AGE', liquidity:'LIQUIDITY', price:'PRICE (SOL)', action:'PAPER BUY',
      positions:'PAPER POSITIONS', noPositions:'No paper positions yet. Choose a candidate above to simulate a buy.',
      open:'OPEN', closed:'CLOSED', entry:'ENTRY', current:'CURRENT', net:'NET P/L', targetHit:'NET TARGET HIT — SIMULATED SELL',
      stopHit:'NET STOP-LOSS HIT — SIMULATED SELL', manualClose:'CLOSE PAPER POSITION', saved:'Demo history is stored only in this browser on this device.', synced:'Demo history synced to your Telegram survivor profile.', loginToSync:'Log in with Telegram to sync demo history; otherwise it stays in this browser.', loginAgain:'Your Telegram session expired. Log in again to sync.', syncError:'Account sync is unavailable; this device copy is kept locally.',
      rules:'Net P/L includes both-side DEX fee and slippage assumptions plus network and priority fees for both transactions. The target is checked against net P/L, not token price movement.',
      cap:'Demo trade size is capped at 0.05 SOL. No wallet is created or funded. Live trading is disabled.',
      ageUnknown:'unknown', justNow:'just now', mins:'m ago', hours:'h ago', days:'d ago',
      needAmount:'Enter a paper buy size greater than zero and no more than 0.05 SOL.',
      noPair:'No current SOL-quoted pool is available for this token.', buyOk:'Paper position opened. No transaction was sent.',
      positionLimit:'Demo allows one open paper position at a time.', clear:'CLEAR LOCAL DEMO HISTORY', cleared:'Local demo history cleared.',
      refreshDone:'Feed refreshed.', feeWarning:'Illustrative assumptions only'
    },
    ru: {
      title:'ZOMBIE SNIPER // ДЕМО-РЕЖИМ', intro:'Проверь правила входа и выхода на публичных рыночных данных DEX. Демо не подключает кошелёк и не отправляет транзакции.',
      demo:'ТОЛЬКО ДЕМО', refresh:'ОБНОВИТЬ ЛЕНТУ ТОКЕНОВ', loading:'Сканируем последние публичные профили токенов…', failed:'Публичная лента временно недоступна. Попробуйте позже.',
      source:'Источник: последние профили DexScreener и текущие снимки торговых пар. Профиль не доказывает, что токен только что запущен; индексация может запаздывать. Это не поток запусков в первую минуту.',
      amount:'РАЗМЕР ДЕМО-ПОКУПКИ (SOL)', target:'ЦЕЛЬ ЧИСТОЙ ПРИБЫЛИ (%)', stop:'СТОП-ЛОСС ПО ЧИСТОМУ P/L (%)',
      network:'СЕТЕВАЯ КОМИССИЯ / TX (SOL)', priority:'ПРИОРИТЕТНАЯ КОМИССИЯ / TX (SOL)', dex:'КОМИССИЯ DEX / СТОРОНА (%)', slip:'ПРОСКАЛЬЗЫВАНИЕ / СТОРОНА (%)',
      assumptions:'Редактируемые допущения по расходам — не актуальные котировки комиссий. Фактические расходы зависят от маршрута, нагрузки сети, ликвидности и состояния кошелька.',
      candidates:'ПОСЛЕДНИЕ ПРОФИЛИ ТОКЕНОВ SOLANA', noCandidates:'В последней пачке профилей не найдено подходящих пулов с котировкой в SOL.',
      token:'ТОКЕН', age:'ВОЗРАСТ ПАРЫ', liquidity:'ЛИКВИДНОСТЬ', price:'ЦЕНА (SOL)', action:'ДЕМО-ПОКУПКА',
      positions:'ДЕМО-ПОЗИЦИИ', noPositions:'Демо-позиций пока нет. Выберите токен выше, чтобы смоделировать покупку.',
      open:'ОТКРЫТА', closed:'ЗАКРЫТА', entry:'ВХОД', current:'ТЕКУЩАЯ', net:'ЧИСТЫЙ P/L', targetHit:'ЦЕЛЬ ПО ЧИСТОЙ ПРИБЫЛИ ДОСТИГНУТА — ДЕМО-ПРОДАЖА',
      stopHit:'СТОП-ЛОСС ПО ЧИСТОМУ P/L ДОСТИГНУТ — ДЕМО-ПРОДАЖА', manualClose:'ЗАКРЫТЬ ДЕМО-ПОЗИЦИЮ', saved:'История демо хранится только в этом браузере на этом устройстве.', synced:'История демо синхронизирована с профилем Telegram.', loginToSync:'Войдите через Telegram для синхронизации; иначе история останется в этом браузере.', loginAgain:'Сессия Telegram истекла. Войдите снова для синхронизации.', syncError:'Синхронизация недоступна; локальная копия сохранена.',
      rules:'Чистый P/L учитывает комиссии DEX и проскальзывание на обеих сторонах, а также сетевые и приоритетные комиссии обеих транзакций. Цель проверяется по чистому P/L, а не по изменению цены токена.',
      cap:'Размер демо-сделки ограничен 0,05 SOL. Кошелёк не создаётся и не пополняется. Реальная торговля отключена.',
      ageUnknown:'неизвестно', justNow:'только что', mins:' мин. назад', hours:' ч. назад', days:' дн. назад',
      needAmount:'Укажите размер демо-покупки больше нуля и не более 0,05 SOL.',
      noPair:'Для этого токена нет текущего пула с котировкой в SOL.', buyOk:'Демо-позиция открыта. Транзакция не отправлялась.',
      positionLimit:'В демо допускается только одна открытая позиция одновременно.', clear:'ОЧИСТИТЬ ЛОКАЛЬНУЮ ИСТОРИЮ', cleared:'Локальная история демо очищена.',
      refreshDone:'Лента обновлена.', feeWarning:'Только примерные допущения'
    },
    de: {title:'ZOMBIE SNIPER // PAPER-DEMO',intro:'Teste Ein- und Ausstiegsregeln mit öffentlichen DEX-Marktdaten. Keine Wallet-Verbindung und keine Transaktionen.',demo:'NUR DEMO',refresh:'TOKENLISTE AKTUALISIEREN',loading:'Neueste öffentliche Tokenprofile werden geladen…',failed:'Der öffentliche Feed ist vorübergehend nicht verfügbar.',source:'Quelle: neueste DexScreener-Profile und aktuelle Pair-Snapshots. Ein Profil bestätigt keinen frischen Launch; die Indexierung kann verzögert sein.',amount:'DEMO-KAUFGRÖSSE (SOL)',target:'NETTO-GEWINNZIEL (%)',stop:'NETTO-STOP-LOSS (%)',network:'NETZWERKGEBÜHR / TX (SOL)',priority:'PRIORITÄTSGEBÜHR / TX (SOL)',dex:'DEX-GEBÜHR / SEITE (%)',slip:'SLIPPAGE / SEITE (%)',assumptions:'Bearbeitbare Kostenannahmen, keine Live-Gebührenquotes.',candidates:'NEUESTE SOLANA-TOKENPROFILE',noCandidates:'Keine passenden SOL-Paare gefunden.',token:'TOKEN',age:'PAIR-ALTER',liquidity:'LIQUIDITÄT',price:'PREIS (SOL)',action:'DEMO-KAUF',positions:'DEMO-POSITIONEN',noPositions:'Noch keine Demo-Positionen.',open:'OFFEN',closed:'GESCHLOSSEN',entry:'EINSTIEG',current:'AKTUELL',net:'NETTO-P/L',targetHit:'NETTOZIEL ERREICHT — DEMO-VERKAUF',stopHit:'STOP-LOSS ERREICHT — DEMO-VERKAUF',manualClose:'DEMO-POSITION SCHLIESSEN',saved:'Demo-Verlauf wird nur lokal in diesem Browser gespeichert.', synced:'Demo-Verlauf mit deinem Telegram-Profil synchronisiert.', loginToSync:'Mit Telegram anmelden, um den Demo-Verlauf zu synchronisieren.', loginAgain:'Telegram-Sitzung abgelaufen. Bitte erneut anmelden.', syncError:'Synchronisierung nicht verfügbar; lokale Kopie bleibt erhalten.',rules:'Netto-P/L berücksichtigt DEX-Gebühren und Slippage auf beiden Seiten sowie Netzwerk- und Prioritätsgebühren für beide Transaktionen.',cap:'Demo-Größe maximal 0,05 SOL. Keine Wallet, keine echten Trades.',ageUnknown:'unbekannt',justNow:'gerade eben',mins:' Min.',hours:' Std.',days:' Tg.',needAmount:'Demo-Kaufgröße muss größer als 0 und höchstens 0,05 SOL sein.',noPair:'Kein aktuelles SOL-Paar verfügbar.',buyOk:'Demo-Position eröffnet. Keine Transaktion gesendet.',positionLimit:'Nur eine offene Demo-Position gleichzeitig.',clear:'LOKALE DEMO-HISTORIE LÖSCHEN',cleared:'Lokale Demo-Historie gelöscht.',refreshDone:'Feed aktualisiert.'},
    fr: {title:'ZOMBIE SNIPER // DÉMO PAPIER',intro:'Testez les règles avec des données DEX publiques. Aucun portefeuille ni aucune transaction.',demo:'DÉMO UNIQUEMENT',refresh:'ACTUALISER LES TOKENS',loading:'Analyse des derniers profils publics…',failed:'Flux public temporairement indisponible.',source:'Source : profils DexScreener et instantanés des paires. Un profil ne prouve pas un lancement récent; l’indexation peut être retardée.',amount:'TAILLE ACHAT DÉMO (SOL)',target:'OBJECTIF DE PROFIT NET (%)',stop:'STOP-LOSS NET (%)',network:'FRAIS RÉSEAU / TX (SOL)',priority:'FRAIS PRIORITAIRES / TX (SOL)',dex:'FRAIS DEX / CÔTÉ (%)',slip:'GLISSEMENT / CÔTÉ (%)',assumptions:'Hypothèses modifiables, pas des devis de frais en direct.',candidates:'DERNIERS PROFILS DE TOKENS SOLANA',noCandidates:'Aucune paire SOL appropriée trouvée.',token:'TOKEN',age:'ÂGE DE PAIRE',liquidity:'LIQUIDITÉ',price:'PRIX (SOL)',action:'ACHAT DÉMO',positions:'POSITIONS DÉMO',noPositions:'Aucune position démo pour le moment.',open:'OUVERTE',closed:'FERMÉE',entry:'ENTRÉE',current:'ACTUEL',net:'P/L NET',targetHit:'OBJECTIF NET ATTEINT — VENTE SIMULÉE',stopHit:'STOP-LOSS NET ATTEINT — VENTE SIMULÉE',manualClose:'FERMER LA POSITION DÉMO',saved:'Historique enregistré uniquement dans ce navigateur.', synced:'Historique synchronisé avec votre profil Telegram.', loginToSync:'Connectez-vous avec Telegram pour synchroniser l’historique.', loginAgain:'Session Telegram expirée. Reconnectez-vous.', syncError:'Synchronisation indisponible ; copie locale conservée.',rules:'Le P/L net inclut frais DEX et glissement à l’achat et à la vente, plus frais réseau et prioritaires des deux transactions.',cap:'Taille démo limitée à 0,05 SOL. Aucun portefeuille ni ordre réel.',ageUnknown:'inconnu',justNow:'à l’instant',mins:' min',hours:' h',days:' j',needAmount:'La taille doit être supérieure à zéro et inférieure ou égale à 0,05 SOL.',noPair:'Aucune paire SOL actuelle disponible.',buyOk:'Position démo ouverte. Aucune transaction envoyée.',positionLimit:'Une seule position démo ouverte à la fois.',clear:'EFFACER L’HISTORIQUE LOCAL',cleared:'Historique local effacé.',refreshDone:'Flux actualisé.'},
    it: {title:'ZOMBIE SNIPER // DEMO CARTA',intro:'Prova le regole con dati DEX pubblici. Nessun wallet e nessuna transazione.',demo:'SOLO DEMO',refresh:'AGGIORNA TOKEN',loading:'Scansione degli ultimi profili pubblici…',failed:'Feed pubblico temporaneamente non disponibile.',source:'Fonte: profili DexScreener e snapshot delle coppie. Un profilo non prova un lancio recente; l’indicizzazione può essere in ritardo.',amount:'DIMENSIONE ACQUISTO DEMO (SOL)',target:'OBIETTIVO PROFITTO NETTO (%)',stop:'STOP-LOSS NETTO (%)',network:'FEE RETE / TX (SOL)',priority:'FEE PRIORITARIA / TX (SOL)',dex:'FEE DEX / LATO (%)',slip:'SLIPPAGE / LATO (%)',assumptions:'Ipotesi di costo modificabili, non preventivi live.',candidates:'ULTIMI PROFILI TOKEN SOLANA',noCandidates:'Nessuna coppia SOL idonea trovata.',token:'TOKEN',age:'ETÀ COPPIA',liquidity:'LIQUIDITÀ',price:'PREZZO (SOL)',action:'ACQUISTO DEMO',positions:'POSIZIONI DEMO',noPositions:'Nessuna posizione demo ancora.',open:'APERTA',closed:'CHIUSA',entry:'INGRESSO',current:'ATTUALE',net:'P/L NETTO',targetHit:'OBIETTIVO NETTO RAGGIUNTO — VENDITA SIMULATA',stopHit:'STOP-LOSS NETTO RAGGIUNTO — VENDITA SIMULATA',manualClose:'CHIUDI POSIZIONE DEMO',saved:'Cronologia salvata solo in questo browser.', synced:'Cronologia sincronizzata con il profilo Telegram.', loginToSync:'Accedi con Telegram per sincronizzare la cronologia.', loginAgain:'Sessione Telegram scaduta. Accedi di nuovo.', syncError:'Sincronizzazione non disponibile; copia locale conservata.',rules:'Il P/L netto include fee DEX e slippage su entrambi i lati, oltre alle fee di rete e priorità per entrambe le transazioni.',cap:'Demo limitata a 0,05 SOL. Nessun wallet o ordine reale.',ageUnknown:'sconosciuta',justNow:'adesso',mins:' min fa',hours:' h fa',days:' gg fa',needAmount:'La dimensione deve essere maggiore di zero e non oltre 0,05 SOL.',noPair:'Nessuna coppia SOL attuale disponibile.',buyOk:'Posizione demo aperta. Nessuna transazione inviata.',positionLimit:'Una sola posizione demo aperta alla volta.',clear:'CANCELLA CRONOLOGIA LOCALE',cleared:'Cronologia locale cancellata.',refreshDone:'Feed aggiornato.'},
    ja: {title:'ZOMBIE SNIPER // ペーパーデモ',intro:'公開DEXデータで売買ルールをテストします。ウォレット接続や実取引はありません。',demo:'デモ専用',refresh:'トークン一覧を更新',loading:'最新の公開トークンプロフィールを確認中…',failed:'公開フィードを一時的に取得できません。',source:'出典：DexScreener最新プロフィールとペアスナップショット。プロフィールは新規ローンチの証明ではなく、反映に遅延があります。',amount:'デモ購入額 (SOL)',target:'純利益目標 (%)',stop:'純損失ストップ (%)',network:'ネットワーク手数料 / TX (SOL)',priority:'優先手数料 / TX (SOL)',dex:'DEX手数料 / 片道 (%)',slip:'スリッページ / 片道 (%)',assumptions:'編集可能な費用仮定です。リアルタイム手数料見積もりではありません。',candidates:'最新のSOLANAトークンプロフィール',noCandidates:'対象となるSOLペアが見つかりません。',token:'トークン',age:'ペア経過時間',liquidity:'流動性',price:'価格 (SOL)',action:'デモ購入',positions:'デモポジション',noPositions:'デモポジションはまだありません。',open:'保有中',closed:'終了',entry:'購入時',current:'現在',net:'純損益',targetHit:'純利益目標達成 — 模擬売却',stopHit:'ストップ到達 — 模擬売却',manualClose:'デモポジションを終了',saved:'履歴はこのブラウザー内にのみ保存されます。', synced:'Telegramプロフィールとデモ履歴を同期しました。', loginToSync:'Telegramにログインするとデモ履歴を同期できます。', loginAgain:'Telegramセッションの期限が切れました。再ログインしてください。', syncError:'同期できません。ローカルコピーは保存されています。',rules:'純損益には往復のDEX手数料、スリッページ、ネットワーク・優先手数料を含みます。',cap:'デモ購入額は0.05 SOL以下。ウォレット作成・実取引なし。',ageUnknown:'不明',justNow:'たった今',mins:'分前',hours:'時間前',days:'日前',needAmount:'購入額は0より大きく0.05 SOL以下にしてください。',noPair:'現在のSOLペアがありません。',buyOk:'デモポジションを開始しました。取引は送信されていません。',positionLimit:'同時に保有できるデモポジションは1つです。',clear:'ローカル履歴を消去',cleared:'ローカル履歴を消去しました。',refreshDone:'フィードを更新しました。'},
    'zh-CN': {title:'ZOMBIE SNIPER // 模拟演练',intro:'使用公开DEX行情测试买卖规则。不连接钱包，不发送真实交易。',demo:'仅限模拟',refresh:'刷新代币列表',loading:'正在扫描最新公开代币资料…',failed:'公开数据暂时不可用，请稍后再试。',source:'来源：DexScreener最新代币资料和交易对快照。资料不代表刚刚发行，索引可能延迟。',amount:'模拟买入金额 (SOL)',target:'净利润目标 (%)',stop:'净止损 (%)',network:'网络费 / 每笔 (SOL)',priority:'优先费 / 每笔 (SOL)',dex:'DEX费用 / 单边 (%)',slip:'滑点 / 单边 (%)',assumptions:'可编辑的成本假设，不是实时交易费用报价。',candidates:'最新SOLANA代币资料',noCandidates:'未找到符合条件的SOL交易对。',token:'代币',age:'交易对年龄',liquidity:'流动性',price:'价格 (SOL)',action:'模拟买入',positions:'模拟持仓',noPositions:'暂无模拟持仓。',open:'持有中',closed:'已关闭',entry:'买入价',current:'当前价',net:'净盈亏',targetHit:'达到净利润目标 — 模拟卖出',stopHit:'达到净止损 — 模拟卖出',manualClose:'关闭模拟持仓',saved:'模拟记录仅保存在此浏览器中。', synced:'模拟记录已同步到Telegram幸存者档案。', loginToSync:'登录Telegram以同步模拟记录。', loginAgain:'Telegram会话已过期，请重新登录。', syncError:'暂时无法同步；本地副本已保留。',rules:'净盈亏包含买卖两边的DEX费用和滑点，以及两笔交易的网络费和优先费。',cap:'模拟金额上限0.05 SOL。不创建钱包，不进行真实交易。',ageUnknown:'未知',justNow:'刚刚',mins:'分钟前',hours:'小时前',days:'天前',needAmount:'模拟金额必须大于0且不超过0.05 SOL。',noPair:'当前没有可用的SOL交易对。',buyOk:'模拟持仓已开启。未发送交易。',positionLimit:'同时只允许一个模拟持仓。',clear:'清除本地模拟记录',cleared:'本地模拟记录已清除。',refreshDone:'列表已刷新。'},
    tr: {title:'ZOMBIE SNIPER // DEMO',intro:'Herkese açık DEX verileriyle giriş/çıkış kurallarını test edin. Cüzdan bağlanmaz, işlem gönderilmez.',demo:'SADECE DEMO',refresh:'TOKEN AKIŞINI YENİLE',loading:'En yeni herkese açık token profilleri taranıyor…',failed:'Herkese açık akış geçici olarak kullanılamıyor.',source:'Kaynak: DexScreener token profilleri ve güncel parite anlık görüntüleri. Profil yeni lansmanı kanıtlamaz; indeksleme gecikebilir.',amount:'DEMO ALIM MİKTARI (SOL)',target:'NET KÂR HEDEFİ (%)',stop:'NET ZARAR DURDUR (%)',network:'AĞ ÜCRETİ / TX (SOL)',priority:'ÖNCELİK ÜCRETİ / TX (SOL)',dex:'DEX ÜCRETİ / TARAF (%)',slip:'KAYMA / TARAF (%)',assumptions:'Düzenlenebilir maliyet varsayımları; canlı ücret teklifi değildir.',candidates:'SON SOLANA TOKEN PROFİLLERİ',noCandidates:'Uygun SOL paritesi bulunamadı.',token:'TOKEN',age:'PARİTE YAŞI',liquidity:'LİKİDİTE',price:'FİYAT (SOL)',action:'DEMO ALIM',positions:'DEMO POZİSYONLARI',noPositions:'Henüz demo pozisyonu yok.',open:'AÇIK',closed:'KAPALI',entry:'GİRİŞ',current:'GÜNCEL',net:'NET K/Z',targetHit:'NET HEDEFE ULAŞILDI — SİMÜLE SATIŞ',stopHit:'STOP-LOSS TETİKLENDİ — SİMÜLE SATIŞ',manualClose:'DEMO POZİSYONUNU KAPAT',saved:'Demo geçmişi yalnızca bu tarayıcıda saklanır.', synced:'Demo geçmişi Telegram profilinizle eşitlendi.', loginToSync:'Demo geçmişini eşitlemek için Telegram ile giriş yapın.', loginAgain:'Telegram oturumunun süresi doldu. Yeniden giriş yapın.', syncError:'Eşitleme kullanılamıyor; yerel kopya korundu.',rules:'Net K/Z; iki yönlü DEX ücreti ve kaymayı, ayrıca iki işlem için ağ ve öncelik ücretlerini içerir.',cap:'Demo işlem limiti 0,05 SOL. Cüzdan ve gerçek işlem yok.',ageUnknown:'bilinmiyor',justNow:'şimdi',mins:' dk önce',hours:' sa önce',days:' gün önce',needAmount:'Miktar sıfırdan büyük ve 0,05 SOL veya daha az olmalı.',noPair:'Güncel SOL paritesi bulunmuyor.',buyOk:'Demo pozisyonu açıldı. İşlem gönderilmedi.',positionLimit:'Aynı anda yalnızca bir açık demo pozisyonu olabilir.',clear:'YEREL DEMO GEÇMİŞİNİ TEMİZLE',cleared:'Yerel demo geçmişi temizlendi.'},
    hi: {title:'ZOMBIE SNIPER // डेमो मोड',intro:'सार्वजनिक DEX डेटा पर एंट्री और एग्ज़िट नियम जाँचें। वॉलेट कनेक्ट नहीं होता और कोई असली लेनदेन नहीं भेजा जाता।',demo:'केवल डेमो',refresh:'टोकन फ़ीड रीफ़्रेश करें',loading:'नवीनतम सार्वजनिक टोकन प्रोफ़ाइल स्कैन हो रही हैं…',failed:'सार्वजनिक फ़ीड अस्थायी रूप से उपलब्ध नहीं है।',source:'स्रोत: DexScreener के नवीनतम प्रोफ़ाइल और मौजूदा पेयर स्नैपशॉट। प्रोफ़ाइल नया लॉन्च साबित नहीं करता; इंडेक्सिंग में देरी हो सकती है।',amount:'डेमो खरीद राशि (SOL)',target:'शुद्ध लाभ लक्ष्य (%)',stop:'शुद्ध स्टॉप-लॉस (%)',network:'नेटवर्क शुल्क / TX (SOL)',priority:'प्रायोरिटी शुल्क / TX (SOL)',dex:'DEX शुल्क / पक्ष (%)',slip:'स्लिपेज / पक्ष (%)',assumptions:'बदलने योग्य लागत अनुमान; लाइव शुल्क कोट नहीं।',candidates:'नवीनतम SOLANA टोकन प्रोफ़ाइल',noCandidates:'उपयुक्त SOL पेयर नहीं मिला।',token:'टोकन',age:'पेयर आयु',liquidity:'लिक्विडिटी',price:'कीमत (SOL)',action:'डेमो खरीद',positions:'डेमो पोज़िशन',noPositions:'अभी कोई डेमो पोज़िशन नहीं।',open:'खुली',closed:'बंद',entry:'एंट्री',current:'वर्तमान',net:'शुद्ध P/L',targetHit:'शुद्ध लक्ष्य पूरा — सिम्युलेटेड बिक्री',stopHit:'स्टॉप-लॉस पूरा — सिम्युलेटेड बिक्री',manualClose:'डेमो पोज़िशन बंद करें',saved:'डेमो इतिहास केवल इसी ब्राउज़र में सहेजा जाता है।', synced:'डेमो इतिहास Telegram प्रोफ़ाइल से सिंक हो गया।', loginToSync:'डेमो इतिहास सिंक करने के लिए Telegram से लॉग इन करें।', loginAgain:'Telegram सत्र समाप्त हो गया। फिर से लॉग इन करें।', syncError:'सिंक उपलब्ध नहीं है; स्थानीय कॉपी सुरक्षित है।',rules:'शुद्ध P/L में दोनों तरफ़ के DEX शुल्क और स्लिपेज तथा दोनों लेनदेन के नेटवर्क और प्रायोरिटी शुल्क शामिल हैं।',cap:'डेमो सीमा 0.05 SOL। कोई वॉलेट या वास्तविक ट्रेड नहीं।',ageUnknown:'अज्ञात',justNow:'अभी',mins:' मिनट पहले',hours:' घंटे पहले',days:' दिन पहले',needAmount:'राशि शून्य से अधिक और 0.05 SOL से अधिक नहीं होनी चाहिए।',noPair:'वर्तमान SOL पेयर उपलब्ध नहीं है।',buyOk:'डेमो पोज़िशन खुली। कोई लेनदेन नहीं भेजा गया।',positionLimit:'एक समय में केवल एक खुली डेमो पोज़िशन।',clear:'स्थानीय डेमो इतिहास साफ़ करें',cleared:'स्थानीय डेमो इतिहास साफ़ किया गया।'}
  };

  const $ = id => document.getElementById(id);
  const state = { lang:'en', candidates:[], positions:[], timer:null, busy:false, syncStatusKey:'saved' };
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
  async function syncFromServer(){
    const token=authToken(),accountId=telegramId();if(!token||!accountId){updateSyncStatus('loginToSync');return;}
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
    }catch(_){if(telegramId()===accountId&&authToken()===token)updateSyncStatus('syncError');}
  }
  function checkAccountChange(){
    const next=storageKey();
    if(next===activeStorageKey)return false;
    activeStorageKey=next;state.positions=[];readStore();renderPositions();
    if(authToken())syncFromServer();else updateSyncStatus('loginToSync');
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
    const dexBuy=position.buySol*c.dex;
    const net=sellAfterCosts-position.buySol-fixedFees;
    return {sellGross,sellAfterCosts,net,pct:position.buySol>0?net/position.buySol*100:0,fees:dexBuy+sellGross*c.dex+fixedFees};
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
      main.append(make('small','sniper-muted',item.address.slice(0,5)+'…'+item.address.slice(-5)+' · '+ageLabel(item.pairCreatedAt)));
      const stats=make('div','sniper-candidate-stats');
      stats.append(make('span', '', t('liquidity')+': $'+fmt(item.liquidityUsd,0)));
      stats.append(make('span', '', t('price')+': '+fmt(item.priceNative,9)));
      const action=make('button','sniper-action',t('action'));
      action.type='button'; action.addEventListener('click',()=>openPaper(item));
      const link=make('a','sniper-link','DEXSCREENER ↗'); link.href=item.url; link.target='_blank'; link.rel='noopener noreferrer';
      row.append(main,stats,link,action);host.append(row);
    });
  }
  function renderPositions(){
    const host=$('sniper-positions'); if(!host)return;
    host.replaceChildren();
    if(!state.positions.length){host.append(make('p','sniper-muted',t('noPositions')));return;}
    state.positions.slice().reverse().forEach(p=>{
      const row=make('div','sniper-position');
      const head=make('div','sniper-position-head');
      head.append(make('strong','',p.symbol+' · '+(p.status==='open'?t('open'):t('closed'))));
      const net=make('strong',p.netPnl>=0?'sniper-positive':'sniper-negative',(p.netPnl>=0?'+':'')+fmt(p.netPnl,6)+' SOL');
      head.append(net);
      const detail=make('div','sniper-position-detail');
      detail.textContent=t('entry')+': '+fmt(p.entryPrice,9)+' SOL · '+t('current')+': '+fmt(p.lastPrice||p.entryPrice,9)+' SOL · '+t('net')+': '+fmt(p.netPct||0,2)+'%';
      row.append(head,detail);
      if(p.status==='open'){
        const close=make('button','sniper-action sniper-close',t('manualClose'));close.type='button';close.addEventListener('click',()=>closePaper(p.id,'manual'));row.append(close);
      } else if(p.exitReason){
        row.append(make('small','sniper-muted',p.exitReason==='target'?t('targetHit'):p.exitReason==='stop'?t('stopHit'):t('closed')));
      }
      host.append(row);
    });
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
      const r=await fetch(API+'/token-profiles/latest/v1',{cache:'no-store'});
      if(!r.ok)throw new Error('profile feed '+r.status);
      const profiles=await r.json();
      const list=(Array.isArray(profiles)?profiles:[]).filter(x=>x&&x.chainId==='solana'&&x.tokenAddress&&x.tokenAddress!==OFFICIAL_MINT).slice(0,12);
      const resolved=await Promise.allSettled(list.map(async profile=>{
        const pair=await fetchPairs(profile.tokenAddress);
        if(!pair)return null;
        return {address:profile.tokenAddress,name:pair.baseToken.name||'Unknown',symbol:pair.baseToken.symbol||'TOKEN',priceNative:Number(pair.priceNative),liquidityUsd:Number(pair.liquidity&&pair.liquidity.usd)||0,pairCreatedAt:Number(pair.pairCreatedAt)||0,url:'https://dexscreener.com/solana/'+encodeURIComponent(profile.tokenAddress)};
      }));
      state.candidates=resolved.filter(x=>x.status==='fulfilled'&&x.value).map(x=>x.value).slice(0,8);
      $('sniper-feed-status').textContent=state.candidates.length?t('refreshDone'):t('noCandidates');
    }catch(_){$('sniper-feed-status').textContent=t('failed');}
    finally{state.busy=false;renderCandidates();}
  }
  function openPaper(item){
    if(state.positions.some(p=>p.status==='open')){alert(t('positionLimit'));return;}
    const buySol=Number($('sniper-size').value);
    if(!Number.isFinite(buySol)||buySol<=0||buySol>0.05){alert(t('needAmount'));return;}
    if(!item||!Number.isFinite(item.priceNative)||item.priceNative<=0){alert(t('noPair'));return;}
    const c=getCosts();
    const quantity=buySol*(1-c.dex)*(1-c.slip)/item.priceNative;
    const p={id:makeUuid(),address:item.address,symbol:item.symbol,name:item.name,buySol,entryPrice:item.priceNative,lastPrice:item.priceNative,quantity,openedAt:Date.now(),status:'open',netPnl:0,netPct:0,exitReason:null,_ownerTelegramId:telegramId()||'guest'};
    state.positions.push(p);saveStore();renderPositions();persistPosition(p);alert(t('buyOk'));
  }
  function closePaper(id,reason){
    const p=state.positions.find(x=>x.id===id&&x.status==='open');if(!p)return;
    const m=metrics(p,p.lastPrice||p.entryPrice);
    p.status='closed';p.closedAt=Date.now();p.netPnl=m.net;p.netPct=m.pct;p.exitReason=reason;
    saveStore();renderPositions();persistPosition(p);
  }
  async function updatePositions(){
    const open=state.positions.filter(p=>p.status==='open');
    for(const p of open){
      try{
        const pair=await fetchPairs(p.address);
        if(!pair)continue;
        p.lastPrice=Number(pair.priceNative)||p.lastPrice;
        const m=metrics(p,p.lastPrice);
        p.netPnl=m.net;p.netPct=m.pct;
        const target=Number($('sniper-target').value)||10;
        const stop=Number($('sniper-stop').value)||0;
        if(m.pct>=target){p.status='closed';p.closedAt=Date.now();p.exitReason='target';}
        else if(stop>0&&m.pct<=-stop){p.status='closed';p.closedAt=Date.now();p.exitReason='stop';}
      }catch(_){}
    }
    saveStore();renderPositions();
    for(const p of open)await persistPosition(p);
  }
  function init(){
    readStore();activeStorageKey=storageKey();translate();
    $('sniper-refresh').addEventListener('click',refreshFeed);
    $('sniper-clear').addEventListener('click',()=>{state.positions=[];saveStore();clearServerHistory();renderPositions();$('sniper-feed-status').textContent=t('cleared');});
    ['sniper-network','sniper-priority','sniper-dex','sniper-slip','sniper-target','sniper-stop'].forEach(id=>$(id).addEventListener('change',updatePositions));
    refreshFeed();if(authToken())syncFromServer().then(updatePositions);else{updateSyncStatus('loginToSync');updatePositions();}
    state.timer=window.setInterval(()=>{checkAccountChange();refreshFeed();updatePositions();},30000);
    document.addEventListener('zombcash:languagechange',translate);
    document.addEventListener('zombcash:survivorlogin',()=>{if(!checkAccountChange())syncFromServer();});
    document.addEventListener('click',event=>{if(event.target&&event.target.closest&&event.target.closest('#survivor-logout'))Promise.resolve().then(checkAccountChange);});
    window.addEventListener('storage',event=>{if(event.key===TOKEN_KEY||event.key===PROFILE_KEY){if(!checkAccountChange()&&authToken())syncFromServer();}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();