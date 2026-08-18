import type {
  ActorRef,
  Classifications,
  CoreItemRole,
  CoreItemStatus,
  EntityRef,
  ProgressTransition,
} from "./common";

export type InterpretedCoreItem = {
  core_item_id: string;

  concept_key: string;

  title: string;
  summary: string;

  importance: 1 | 2 | 3 | 4 | 5;
  confidence: number;

  roles: CoreItemRole[];

  status?: CoreItemStatus;

  tags: string[];
  classifications: Classifications;

  entities: EntityRef[];
  actors: ActorRef[];

  evidence_refs: string[];

  progress?: ProgressTransition;

  notes?: string[];
};
