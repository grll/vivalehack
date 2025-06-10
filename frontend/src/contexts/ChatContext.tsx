import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Message {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
  updatedAt: string;
}

interface ChatContextType {
  selectedChatId: string | null;
  selectedMessages: Message[];
  setSelectedChat: (chatId: string, messages: Message[]) => void;
  clearSelectedChat: () => void;
  resetChat: () => void;
  navigateToChat: (chatId: string) => void;
  navigateToHome: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);
  const navigate = useNavigate();
  const { id: urlChatId } = useParams<{ id: string }>();

  // Handle URL changes
  useEffect(() => {
    if (urlChatId && urlChatId !== selectedChatId) {
      // URL has a chat ID but it's different from current selection
      // This will be handled by the component that loads chat data
      setSelectedChatId(urlChatId);
    } else if (!urlChatId && selectedChatId) {
      // URL doesn't have chat ID but we have a selected chat
      // Clear selection when navigating to home
      setSelectedChatId(null);
      setSelectedMessages([]);
    }
  }, [urlChatId, selectedChatId]);

  const setSelectedChat = (chatId: string, messages: Message[]) => {
    setSelectedChatId(chatId);
    setSelectedMessages(messages);
  };

  const clearSelectedChat = () => {
    setSelectedChatId(null);
    setSelectedMessages([]);
  };

  const resetChat = () => {
    setSelectedChatId(null);
    setSelectedMessages([]);
    navigate('/');
  };

  const navigateToChat = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const navigateToHome = () => {
    navigate('/');
  };

  return (
    <ChatContext.Provider
      value={{
        selectedChatId,
        selectedMessages,
        setSelectedChat,
        clearSelectedChat,
        resetChat,
        navigateToChat,
        navigateToHome,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}; 