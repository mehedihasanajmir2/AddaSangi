
export interface Story {
  id: string;
  user_id: string;
  type: 'image' | 'text';
  content: string;
  music_url?: string;
  music_title?: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
}

export interface User {
  id: string;
  username: string; // This is the unique User ID/Handle
  full_name: string; // This is the display name
  avatar: string;
  coverUrl?: string;
  bio?: string;
  isVerified?: boolean;
  dob?: string;
  gender?: string;
  email?: string;
  location?: string;
  lastNameChangeDate?: string;
  avatar_url?: string;
  cover_url?: string;
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
  username: string; // unique handle
  full_name: string; // display name
  text: string;
  timestamp: string;
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
  NOTIFICATIONS = 'notifications',
  STATUS = 'status',
  CALLS = 'calls'
}
