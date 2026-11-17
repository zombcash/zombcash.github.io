(() => {
  'use strict';
  const root = document.getElementById('zombcash-ai-arena');
  if (!root) return;
  const API = 'https://gen.pollinations.ai/alpha/decisions';
  let MODELS = [];
  let catalogReady = false;
  const CATALOG = 'https://gen.pollinations.ai/models?category=decision';
  const $ = (id) => root.querySelector('#' + id);
  let pollenKey = null;
  let busy = false;
  let round = 0;
  let finished = false;
  let score = [0, 0];
  let offline = true;
  const actions = ['attack', 'defend', 'feint'];
  const labels = { attack: 'ATTACK', defend: 'DEFEND', feint: 'FEINT' };
  const payoff = {
    attack: { attack: 0, defend: -1, feint: 2 },
    defend: { attack: 1, defend: 0, feint: -1 },
    feint: { attack: -2, defend: 1, feint: 0 }
  };
  const log = (message) => {
    const line = document.createElement('p');
    line.className = 'zai-log-line';
    line.textContent = message;
    $('zai-log').prepend(line);
  };
  const status = (message) => { $('zai-status').textContent = message; };
  const connect = document.querySelector('#zai-connect');
  if (connect) {
    connect.addEventListener('change', () => {
      pollenKey = connect.apiKey || null;
      offline = !pollenKey;
      $('zai-mode').textContent = offline ? 'FREE SIMULATION' : 'LIVE POLLINATIONS';
      $('zai-live').textContent = offline ? 'Connect your own Pollen to let live models play. Free simulation is always available.' : 'Connected. Live model calls use only your approved Pollen budget.';
      status(offline ? 'Offline AI ready' : (catalogReady && MODELS.length >= 2 ? 'Pollinations connected · free models ready' : 'Checking free decision models…'));
      $('zai-play').disabled = !!(pollenKey && (!catalogReady || MODELS.length < 2));
    });
  }
  function renderModelOptions() {
    const selects = [$('zai-model-a'), $('zai-model-b')];
    selects.forEach((select, index) => {
      select.replaceChildren();
      MODELS.forEach((model) => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        select.append(option);
      });
      if (MODELS.length) select.value = MODELS[Math.min(index, MODELS.length - 1)].id;
      select.disabled = MODELS.length === 0;
    });
  }
  async function loadDecisionModels() {
    try {
      const response = await fetch(CATALOG, { headers: { 'Accept': 'application/json' }, cache: 'no-store' });
      if (!response.ok) throw new Error('Model catalogue returned HTTP ' + response.status);
      const payload = await response.json();
      const entries = Array.isArray(payload) ? payload :
        Array.isArray(payload.models) ? payload.models :
        Array.isArray(payload.data) ? payload.data : [];
      MODELS = entries.filter((model) =>
        model && model.paid_only === false &&
        Array.isArray(model.supported_endpoints) &&
        model.supported_endpoints.includes('/alpha/decisions')
      ).map((model) => {
        const id = model.id || model.name || model.model;
        return id ? { id, name: model.title || model.display_name || model.name || id } : null;
      }).filter(Boolean);
      catalogReady = true;
      renderModelOptions();
      if (pollenKey) {
        status(MODELS.length >= 2 ? 'Free decision models ready' : 'Fewer than two Quest-Pollen decision models are available');
        $('zai-play').disabled = MODELS.length < 2;
      }
      if (!MODELS.length) log('No decision models currently advertise both Quest-Pollen access and /alpha/decisions support.');
    } catch (error) {
      catalogReady = false;
      MODELS = [];
      renderModelOptions();
      if (pollenKey) {
        status('Could not verify free model access');
        $('zai-play').disabled = true;
      }
      log('Could not load the live decision-model catalogue: ' + error.message + '. Live mode remains disabled to avoid paid-only calls.');
    }
  }
  function randomAction(seed) {
    // Deterministic local simulation: no network request and no Pollen use.
    const n = Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
    return actions[Math.floor(n * actions.length)];
  }
  async function askModel(model, opponent, myScore, theirScore) {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + pollenKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        state: 'You are a combat AI in ZombieCash Outbreak Arena. Win a five-point tactical duel. You are ' + model + '. Current round ' + round + '. Your score ' + myScore + ', opponent score ' + theirScore + '. Opponent is ' + opponent + '. Choose one action. Attack beats feint, defend counters attack, feint exploits defend. You do not know the opponent action.',
        questions: {
          move: {
            type: 'choice',
            instructions: 'Choose your next tactical action.',
            criteria: {
              attack: 'Aggressive strike. Beats feint, loses to defend.',
              defend: 'Guard. Counters attack, vulnerable to feint.',
              feint: 'Bait. Beats defend, loses to attack.'
            }
          }
        }
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || data.message || 'Pollinations request failed (' + response.status + ')');
    const answer = data.answers?.move?.choice;
    if (!actions.includes(answer)) throw new Error('The decision model returned an unsupported move.');
    return { move: answer, confidence: data.answers.move.confidence };
  }
  function paint() {
    $('zai-round').textContent = String(round);
    $('zai-score-a').textContent = String(score[0]);
    $('zai-score-b').textContent = String(score[1]);
  }
  async function playRound() {
    if (busy || finished) return;
    if (pollenKey && (!catalogReady || MODELS.length < 2)) {
      status('Live mode requires two verified Quest-Pollen decision models.');
      return;
    }
    const modelA = $('zai-model-a').value;
    const modelB = $('zai-model-b').value;
    if (pollenKey && (!MODELS.some(model => model.id === modelA) || !MODELS.some(model => model.id === modelB))) {
      status('Select models verified for Quest Pollen.');
      return;
    }
    busy = true;
    $('zai-play').disabled = true;
    const aName = MODELS.find(m => m.id === modelA)?.name || modelA;
    const bName = MODELS.find(m => m.id === modelB)?.name || modelB;
    round++;
    try {
      let a, b;
      if (pollenKey) {
        status('Live models are deciding…');
        [a, b] = await Promise.all([
          askModel(modelA, bName, score[0], score[1]),
          askModel(modelB, aName, score[1], score[0])
        ]);
      } else {
        a = { move: randomAction(round * 17 + 1) };
        b = { move: randomAction(round * 31 + 9) };
      }
      const result = payoff[a.move][b.move];
      if (result > 0) score[0]++;
      if (result < 0) score[1]++;
      $('zai-last').textContent = aName + ': ' + labels[a.move] + '  ·  ' + bName + ': ' + labels[b.move];
      log('ROUND ' + round + ' — ' + aName + ' chose ' + labels[a.move] + '; ' + bName + ' chose ' + labels[b.move] + '. ' + (result > 0 ? aName + ' wins the exchange.' : result < 0 ? bName + ' wins the exchange.' : 'Draw.'));
      paint();
      if (score[0] >= 5 || score[1] >= 5) {
        finished = true;
        status((score[0] >= 5 ? aName : bName) + ' wins the duel!');
        log((score[0] >= 5 ? aName : bName) + ' wins the match. Reset to play again.');
      } else {
        status(pollenKey ? 'Live round complete' : 'Free simulation round complete');
      }
    } catch (error) {
      round--;
      status('Live request failed');
      log('Could not complete live round: ' + error.message + '. No offline fallback was charged.');
    } finally {
      busy = false;
      $('zai-play').disabled = !!(pollenKey && (!catalogReady || MODELS.length < 2));
    }
  }
  function reset() {
    if (busy) return;
    round = 0; finished = false; score = [0, 0];
    $('zai-log').replaceChildren();
    $('zai-last').textContent = 'No round played yet';
    paint(); status(pollenKey ? 'Pollinations connected' : 'Free simulation ready');
    log('New duel started. First to five points wins.');
  }
  $('zai-play').addEventListener('click', playRound);
  $('zai-reset').addEventListener('click', reset);
  $('zai-mode').textContent = 'FREE SIMULATION';
  $('zai-live').textContent = 'Connect your own Pollen to let live models play. Free simulation is always available.';
  renderModelOptions();
  reset();
  loadDecisionModels();
})();