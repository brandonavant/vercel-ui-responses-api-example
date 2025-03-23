'use client';

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with input:", input);

    if (!input.trim() || isLoading) return;

    // Add user message to the chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);

    // Clear input and set loading state
    setInput('');
    setIsLoading(true);

    try {
      console.log("Preparing to send request to API");

      // Start with an empty assistant message that will be updated during streaming
      const assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      // Send request to the API
      console.log("Sending fetch request to /api/chat");
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [userMessage] // Simplify - just send the current message
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
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}