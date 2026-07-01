export interface User {
  uid: string;
  username: string;
  name?: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  role: 'user' | 'admin';
  balance_pi?: number;
  connects?: number;
  rating?: number;
  review_count?: number;
  badge?: string;
  is_blocked?: boolean;
  is_available?: boolean;
  created_at?: string;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  budget: number;
  category?: string;
  owner_uid: string;
  owner_username?: string;
  freelancer_uid?: string;
  status: 'open' | 'assigned' | 'completed' | 'cancelled';
  is_urgent?: boolean;
  created_at: string;
  updated_at?: string;
  application_count?: number;
  search_rank?: number;
}

export interface Message {
  id: string | number;
  content: string;
  sender_uid: string;
  sender_username?: string;
  created_at: string;
  pending?: boolean;
}

export interface Escrow {
  id: number;
  job_id: number;
  client_uid: string;
  freelancer_uid: string;
  amount: number;
  status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
  payment_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface Milestone {
  id: number;
  escrow_id: number;
  title: string;
  amount: number;
  status: 'pending' | 'requested' | 'approved' | 'paid';
  order_index: number;
}

export interface Payment {
  id: number;
  payment_id: string;
  user_uid: string;
  amount: number;
  memo?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

export interface Notification {
  id: number;
  user_uid: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface Review {
  id: number;
  reviewer_uid: string;
  reviewee_uid: string;
  job_id: number;
  rating: number;
  text?: string;
  created_at: string;
  reviewer_username?: string;
}

export interface Application {
  id: number;
  job_id: number;
  applicant_uid: string;
  applicant_username?: string;
  proposal: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface ChatRoom {
  id: number;
  job_id?: number;
  participant_uids: string[];
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  other_username?: string;
  other_uid?: string;
}
