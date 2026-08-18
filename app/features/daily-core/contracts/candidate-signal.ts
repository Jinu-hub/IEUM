import type { ActorRef, EntityRef } from "./common";

export type SignalType =
  | "decision"
  | "progress"
  | "issue"
  | "risk"
  | "plan"
  | "discussion"
  | "achievement"
  | "activity"
  | "other";

export type CandidateSignal = {
  signal_id: string;

  signal_type: SignalType;

  title: string;
  summary: string;

  actors: ActorRef[];
  entities: EntityRef[];
  tags: string[];

  evidence_refs: string[];
};
