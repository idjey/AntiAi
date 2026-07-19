import { WeightsService } from './src/modules/aggregation/weights.service';
import { ReputationParams } from './src/modules/reputation/types';

function runCompression(name: string, members: [string, number][], factor: number) {
  const ws = new WeightsService({} as any, {} as any);
  
  const attesterMap = new Map<string, string>();
  const rawMap = new Map<string, number>();
  const cluster = new Set<string>();
  
  for (const [id, w] of members) {
    const attesterId = `attester_${id}`;
    attesterMap.set(id, attesterId);
    rawMap.set(id, w);
    cluster.add(attesterId);
  }
  
  const cfg = {
    correlation: {
      clusterExponent: 0.5,
      clusterOutlierFactor: factor,
      clusterShareExponent: 2.0
    }
  } as any;
  
  const res = (ws as any).applyClusterCompression(rawMap, attesterMap, [cluster], cfg);
  
  console.log(`\n--- ${name} (Factor: ${factor}) ---`);
  console.log(`Input Mean: ${members.reduce((s, [, w]) => s + w, 0) / members.length}`);
  for (const [id, w] of members) {
    const out = res.get(id);
    const extracted = Math.abs(out - w) < 0.0001;
    if (id.startsWith('Attacker')) {
      if (id === 'AttackerMid') {
        console.log(`${id} (${w}): -> ${out.toFixed(4)} ${extracted ? '[PROTECTED]' : '[COMPRESSED]'}`);
      }
    } else {
      console.log(`${id} (${w}): -> ${out.toFixed(4)} ${extracted ? '[PROTECTED]' : '[COMPRESSED]'}`);
    }
  }
}

const case6: [string, number][] = [['AttackerMid', 0.25]];
for(let i=0; i<20; i++) case6.push([`AttackerBot${i}`, 0.019]);

runCompression('Case 6 with 1.5x', case6, 1.5);
runCompression('Case 6 with 3.0x', case6, 3.0);
runCompression('Case 6 with 10.0x', case6, 10.0);

const case4: [string, number][] = [['HonestA', 0.9259], ['HonestB', 0.8500]];
for(let i=0; i<20; i++) case4.push([`AttackerBot${i}`, 0.019]);

runCompression('Case 4 with 10.0x', case4, 10.0);
