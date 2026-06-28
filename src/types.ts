export type UserRole = 'admin' | 'privileged' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  tags: string[];
  userId: string;
  user: {
    name: string;
    avatarUrl?: string;
    role: UserRole;
  };
  likesCount: number;
  likedByUserIds: string[];
  isFeatured: boolean;
  createdAt: string;
  ratings?: { [userId: string]: number }; // Map of userId -> score (1 to 5)
  averageRating?: number;
  ratingsCount?: number;
  averagePrivilegedRating?: number;
}

export interface Comment {
  id: string;
  postId: string;
  parentId?: string; // For replies
  userId: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    avatarUrl?: string;
    role: UserRole;
  };
  replies?: Comment[];
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
