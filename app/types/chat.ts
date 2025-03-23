export type ChatRole = 'assistant' | 'user';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

