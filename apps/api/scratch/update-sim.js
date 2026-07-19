const fs = require('fs');

const file = fs.readFileSync('C:\\Users\\Dj_ka\\OneDrive\\Documents\\AntiAi\\apps\\api\\test\\run-brigade-sim.ts', 'utf8');

let newContent = file.replace(
  "const subjectHash = randomUUID();",
  `const subjectHashes = [randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID()];
    const subjectHash = subjectHashes[0]; // The main one we aggregate for`
);

newContent = newContent.replace(
  "const carefulKeys = await createCohort(20, 0.10, 'careful');",
  `const carefulKeys = await createCohort(20, 0.10, 'careful');
    const evasionKeys = await createCohort(20, 0.10, 'evasion'); // 2 subject botnet
    const midRepKeys = await createCohort(1, 0.40, 'midrep');`
);

// We need to rewrite the "Drive actual attestation behavior" part
const driveBehaviorIndex = newContent.indexOf("// --- Drive actual attestation behavior ---");
const runClusteringIndex = newContent.indexOf("// --- Run Clustering Worker ---");

const driveBehaviorOld = newContent.substring(driveBehaviorIndex, runClusteringIndex);

const driveBehaviorNew = `// --- Drive actual attestation behavior ---
    
    // The whole sim happens on 2026-07-19 so the worker sees them all
    const simBase = new Date('2026-07-19T10:00:00Z');

    // Helper to submit to subjects
    const submitToSubjects = async (keyInfo: any, sourceUrl: string, baseTime: Date, numSubjects: number, timeSpacingMs: number = 0) => {
      for(let s=0; s<numSubjects; s++) {
        const time = new Date(baseTime.getTime() + s * timeSpacingMs);
        const savedHash = subjectHash; // save global
        // override global subjectHash for submitAtt helper
        global.testSubjectHash = subjectHashes[s];
        await submitAtt(keyInfo, sourceUrl, time, global.testSubjectHash);
      }
    };

    // Naive Cohort (20 users, 5 subjects, same timestamp for each subject)
    for (const key of naiveKeys) {
      await submitToSubjects(key, 'https://fake-naive', simBase, 5);
    }

    // Patient Cohort (20 users, 5 subjects, same timestamp)
    for (const key of patientKeys) {
      await submitToSubjects(key, 'https://fake-patient', simBase, 5);
    }

    // Careful Cohort (20 users, 5 subjects, temporally spread over 5 hours per subject)
    for (let i = 0; i < carefulKeys.length; i++) {
      const time = new Date(simBase.getTime() + i * 15 * 60 * 1000); // 15 mins apart
      await submitToSubjects(carefulKeys[i], 'https://fake-careful', time, 5);
    }

    // MidRep Attacker (Case 6) (1 user, 5 subjects, identical to Naive)
    for (const key of midRepKeys) {
      await submitToSubjects(key, 'https://fake-midrep', simBase, 5);
    }

    // Evasion Botnet (20 users, only 2 subjects, identical timestamp)
    for (const key of evasionKeys) {
      await submitToSubjects(key, 'https://fake-evasion', simBase, 2);
    }

    // Honest Cohort (3 users, 5 subjects total)
    // 1st subject: Collides exactly with Naive at simBase (1 shared bucket)
    // 2nd-5th subjects: Completely random timestamp 12 hours later (no shared bucket with botnet)
    for (let i = 0; i < honestKeys.length; i++) {
      // Subject 1: Collide
      await submitAtt(honestKeys[i], 'https://real', simBase, subjectHashes[0]);
      
      // Subject 2-5: No collision
      for (let s=1; s<5; s++) {
        const diffTime = new Date(simBase.getTime() + 12 * 60 * 60 * 1000 + i * 60 * 1000);
        await submitAtt(honestKeys[i], 'https://real', diffTime, subjectHashes[s]);
      }
    }

    `;

newContent = newContent.replace(driveBehaviorOld, driveBehaviorNew);

// Also we need to modify submitAtt to accept subjectHash override
newContent = newContent.replace(
  "const submitAtt = async (keyInfo: any, sourceUrl: string, clientTime: Date) => {",
  "const submitAtt = async (keyInfo: any, sourceUrl: string, clientTime: Date, targetHash: string = subjectHash) => {"
);
newContent = newContent.replace(
  "hash: subjectHash,",
  "hash: targetHash,"
);

// We need to print evasion and midrep weight
const weightDeclIndex = newContent.indexOf("let carefulWeight = 0;");
newContent = newContent.replace(
  "let carefulWeight = 0;",
  `let carefulWeight = 0;
    let evasionWeight = 0;
    let midRepWeight = 0;`
);

const weightAddIndex = newContent.indexOf("if (carefulKeys.map(k=>k.id).includes(att.attesterId)) carefulWeight += w;");
newContent = newContent.replace(
  "if (carefulKeys.map(k=>k.id).includes(att.attesterId)) carefulWeight += w;",
  `if (carefulKeys.map(k=>k.id).includes(att.attesterId)) carefulWeight += w;
      if (evasionKeys.map(k=>k.id).includes(att.attesterId)) evasionWeight += w;
      if (midRepKeys.map(k=>k.id).includes(att.attesterId)) midRepWeight += w;`
);

const weightPrintIndex = newContent.indexOf("console.log(`Per-User Careful Weight:");
newContent = newContent.replace(
  "console.log(`Per-User Careful Weight: ${(weightsMap.get(allAtts.find(a => carefulKeys.map(k=>k.id).includes(a.attesterId))?.id || '') || 0).toFixed(4)}`);",
  `console.log(\`Per-User Careful Weight: \${(weightsMap.get(allAtts.find(a => carefulKeys.map(k=>k.id).includes(a.attesterId))?.id || '') || 0).toFixed(4)}\`);
    console.log(\`Total Evasion Attack Weight: \${evasionWeight.toFixed(4)} (20 users at R=0.10, 2 subjects)\`);
    console.log(\`Mid-Rep Attacker (Case 6) Weight: \${midRepWeight.toFixed(4)} (1 user at R=0.40, clustered with Naive)\`);`
);

// Update determine cohorts
newContent = newContent.replace(
  "if (members.includes(carefulKeys[0].id)) console.log(`=> This cluster caught the CAREFUL cohort.`);",
  `if (members.includes(carefulKeys[0].id)) console.log(\`=> This cluster caught the CAREFUL cohort.\`);
      if (members.includes(evasionKeys[0].id)) console.log(\`=> This cluster caught the EVASION cohort.\`);
      if (members.includes(midRepKeys[0].id)) console.log(\`=> This cluster caught the MIDREP cohort.\`);`
);

fs.writeFileSync('C:\\Users\\Dj_ka\\OneDrive\\Documents\\AntiAi\\apps\\api\\test\\run-brigade-sim.ts', newContent);
console.log('done');
