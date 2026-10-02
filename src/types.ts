export interface NodeJobs {
  id: string;
  job_count: number;
  utilization: number;
}

export interface NodeType {
  id: string;
  name?: string;
  gpus: string;
  score: number;
  state: string;
  since: string | number | Date;
  updated?: string | number | Date;
  jobs_completed: number;
  previews_sent: number;
  thumbnails_sent: number;
  jobs?: NodeJobs;
}

export interface JobHistory {
  start: number;
  end: number;
  bucket: number;
  rows: { node: string; bucket: number; busy: number; job_count: number }[];
}

export interface ChartPoint {
  t: number; // bucket start, unix seconds
  value: number;
  values?: number[]; // per series parts of value, for stacked charts
}

