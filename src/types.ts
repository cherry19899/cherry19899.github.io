export interface User {
  id: string;
  username: string;
  name?: string;
  bio?: string;
  skills?: string[];
  avatar?: string;
  role: 'user' | 'admin';
  balance_connects: number;
  created_at: string;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  budget: string;
  category: string;
  location?: string;
  deadline?: string;
  images?: string[];
  status: 'open' | 'in_progress' | 'completed' | 'disputed';
  posted_by: string;
  posted_by_name?: string;
  applications: number;
  apply_cost?: number;
  connects_spent?: number;
  created_at: string;
  updated_at?: string;
  hired_freelancer_id?: string | null;
  hired_freelancer_name?: string | null;
  escrow_id?: string | null;
  room_id?: string | null;
}

export interface Application {
  id: number;
  job_id: number;
  freelancer_id: string;
  freelancer_name?: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Escrow {
  id: string;
  job_id: number;
  amount: number;
  status: 'pending' | 'funded' | 'released' | 'disputed';
  client_id: string;
  freelancer_id: string;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  job_id: number;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Review {
  id: string;
  fromId: string;
  toId: string;
  jobId: string;
  rating: number;
  comment: string;
  createdAt: string;
}
