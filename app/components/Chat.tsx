'use client';

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ChatFile, ChatMessage } from "@/app/types";
import { Paperclip } from "lucide-react";
import AttachedFile from "@/app/components/AttachedFile";

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<ChatFile[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    console.log('Files selected:', fileList.length);
    
    const newFiles: ChatFile[] = Array.from(fileList).map(file => ({
      name: file.name,
      vectorStoreId: '', // Will be populated after upload
      extension: file.name.split('.').pop() || '',
      isUploaded: false,
      file // Keep reference to the actual file object
    }));

    console.log('Processed file objects:', newFiles.map(f => f.name));
    
    setAttachedFiles(prev => [...prev, ...newFiles]);
    
    // Reset the file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileName: string) => {
    // Only allow removing files that haven't been uploaded yet
    setAttachedFiles(prev => prev.filter(file => 
      file.isUploaded || file.name !== fileName
    ));
  };
  
  const uploadFiles = async (files: ChatFile[]): Promise<ChatFile[]> => {
    // Filter for files that haven't been uploaded yet
    const pendingFiles = files.filter(file => !file.isUploaded && file.file);
    
    console.log('Pending files to upload:', pendingFiles.length);
    
    if (pendingFiles.length === 0) {
      console.log('No files to upload');
      return files; // No files to upload
    }
    
    // Create FormData to send files
    const formData = new FormData();
    pendingFiles.forEach(fileData => {
      if (fileData.file) {
        formData.append('files', fileData.file);
      }
    });
    
    // Upload files
    const response = await fetch('/api/files', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`File upload failed: ${response.status}`);
    }
    
    const uploadResult = await response.json();
    console.log('Upload result:', uploadResult);
    
    // Ensure uploadResult.files is an array
    const uploadedFiles = Array.isArray(uploadResult.files) 
      ? uploadResult.files 
      : uploadResult.files ? [uploadResult.files] : [];
    
    // Update file objects with upload info
    return files.map(file => {
      const uploaded = uploadedFiles.find((uf: any) => uf.name === file.name);
      if (uploaded) {
        return {
          ...file,
          vectorStoreId: uploaded.id || '',
          isUploaded: true,
          file: undefined // Remove file reference since it's no longer needed
        };
      }
      return file;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with input:", input);

    if (!input.trim() && attachedFiles.length === 0) return;
    if (isLoading) return;

    // Add user message to the chat
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);

    // Clear input and set loading state
    setInput('');
    setIsLoading(true);

    try {
      console.log("Preparing to send request to API");

      // Upload any pending files first
      let updatedFiles: ChatFile[] = [...attachedFiles];
      let fileIds: string[] = [];
      
      if (attachedFiles.length > 0) {
        try {
          updatedFiles = await uploadFiles(attachedFiles);
          setAttachedFiles(updatedFiles);
          
          // Collect file IDs to send with the chat request
          fileIds = updatedFiles
            .filter(file => file.isUploaded && file.vectorStoreId)
            .map(file => file.vectorStoreId);
        } catch (fileError) {
          console.error("Error uploading files:", fileError);
          setMessages(prev => [
            ...prev, 
            { role: 'assistant', content: "Sorry, there was an error uploading your files." }
          ]);
          setIsLoading(false);
          return;
        }
      }

      // Start with an empty assistant message that will be updated during streaming
      const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      // Send request to the API
      console.log("Sending fetch request to /api/chat");
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [userMessage],
          // The backend will handle accessing the vector store for file content
          hasAttachedFiles: fileIds.length > 0
        }),
      });

      console.log("API response received:", response.status);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      // Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      console.log("Starting to read stream");

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("Stream complete");
          break;
        }

        // Decode the chunk and append to the full text
        const chunk = decoder.decode(value, { stream: true });
        console.log("Received chunk:", chunk);
        fullText += chunk;

        // Update the assistant message with the accumulated text
        setMessages(prev =>
          prev.map((msg, i) =>
            i === prev.length - 1 ? { ...msg, content: fullText } : msg
          )
        );
      }

    } catch (error) {
      console.error("Error in API call:", error);
      // Update the last message (which should be the assistant message)
      setMessages(prev =>
        prev.map((msg, i) =>
          i === prev.length - 1
            ? { ...msg, content: "Sorry, there was an error processing your request." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap">
            {attachedFiles.map((value: ChatFile, index: number) => (
              <AttachedFile 
                key={index} 
                {...value} 
                onRemove={handleRemoveFile} 
              />
            ))}
          </div>
        )}
        {messages.length === 0 && (
          <div className="text-center py-10">
            <h3 className="text-lg font-semibold">Start a conversation</h3>
            <p className="text-gray-500">Type a message to begin chatting</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-black'
              }`}
            >
              {message.role === 'user' ? (
                <div>{message.content}</div>
              ) : (
                <ReactMarkdown>
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <div className="border-t p-4">
        <form
          onSubmit={handleSubmit}
          className="flex space-x-2"
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 cursor-pointer"
            title="Attach files"
          >
            <Paperclip size={16} />
          </button>
          <input
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}