export interface User {
  id: string;
  username: string;
  name?: string;
  bio?: string;
  skills?: string[];
  avatar?: string;
  role: 'user' | 'admin';
  connects: number;
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  location?: string;
  deadline?: string;
  images?: string[];
  status: 'open' | 'in_progress' | 'completed' | 'disputed';
  clientId: string;
  client?: User;
  applicants?: Application[];
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  freelancerId: string;
  freelancer?: User;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Escrow {
  id: string;
  jobId: string;
  amount: number;
  status: 'pending' | 'funded' | 'released' | 'disputed';
  clientId: string;
  freelancerId: string;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  jobId: string;
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
