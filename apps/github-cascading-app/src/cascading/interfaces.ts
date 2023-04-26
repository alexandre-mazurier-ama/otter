/** Describes the minimal interface that a logger need to implement to be used by the Cascading plugin */
export type BaseLogger = { debug: (log: string) => void; info: (log: string) => void; warn: (log: string) => void; error: (log: string) => void };

/**
 * Cascading Configuration received from the base repository
 */
export interface CascadingConfiguration {
  /** Ignore the branches that match this pattern for the cascading */
  ignoredPatterns: string[];
  /** The default branch if you have one (ex: master, development), if no candidate found with the given pattern this branch will be the last one where the code will be cascaded */
  defaultBranch: string;
  /** Pattern determining if the branch is part of the cascading strategy */
  cascadingBranchesPattern: string;
  /** Pattern containing a capture to extract the version of a cascading branch */
  versionCapturePattern: string;
  /** Bypass the reviewers validation for the pull request, only the CI checks will be executed */
  bypassReviewers: boolean;
}

/** Minimal information required from a Pull Request */
export interface CascadingPullRequestInfo {
  /** ID of the Pull Request Author */
  authorId?: string | number;
  /** Body of the pull request */
  body: string | null;
  /** Determine if the pull request is still open */
  isOpen: boolean;
  /** ID of the pull request */
  id: string | number;
}

/** Check suite possible conclusions */
export type CheckConclusion = 'cancelled' | 'neutral' | 'success' | 'failure' | 'timed_out' | 'action_required' | 'stale' | null;
