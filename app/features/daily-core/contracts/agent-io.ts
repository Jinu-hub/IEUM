import type { DailyCoreTargetContext, DailyCoreWindowContext, KnownConceptItem } from "./common";
import type { CandidateSignal } from "./candidate-signal";
import type { DailyCoreAnalysisFields } from "./daily-core-analysis";
import type { InterpretedCoreItem } from "./interpreted-core";
import type { NormalizedSourceItem } from "./normalized-source";

export type SignalExtractorInput = {
  target: DailyCoreTargetContext;
  window: DailyCoreWindowContext;
  sources: NormalizedSourceItem[];
};

export type SignalExtractorOutput = {
  signals: CandidateSignal[];
};

export type CoreInterpreterInput = {
  target: Pick<DailyCoreTargetContext, "target_id" | "target_display_name" | "target_category">;
  signals: CandidateSignal[];
  known_items?: KnownConceptItem[];
};

export type CoreInterpreterOutput = {
  overview_candidate: {
    summary: string;
  };
  core_items: InterpretedCoreItem[];
};

export type CoreStructurerInput = {
  overview_candidate: CoreInterpreterOutput["overview_candidate"];
  core_items: InterpretedCoreItem[];
};

export type CoreStructurerOutput = DailyCoreAnalysisFields;

export type DailyCoreAgentResults = {
  signal_extraction: SignalExtractorOutput;
  core_interpretation: CoreInterpreterOutput;
  core_structuring: CoreStructurerOutput;
};
