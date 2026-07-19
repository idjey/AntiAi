export interface ReputationParams {
  initialReputation: number;
  suspensionFloor: number;
  weightExponent: number;
  platformFactor: {
    deviceAttested: number;
    web: number;
  };
  earn: {
    settlementCorrect: number;
    canaryPass: number;
    machineVerifiedProvenance: number;
  };
  slash: {
    base: number;
    vouchPropagationBeta: number;
    vouchPropagationWindowDays: number;
  };
  vouch: {
    minReputation: number;
    maxActive: number;
  };
  decay: {
    factor: number;
    inactiveDays: number;
  };
  canary: {
    injectionRate: number;
    windowSize: number;
    downweightBelow: number;
    suspendBelow: number;
    downweightFactor: number;
    retireAfterServes: number;
  };
  correlation: {
    clusterExponent: number;
    clusterOutlierFactor: number;
    clusterShareExponent: number;
    vouchAncestorHops: number;
    joinWindowHours: number;
    coAttestWindowMin: number;
    jaccardThreshold: number;
    cosineThreshold: number;
  };
  flags: {
    shadowMode: boolean;
    liveWeighting: boolean;
    liveSlashing: boolean;
    canaryInjection: boolean;
    vouchingOpen: boolean;
  };
}

export const DEFAULT_CONFIG: ReputationParams = {
  initialReputation: 0.10,
  suspensionFloor: 0.03,
  weightExponent: 1.5,
  platformFactor: { deviceAttested: 1.0, web: 0.6 },
  earn: {
    settlementCorrect: 0.02,
    canaryPass: 0.005,
    machineVerifiedProvenance: 0.03,
  },
  slash: {
    base: 0.08,
    vouchPropagationBeta: 0.25,
    vouchPropagationWindowDays: 90,
  },
  vouch: { minReputation: 0.4, maxActive: 5 },
  decay: { factor: 0.995, inactiveDays: 30 },
  canary: { 
    injectionRate: 0.05, windowSize: 20,
    downweightBelow: 0.55, suspendBelow: 0.35,
    downweightFactor: 0.3, retireAfterServes: 500 
  },
  correlation: { 
    clusterExponent: 0.5,
    clusterOutlierFactor: 3.0,
    clusterShareExponent: 2.0,
    vouchAncestorHops: 2, joinWindowHours: 72,
    coAttestWindowMin: 10, jaccardThreshold: 0.6, cosineThreshold: 0.85 
  },
  flags: { 
    shadowMode: true, liveWeighting: false, liveSlashing: false,
    canaryInjection: false, vouchingOpen: false 
  },
};
