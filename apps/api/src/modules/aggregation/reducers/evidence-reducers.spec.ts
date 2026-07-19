import { 
  pickBestProvenance, 
  countByCategory, 
  topContextNotes, 
  indexCorroborations, 
  MinimalAttestation 
} from './evidence-reducers';

describe('Evidence Reducers', () => {

  const baseAttestation: MinimalAttestation = {
    id: 'a1',
    payloadHash: 'hash1',
    claimType: 'PROVENANCE_FOUND',
    status: 'PENDING',
    claimPayload: {},
    receivedAt: new Date(),
    attester: { keyId: 'k1', status: 'ACTIVE', reputation: 0.1, deviceAttested: false, canaryDownweighted: false },
  };

  describe('pickBestProvenance', () => {
    it('MACHINE_VERIFIED outranks human claim with 50 corroborations', () => {
      const humanClaim: MinimalAttestation = {
        ...baseAttestation,
        id: 'h1', payloadHash: 'human_hash', status: 'PENDING',
      };
      
      const machineClaim: MinimalAttestation = {
        ...baseAttestation,
        id: 'm1', payloadHash: 'machine_hash', status: 'MACHINE_VERIFIED',
      };

      const corr = {
        'human_hash': { confirms: 50, disputes: 0 },
        'machine_hash': { confirms: 0, disputes: 0 },
      };

      const best = pickBestProvenance([humanClaim, machineClaim], corr);
      expect(best?.id).toBe('m1'); // The invariant holds
    });

    it('sorts human claims by net corroboration', () => {
      const claim1: MinimalAttestation = { ...baseAttestation, id: 'c1', payloadHash: 'hash1' };
      const claim2: MinimalAttestation = { ...baseAttestation, id: 'c2', payloadHash: 'hash2' };
      
      const corr = {
        'hash1': { confirms: 10, disputes: 5 }, // net 5
        'hash2': { confirms: 20, disputes: 2 }, // net 18
      };

      const best = pickBestProvenance([claim1, claim2], corr);
      expect(best?.id).toBe('c2');
    });

    it('breaks ties by recency (oldest wins)', () => {
      const claim1: MinimalAttestation = { 
        ...baseAttestation, id: 'c1', payloadHash: 'hash1', receivedAt: new Date(2000) 
      };
      const claim2: MinimalAttestation = { 
        ...baseAttestation, id: 'c2', payloadHash: 'hash2', receivedAt: new Date(1000) 
      };
      
      const corr = {}; // both net 0
      
      const best = pickBestProvenance([claim1, claim2], corr);
      expect(best?.id).toBe('c2'); // c2 is older
    });
  });

  describe('topContextNotes', () => {
    it('sorts by net descending, then newest first', () => {
      const notes: MinimalAttestation[] = [
        { ...baseAttestation, id: 'n1', payloadHash: 'hash1', claimType: 'CONTEXT_NOTE', claimPayload: { note: 'A' }, receivedAt: new Date(1000) },
        { ...baseAttestation, id: 'n2', payloadHash: 'hash2', claimType: 'CONTEXT_NOTE', claimPayload: { note: 'B' }, receivedAt: new Date(2000) },
        { ...baseAttestation, id: 'n3', payloadHash: 'hash3', claimType: 'CONTEXT_NOTE', claimPayload: { note: 'C' }, receivedAt: new Date(3000) },
      ];

      const corr = {
        'hash1': { confirms: 5, disputes: 0 }, // net 5
        'hash2': { confirms: 5, disputes: 0 }, // net 5 (tie)
        'hash3': { confirms: 10, disputes: 2 }, // net 8
      };

      const top = topContextNotes(notes, corr, 3);
      
      expect(top[0].note).toBe('C'); // Highest net
      expect(top[1].note).toBe('B'); // Tie for 5, but n2 is newer than n1
      expect(top[2].note).toBe('A');
    });
  });

  describe('countByCategory', () => {
    it('aggregates flags and disputes accurately', () => {
      const flags: MinimalAttestation[] = [
        { ...baseAttestation, id: 'f1', payloadHash: 'hash1', claimType: 'ARTIFACT_FLAG', claimPayload: { category: 'lip_desync' } },
        { ...baseAttestation, id: 'f2', payloadHash: 'hash2', claimType: 'ARTIFACT_FLAG', claimPayload: { category: 'lip_desync' } },
        { ...baseAttestation, id: 'f3', payloadHash: 'hash3', claimType: 'ARTIFACT_FLAG', claimPayload: { category: 'audio_splice' } },
      ];

      const corr = {
        'hash1': { confirms: 0, disputes: 1 }, // f1 is disputed
      };

      const counts = countByCategory(flags, 'ARTIFACT_FLAG', corr);
      
      expect(counts['lip_desync']).toEqual({ count: 2, disputed: 1 });
      expect(counts['audio_splice']).toEqual({ count: 1, disputed: 0 });
    });
  });
});
