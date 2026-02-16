export interface RangeReview {
  id?: number;
  title?: string;
  start_date?: string; // ISO date
  end_date?: string; // ISO date
  summary?: string;
  metrics?: Record<string, unknown>; // flexible shape for counts/aggregates
}

export interface HallInfo {
  id?: number;
  name?: string;
}

export interface ProgramInfo {
  id?: number;
  title?: string;
}

export interface ScheduleItem {
  id?: number;
  date?: string; // ISO date or formatted
  starttime?: string;
  endtime?: string;
  hall?: HallInfo | null;
  status?: string | number;
  program?: ProgramInfo | null;
  [key: string]: unknown;
}

export type FilterResult = RangeReview | ScheduleItem;