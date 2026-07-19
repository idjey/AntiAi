import { WeightsService } from '../src/modules/aggregation/weights.service';

const ws = new WeightsService({} as any, {} as any);
const rawMap = new Map<string, number>();
const attesterMap = new Map<string, string>();
const cluster = new Set<string>();

rawMap.set('midrep', 0.20); // wait, is the raw weight actually 0.20?
attesterMap.set('midrep', 'attester_midrep');
cluster.add('attester_midrep');

for(let i=0; i<20; i++) {
  rawMap.set(`naive_${i}`, 0.05);
  attesterMap.set(`naive_${i}`, `attester_naive_${i}`);
  cluster.add(`attester_naive_${i}`);
}

const cfg = {
  correlation: {
    clusterExponent: 0.5,
    clusterOutlierFactor: 3.0,
    clusterShareExponent: 2.0
  }
} as any;

const res = (ws as any).applyClusterCompression(rawMap, attesterMap, [cluster], cfg);

console.log('midrep output:', res.get('midrep'));
