export type ClassificationLevel = 'TOP_SECRET' | 'SECRET' | 'CONFIDENTIAL' | 'RESTRICTED';

export type IntelCategory = 'GEOINT' | 'SIGINT' | 'HUMINT' | 'OSINT' | 'CYBER' | 'MASINT';

export type ThreatLevel = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'GUARDED' | 'LOW';

export interface IntelReport {
  id: string;
  codeName: string;
  title: string;
  classification: ClassificationLevel;
  category: IntelCategory;
  threatLevel: ThreatLevel;
  sourceReliability: string; // e.g., 'A1', 'B2', 'C1'
  timestamp: string;
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  summary: string;
  content: string;
  keyFindings: string[];
  entities: string[];
  status: 'VERIFIED' | 'INVESTIGATING' | 'ESCALATED';
  priorityAction?: string;
  tags: string[];
}

export interface TargetEntity {
  id: string;
  name: string;
  codeName: string;
  type: 'ORGANIZATION' | 'INDIVIDUAL' | 'FACILITY' | 'CYBER_ACTOR' | 'VESSEL' | 'INFRASTRUCTURE';
  threatLevel: ThreatLevel;
  affiliation: string;
  lastSeen: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  linkedEntityIds: { targetId: string; relation: string }[];
  details: string;
  threatScore: number; // 0-100
  status: 'ACTIVE' | 'SURVEILLED' | 'NEUTRALIZED' | 'DORMANT';
}

export interface ThreatAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY';
  title: string;
  timestamp: string;
  source: string;
  region: string;
  acknowledged: boolean;
  intelId?: string;
}

export interface AnalysisResult {
  summary: string;
  reliabilityRating: string;
  threatLevel: ThreatLevel;
  keyJudgments: string[];
  extractedEntities: {
    name: string;
    type: string;
    role: string;
    threatScore: number;
  }[];
  geopoliticalImpact: string;
  recommendedAction: string;
  indicatorsAndWarnings: string[];
}

export interface SimulationResult {
  scenarioTitle: string;
  riskIndex: number;
  primaryThreatActor: string;
  escalationPhases: {
    phase: string;
    developments: string;
    indicators: string;
  }[];
  strategicImplications: string[];
  criticalChokepoints: string[];
  contingencyResponse: string[];
}

export interface IntelDiscrepancyItem {
  id: string;
  category: 'GEO_LOCATION' | 'ENTITY_CONFLICT' | 'TEMPORAL_MISMATCH' | 'TACTICAL_ASSESSMENT' | 'SOURCE_CREDIBILITY';
  severity: 'CRITICAL_CONFLICT' | 'MODERATE_DISCREPANCY' | 'COMPLEMENTARY_INFO';
  title: string;
  sourceAClaim: string;
  sourceBClaim: string;
  conflictSnippetA?: string;
  conflictSnippetB?: string;
  analysis: string;
  recommendedVerdict: 'FAVOR_A' | 'FAVOR_B' | 'COMPROMISE' | 'NEEDS_VERIFICATION';
}

export interface IntelComparisonResult {
  summary: string;
  overallConsistencyScore: number; // 0-100
  geoDistanceDeltaKm?: number;
  timeDeltaHours?: number;
  keyDiscrepancies: IntelDiscrepancyItem[];
  deceptionHypothesis: string;
  admiraltyVerdict: {
    sourceAReliability: string;
    sourceBReliability: string;
    higherTrustSource: 'SOURCE_A' | 'SOURCE_B' | 'EQUIVALENT';
    justification: string;
  };
  recommendedActions: string[];
}

