// Pinned fixtures for weight compression
function evaluateCluster(name, clusterExponent, members) {
  const sum = members.reduce((s, [, w]) => s + w, 0);
  if (sum === 0) return { members: [] };

  const compressedTotal = Math.pow(sum, 1 / Math.pow(members.length, clusterExponent));
  
  if (compressedTotal >= sum) {
    return { name, sum, compressedTotal, members: members.map(([id, w]) => [id, w]) };
  }

  const shareExp = 2;
  const shareBasis = members.map(([id, w]) => [id, Math.pow(w, shareExp)]);
  const basisSum = shareBasis.reduce((s, [, b]) => s + b, 0);

  const finalMembers = members.map(([id, individual]) => {
    const basis = shareBasis.find(([i]) => i === id)[1];
    const share = compressedTotal * (basis / basisSum);
    return [id, Math.min(share, individual)];
  });

  return { name, sum, compressedTotal, members: finalMembers };
}

function runFixtures() {
  const exp = 0.5;

  // 1. 42-member mixed cluster
  const mixed = [];
  mixed.push(['Honest', 0.9259]);
  for(let i=0; i<41; i++) mixed.push([`Attacker${i}`, 0.019]);
  const res1 = evaluateCluster('42-member Mixed Cluster', exp, mixed);

  // 2. Pure 20-attacker cluster
  const attackers = [];
  for(let i=0; i<20; i++) attackers.push([`Attacker${i}`, 0.019]);
  const res2 = evaluateCluster('20-member Pure Attacker', exp, attackers);

  // 3. 3-person household
  const household = [];
  household.push(['UserA', 0.9259]);
  household.push(['UserB', 0.9259]);
  household.push(['UserC', 0.9259]);
  const res3 = evaluateCluster('3-person Legitimate Household', exp, household);

  console.log(JSON.stringify([res1, res2, res3], null, 2));
}

runFixtures();
