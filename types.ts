
export interface User {
  id: string;
  username: string;
  avatar: string;
  bio?: string;
  isVerified?: boolean;
  dob?: string;
  gender?: string;
  email?: string;
  location?: string;
  lastNameChangeDate?: string; // ISO string
}

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | null;

export interface Post {
  id: string;
  user: User;
  imageUrl: string;
  caption: string;
  likes: number; // For backward compatibility or primary count
  reactions?: Record<string, number>;
  userReaction?: ReactionType;
  comments: Comment[];
  timestamp: string;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}

export interface Story {
  id: string;
  user: User;
  imageUrl: string;
  hasSeen?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  user: User;
  lastMessage: string;
  unreadCount: number;
}

export interface Notification {
  id: string;
  user: User;
  type: 'like' | 'comment' | 'mention' | 'friend_request';
  content: string;
  timestamp: string;
  isRead: boolean;
}

export enum AppTab {
  FEED = 'feed',
  SEARCH = 'search',
  VIDEOS = 'videos',
  MESSAGES = 'messages',
  NOTIFICATIONS = 'notifications',
  PROFILE = 'profile',
  MENU = 'menu'
}
