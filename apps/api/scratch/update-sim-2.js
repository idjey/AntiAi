const fs = require('fs');

const file = fs.readFileSync('C:\\Users\\Dj_ka\\OneDrive\\Documents\\AntiAi\\apps\\api\\test\\run-brigade-sim.ts', 'utf8');

// Fix Honest cohort timing so they don't form a household cluster
let newContent = file.replace(
  `for (let s=1; s<5; s++) {
        const diffTime = new Date(simBase.getTime() + 12 * 60 * 60 * 1000 + i * 60 * 1000);
        await submitAtt(honestKeys[i], 'https://real', diffTime, subjectHashes[s]);
      }`,
  `for (let s=1; s<5; s++) {
        const diffTime = new Date(simBase.getTime() + (i * 100 + s * 10) * 60 * 60 * 1000); // completely different time buckets
        await submitAtt(honestKeys[i], 'https://real', diffTime, subjectHashes[s]);
      }`
);

// Add Jaccard computation printing before running worker
const runClusteringIndex = newContent.indexOf("// --- Run Clustering Worker ---");

const manualJaccardStr = `
    // --- Manually verify and print Honest vs Botnet Jaccard Similarity ---
    const minhash = await require('../src/modules/clustering/minhash').MinHash.create(128);
    const honestAtts = await prisma.attestation.findMany({ where: { attesterId: honestKeys[0].id } });
    const naiveAtts = await prisma.attestation.findMany({ where: { attesterId: naiveKeys[0].id } });
    
    const getBuckets = (atts: any[]) => atts.map(a => \`\${a.subjectId}:\${Math.floor(a.receivedAt.getTime() / (10 * 60 * 1000))}\`);
    const honestSig = minhash.computeSignature(getBuckets(honestAtts));
    const naiveSig = minhash.computeSignature(getBuckets(naiveAtts));
    
    const jaccardScore = minhash.estimateJaccard(honestSig, naiveSig);
    console.log(\`\\n[Jaccard Verification] Honest[0] vs Naive[0]: \${jaccardScore.toFixed(3)}\\n\`);
`;

newContent = newContent.substring(0, runClusteringIndex) + manualJaccardStr + newContent.substring(runClusteringIndex);

fs.writeFileSync('C:\\Users\\Dj_ka\\OneDrive\\Documents\\AntiAi\\apps\\api\\test\\run-brigade-sim.ts', newContent);
console.log('done');
