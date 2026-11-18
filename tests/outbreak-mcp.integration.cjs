const endpoint = 'https://owmiywvmtdjyeyfxlpdp.supabase.co/functions/v1/outbreak-mcp';
const key = process.env.SUPABASE_ANON_KEY;
if (!key) throw new Error('SUPABASE_ANON_KEY is required for the live MCP integration test');

let nextId = 1;
async function rpc(method, params = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + key,
      apikey: key,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params }),
  });
  const body = response.status === 202 ? null : await response.json();
  if (!response.ok) throw new Error('MCP HTTP ' + response.status + ': ' + JSON.stringify(body));
  return body;
}
async function tool(name, args = {}) {
  const result = await rpc('tools/call', { name, arguments: args });
  if (result.error) throw new Error(result.error.message);
  const value = result.result;
  if (value.isError) return value;
  const text = value.content?.find(x => x.type === 'text')?.text;
  return text ? JSON.parse(text) : value.structuredContent || value;
}
(async () => {
  const initialized = await rpc('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'ZombieCash CI Inspector', version: '1.0.0' },
  });
  if (initialized.result?.serverInfo?.name !== 'zombcash-outbreak') throw new Error('MCP initialize handshake failed');
  await rpc('notifications/initialized');
  const listed = await rpc('tools/list');
  const names = (listed.result?.tools || []).map(x => x.name);
  for (const name of ['create_match', 'join_match', 'get_match_state', 'submit_action']) {
    if (!names.includes(name)) throw new Error('Missing MCP tool: ' + name);
  }

  const created = await tool('create_match', { name: 'CI strategic outbreak' });
  const matchId = created.match_id;
  if (created.map?.width !== 18 || created.map?.height !== 14) throw new Error('MCP did not create the large tactical map');
  if (created.units?.survivors?.length !== 18 || created.units?.infected?.length !== 6) throw new Error('MCP did not create the large survivor and infected groups');
  const survivor = await tool('join_match', { match_id: matchId, agent_id: 'ci-survivor', role: 'survivor' });
  const infected = await tool('join_match', { match_id: matchId, agent_id: 'ci-infected', role: 'infected' });
  if (!survivor.agent_token || !infected.agent_token) throw new Error('Faction controller tokens were not issued');

  const spoofed = await tool('submit_action', { match_id: matchId, agent_id: 'ci-survivor', agent_token: 'invalid-token', unit_id: 'H1', action: 'wait' });
  if (!spoofed.isError) throw new Error('Server accepted an invalid faction controller token');

  const first = await tool('submit_action', { match_id: matchId, agent_id: 'ci-survivor', agent_token: survivor.agent_token, unit_id: 'H1', action: 'wait' });
  const h1 = first.units.survivors.find(unit => unit.id === 'H1');
  if (!h1?.acted) throw new Error('Server did not record the survivor unit action');
  const duplicate = await tool('submit_action', { match_id: matchId, agent_id: 'ci-survivor', agent_token: survivor.agent_token, unit_id: 'H1', action: 'wait' });
  if (!duplicate.isError) throw new Error('Server allowed the same unit to act twice in one round');

  const second = await tool('submit_action', { match_id: matchId, agent_id: 'ci-infected', agent_token: infected.agent_token, unit_id: 'Z1', action: 'wait' });
  const z1 = second.units.infected.find(unit => unit.id === 'Z1');
  if (!z1?.acted) throw new Error('Server did not record the infected unit action');
  const persisted = await tool('get_match_state', { match_id: matchId });
  if (persisted.turn !== 0 || persisted.controllers.length !== 2 || !persisted.units.survivors.find(unit => unit.id === 'H1')?.acted) {
    throw new Error('Match state did not persist across MCP requests');
  }
  console.log('Live MCP integration passed: initialize, tools/list, 18x14 world, faction join, token security, per-unit actions and persistent state.');
})().catch(error => { console.error(error); process.exit(1); });
