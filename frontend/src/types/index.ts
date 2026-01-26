export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'editor' | 'viewer' | 'user';
  created_at: string;
  last_login?: string;
}

export interface Story {
  id: string;
  name: string;
  description?: string;
  start_passage_id?: string;
  is_active: boolean;
  zoom: number;
  tags: string[];
  sort_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Passage {
  id: string;
  story_id: string;
  name: string;
  content: string;
  passage_type: 'start' | 'content' | 'branch' | 'end';
  tags: string[];
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: string;
  story_id: string;
  source_passage_id: string;
  target_passage_id: string;
  name?: string;
  condition_type: 'always' | 'previous_passage' | 'user_selection';
  condition_value?: string;
  link_order: number;
}

export interface StoryWithPassages extends Story {
  passages: Passage[];
  links: Link[];
}

export interface PassageWithContext {
  passage: Passage;
  available_links: Link[];
  previous_passage_id?: string;
  is_end: boolean;
}

export interface Feedback {
  id: string;
  user_id?: string;
  user_name?: string;
  passage_id?: string;
  content: string;
  is_anonymous: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  replies: Feedback[];
}

export interface Bookmark {
  id: string;
  user_id: string;
  passage_id: string;
  passage_name?: string;
  story_id?: string;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}
