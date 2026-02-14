export interface User {
  id: number;
  username: string;
  email: string;
  tenant?: Tenant;
}

export interface Tenant {
  id: number;
  name: string;
  created_on: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  tasks: Task[];
}

export interface Task {
  id: number;
  project: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}
