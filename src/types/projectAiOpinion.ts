/** Medium opinion block: summary + lists + nested location (per project). */
export type ProjectAiOpinion = {
  summary: string;
  positives: string[];
  cautions: string[];
  questions: string[];
  locationOpinion: {
    summary: string;
    airAndClimate: string[];
    transportAndNoise: string[];
    localChecks: string[];
  };
  confidence: "low" | "medium" | "high";
  model?: string;
  generatedAt: string;
};

export type ProjectAiOpinionMap = Record<string, ProjectAiOpinion>;
