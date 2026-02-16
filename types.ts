
export interface User {
  id: string;
  username: string;
  avatar: string;
  coverUrl?: string;
  bio?: string;
  isVerified?: boolean;
  dob?: string;
  gender?: string;
  email?: string;
  location?: string;
  lastNameChangeDate?: string;
}

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | null;

export interface Post {
  id: string;
  user: User;
  imageUrl: string;
  caption: string;
  likes: number; 
  userReaction?: ReactionType;
  comments: Comment[];
  timestamp: string;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  user_id: string;
  username: string;
  text: string;
  timestamp: string;
}

export interface Story {
  id: string;
  user: User;
  imageUrl: string;
}

// Added Chat interface for messaging component
export interface Chat {
  id: string;
  user: User;
  lastMessage: string;
  unreadCount: number;
}

// Added Notification interface for notification component
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
  PROFILE = 'profile',
  MENU = 'menu',
  MESSAGES = 'messages',
  NOTIFICATIONS = 'notifications'
}
