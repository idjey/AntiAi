import { WeightsService } from '../src/modules/aggregation/weights.service';
import { ReputationParams } from '../src/modules/reputation/types';

describe('WeightsService - applyClusterCompression', () => {
  let weightsService: WeightsService;
  
  // A helper function to invoke the internal compression logic
  const runCompression = (name: string, members: [string, number][], exp: number = 0.5) => {
    // We recreate the logic purely for unit test precision, because applyClusterCompression
    // operates on maps and sets. We can just invoke it properly:
    
    const ws = new WeightsService({} as any, {} as any);
    
    const attesterMap = new Map<string, any>();
    const rawMap = new Map<string, number>();
    const cluster = new Set<any>();
    
    for (const [id, w] of members) {
      const attesterId = `attester_${id}`;
      attesterMap.set(id, attesterId);
      rawMap.set(id, w);
      cluster.add(attesterId);
    }
    
    const cfg = {
      correlation: {
        clusterExponent: exp,
        clusterOutlierFactor: 3.0,
        clusterShareExponent: 2.0
      }
    } as any;
    
    // We need to bypass the private visibility of applyClusterCompression if we test the service,
    // or we can test it through applyReputationWeights. But it's easier to export the algorithm logic,
    // or cast ws to any.
    const result = (ws as any).applyClusterCompression(rawMap, attesterMap, [cluster], cfg);
    return result;
  };

  it('Case 1: 20-member Pure Attacker', () => {
    const attackers: [string, number][] = [];
    for(let i=0; i<20; i++) attackers.push([`Attacker${i}`, 0.019]);
    
    const res = runCompression('20-member Pure Attacker', attackers);
    const total = [...res.values()].reduce((a, b) => a + b, 0);
    
    expect(total).toBeCloseTo(0.085, 3);
    for(let i=0; i<20; i++) {
      expect(res.get(`Attacker${i}`)).toBeCloseTo(0.00425, 4);
    }
  });

  it('Case 2: 42-member Mixed Cluster', () => {
    const mixed: [string, number][] = [['Honest', 0.9259]];
    for(let i=0; i<41; i++) mixed.push([`Attacker${i}`, 0.019]);
    
    const res = runCompression('42-member Mixed Cluster', mixed);
    const total = [...res.values()].reduce((a, b) => a + b, 0);
    
    expect(total).toBeCloseTo(1.0475, 3);
    expect(res.get('Honest')).toBeCloseTo(0.9259, 4); // Exact original weight
    
    for(let i=0; i<41; i++) {
      expect(res.get(`Attacker${i}`)).toBeCloseTo(0.00296, 4);
    }
  });

  it('Case 3: 3-person Legitimate Household', () => {
    const household: [string, number][] = [
      ['UserA', 0.9259],
      ['UserB', 0.9259],
      ['UserC', 0.9259]
    ];
    
    const res = runCompression('3-person Legitimate Household', household);
    
    for (const id of ['UserA', 'UserB', 'UserC']) {
      expect(res.get(id)).toBeCloseTo(0.5345, 4);
    }
  });

  it('Case 4: Multiple Outliers + Attackers', () => {
    const multi: [string, number][] = [
      ['HonestA', 0.9259],
      ['HonestB', 0.8500]
    ];
    for(let i=0; i<20; i++) multi.push([`Attacker${i}`, 0.019]);
    
    const res = runCompression('Multiple Outliers + Attackers', multi);
    
    expect(res.get('HonestA')).toBeCloseTo(0.9259, 4);
    expect(res.get('HonestB')).toBeCloseTo(0.8500, 4);
    
    for(let i=0; i<20; i++) {
      expect(res.get(`Attacker${i}`)).toBeCloseTo(0.00425, 4);
    }
  });

  it('Case 5: Graduated Outliers (Iterative Extraction)', () => {
    const graduated: [string, number][] = [
      ['HonestA', 0.9000],
      ['HonestB', 0.6000],
      ['HonestC', 0.4000]
    ];
    for(let i=0; i<20; i++) graduated.push([`Attacker${i}`, 0.019]);
    
    const res = runCompression('Graduated Outliers', graduated);
    
    // In a single-pass loop, HonestC might get swept into the bulk.
    // Iterative loop extracts all three because extracting A lowers the mean, which extracts B, which lowers mean to extract C.
    expect(res.get('HonestA')).toBeCloseTo(0.9000, 4);
    expect(res.get('HonestB')).toBeCloseTo(0.6000, 4);
    expect(res.get('HonestC')).toBeCloseTo(0.4000, 4);
    
    for(let i=0; i<20; i++) {
      expect(res.get(`Attacker${i}`)).toBeCloseTo(0.00425, 4);
    }
  });
});
