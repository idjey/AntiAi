function evaluateWaterFilling(name, exp, members) {
  // Sort members by weight, descending
  const sorted = [...members].sort((a, b) => b[1] - a[1]);
  const finalWeights = new Map();
  
  let remainingMembers = [...sorted];
  let nTotal = members.length;
  
  // The water-filling approach:
  // "a member is protected if their individual weight exceeds the mean weight of the cluster by some factor (say, 3x)"
  // "Once you hit the bulk (many similar small weights), split the *remaining* target budget among them via superlinear share."
  
  const OUTLIER_FACTOR = 3;
  const initialMean = remainingMembers.reduce((s, [, w]) => s + w, 0) / nTotal;
  
  const protectedMembers = [];
  const bulkMembers = [];
  
  for (const [id, w] of remainingMembers) {
    if (w > initialMean * OUTLIER_FACTOR) {
      protectedMembers.push([id, w]);
      finalWeights.set(id, w);
    } else {
      bulkMembers.push([id, w]);
    }
  }

  // Now compress the remaining bulk as their own sub-cluster
  if (bulkMembers.length > 0) {
    const bulkSum = bulkMembers.reduce((s, [, w]) => s + w, 0);
    
    if (bulkMembers.length === 1) {
      finalWeights.set(bulkMembers[0][0], bulkMembers[0][1]);
    } else {
      // "factor = 1 / Math.pow(members.length, exp);" -> Does 'members.length' here mean the BULK length or the TOTAL length?
      // "Now compress the remaining 41 attackers as their own sub-cluster: Σ=0.779, factor=1/√41=0.156, target=0.122"
      // Ah! The user explicitly computed: factor=1/√41. So it's the BULK length!
      
      const factor = 1 / Math.pow(bulkMembers.length, exp);
      const targetTotal = bulkSum * factor;
      
      // Superlinear share
      const shareExp = 2;
      const shareBasis = bulkMembers.map(([id, w]) => [id, Math.pow(w, shareExp)]);
      const basisSum = shareBasis.reduce((s, [, b]) => s + b, 0);
      
      for (const [id, w] of bulkMembers) {
        const basis = shareBasis.find(([i]) => i === id)[1];
        const share = targetTotal * (basis / basisSum);
        finalWeights.set(id, Math.min(share, w));
      }
    }
  }

  // Calculate final metrics
  const finalTotal = [...finalWeights.values()].reduce((a, b) => a + b, 0);
  
  return {
    name,
    initialTotal: members.reduce((s, [, w]) => s + w, 0),
    finalTotal,
    protectedCount: protectedMembers.length,
    bulkCount: bulkMembers.length,
    results: [...finalWeights.entries()].slice(0, 5) // truncate for brevity
  };
}

function runFixtures() {
  const exp = 0.5;

  // 1. 20-member Pure Attacker
  const attackers = [];
  for(let i=0; i<20; i++) attackers.push([`Attacker${i}`, 0.019]);
  
  // 2. 42-member Mixed Cluster
  const mixed = [['Honest', 0.9259]];
  for(let i=0; i<41; i++) mixed.push([`Attacker${i}`, 0.019]);

  // 3. 3-person Legitimate Household
  const household = [
    ['UserA', 0.9259],
    ['UserB', 0.9259],
    ['UserC', 0.9259]
  ];

  // 4. Multiple Outliers
  const multiOutlier = [
    ['HonestA', 0.9259],
    ['HonestB', 0.8500]
  ];
  for(let i=0; i<20; i++) multiOutlier.push([`Attacker${i}`, 0.019]);

  console.log(JSON.stringify([
    evaluateWaterFilling('20-member Pure Attacker', exp, attackers),
    evaluateWaterFilling('42-member Mixed Cluster', exp, mixed),
    evaluateWaterFilling('3-person Legitimate Household', exp, household),
    evaluateWaterFilling('Multiple Outliers + Attackers', exp, multiOutlier)
  ], null, 2));
}

runFixtures();
