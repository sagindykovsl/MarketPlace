export enum UserRole {
  CONSUMER = 'CONSUMER',
  SALES = 'SALES'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

export enum ComplaintStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED'
}

export enum LinkStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Supplier {
  id: string;
  name: string;
  description: string;
  image: string;
  isLinked: boolean;
  linkStatus?: LinkStatus;
}

export interface Product {
  id: string;
  supplierId: string;
  name: string;
  price: number;
  unit: string;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  supplierName: string;
  total: number;
  status: OrderStatus;
  date: string;
  items: CartItem[];
  hasComplaint?: boolean;
}

export interface Complaint {
  id: string;
  orderId: string;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}