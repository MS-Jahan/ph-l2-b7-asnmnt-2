import { Request } from 'express';

export interface UserPayload {
  id: number;
  name: string;
  role: 'contributor' | 'maintainer';
}

export interface AuthRequest extends Request {
  user: UserPayload;
}

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'contributor' | 'maintainer';
  created_at: Date;
  updated_at: Date;
}

export interface IssueRow {
  id: number;
  title: string;
  description: string;
  type: 'bug' | 'feature_request';
  status: 'open' | 'in_progress' | 'resolved';
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface ReporterInfo {
  id: number;
  name: string;
  role: 'contributor' | 'maintainer';
}
