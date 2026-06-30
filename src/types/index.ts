export interface User {
  id: string;
  uid: string;
  username: string;
  role: 'freelancer' | 'client' | 'admin';
  bio?: string;
  skills?: string;
  avatar?: string;
  kyc_verified?: boolean;
  balance_pi?: number;
  balance_connects?: number;
  rating?: number;
  total_jobs_posted?: number;
  total_jobs_completed?: number;
  is_blocked?: boolean;
  created_at?: string;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  budget: number;
  category: string;
  skills?: string[];
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  posted_by: string;
  client_username?: string;
  hired_freelancer_id?: string;
  hired_freelancer_name?: string;
  applicants_count?: number;
  apply_cost?: number;
  connects_required?: number;
  is_urgent?: boolean;
  rating?: number;
  images?: string[];
  created_at: string;
  updated_at?: string;
}

export interface Application {
  id: number;
  job_id: number;
  freelancer_id: string;
  freelancer_username?: string;
  message?: string;
  bid_amount?: number;
  cover_letter?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  job?: Job;
}

export interface ChatRoom {
  id: string;
  job_id?: number;
  job_title?: string;
  participants: string[];
  other_username?: string;
  other_uid?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_username?: string;
  content: string;
  created_at: string;
}

export interface Escrow {
  id: number;
  job_id: number;
  job_title?: string;
  client_id: string;
  freelancer_id: string;
  client_name?: string;
  freelancer_name?: string;
  amount: number;
  status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
  pi_payment_id?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  job_id?: number;
  room_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_jobs: number;
  total_escrows: number;
  active_escrows: number;
  total_revenue: number;
  payments: number;
  ratings: number;
  chats: number;
  pending_moderation: number;
  platformFeePercent?: number;
  developerFeePercent?: number;
}

declare global {
  interface Window {
    Pi: {
      init(config: { version: string; sandbox: boolean; onIncompletePaymentFound?: (payment: any) => Promise<void> }): void;
      authenticate(
        scopes: string[],
        onIncompletePaymentFound: (payment: any) => Promise<void>
      ): Promise<{ user: { uid: string; username: string }; accessToken: string }>;
      createPayment(
        data: { amount: number; memo: string; metadata: Record<string, any> },
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => void;
          onReadyForServerCompletion: (paymentId: string, txid: string) => void;
          onCancel: (paymentId: string) => void;
          onError: (error: Error, payment: any) => void;
        }
      ): void;
    };
    _piSdkReady?: boolean;
  }
}
