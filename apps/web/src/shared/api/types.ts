export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  content: string;
  description: string | null;
  isArchived: boolean;
  lastOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
