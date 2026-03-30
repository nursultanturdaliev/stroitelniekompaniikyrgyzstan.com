export type MergeChangelogFieldChange = {
  field: string;
  label: string;
  from: unknown;
  to: unknown;
};

export type MergeChangelogObjectRef = {
  id: number;
  title: string;
  builderSlug: string;
  builderName: string;
  path: string;
};

export type MergeChangelogRemoved = Omit<MergeChangelogObjectRef, "path">;

export type MergeChangelogChanged = MergeChangelogObjectRef & {
  fields: MergeChangelogFieldChange[];
};

export type MergeChangelogData = {
  generatedAt: string;
  fromScrapedAt?: string;
  toScrapedAt?: string;
  summary: {
    added: number;
    removed: number;
    changed: number;
    changedShown: number;
    changedTruncated: number;
  };
  added: MergeChangelogObjectRef[];
  removed: MergeChangelogRemoved[];
  changed: MergeChangelogChanged[];
  noteRu: string;
};
