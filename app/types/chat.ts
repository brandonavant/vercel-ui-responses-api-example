export type ChatRole = 'assistant' | 'user';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatFile {
  name: string;
  vectorStoreId: string;
  extension: string;
  isUploaded: boolean;
  file?: File;  // Reference to the actual File object (optional as it won't be needed after upload)
}