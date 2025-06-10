import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, Loader2 } from 'lucide-react';
import ChatMessage from './ChatMessage';
import InfiniteScrollPrompts from './InfiniteScrollPrompts';
import { useChatContext } from '@/contexts/ChatContext';
import api from '@/config/api';
import { AxiosError } from 'axios';

interface Reference {
  type: 'document' | 'event' | 'person';
  link: string;
  eventId?: string;
  documentId?: string;
}

interface ApiMessage {
  _id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'developer';
  createdAt?: string;
  updatedAt?: string;
}

interface Message {
  _id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'developer';
  createdAt?: string;
  updatedAt?: string;
  references?: Record<string, Reference>;
}

const ChatInterface = () => {
  const { t } = useTranslation();
  const { selectedChatId, selectedMessages, resetChat, navigateToChat } = useChatContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const loadingTexts = [
    t('chat.thinking'),
    t('chat.searchingDocuments'),
    t('chat.findingEvents')
  ];

  const scrollToBottom = useCallback(() => {
    try {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    } catch (error) {
      console.error('Error scrolling to bottom:', error);
    }
  }, []);

  // Enhanced smooth scroll for new messages
  const smoothScrollToBottom = useCallback(() => {
    try {
      if (messagesEndRef.current) {
        const container = messagesEndRef.current.parentElement;
        if (container) {
          const targetScrollTop = container.scrollHeight - container.clientHeight;
          const startScrollTop = container.scrollTop;
          const distance = targetScrollTop - startScrollTop;
          const duration = 800; // 800ms animation
          let startTime: number | null = null;

          const animateScroll = (currentTime: number) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // Easing function for smooth slow ending (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            container.scrollTop = startScrollTop + (distance * easeOut);
            
            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            }
          };
          
          requestAnimationFrame(animateScroll);
        }
      }
    } catch (error) {
      console.error('Error in smooth scroll:', error);
    }
  }, []);

  // Load chat when URL contains chat ID
  useEffect(() => {
    const loadChatFromUrl = async () => {
      if (selectedChatId && selectedChatId !== chatId) {
        try {
          setChatId(selectedChatId);
          setShowSuggestions(false);
          
          // If there are selected messages from context, use them
          if (selectedMessages.length > 0) {
            const parsedMessages = selectedMessages.map((msg: ApiMessage) => {
              if (msg.role === 'assistant') {
                let messageContent = msg.content;
                let messageReferences = {};
                
                try {
                  const parsedContent = JSON.parse(messageContent);
                  if (parsedContent.message && parsedContent.references) {
                    messageContent = parsedContent.message;
                    messageReferences = parsedContent.references;
                  }
                } catch (e) {
                  console.log('Content is not JSON, using as plain text');
                }
                
                return {
                  ...msg,
                  content: messageContent,
                  references: messageReferences
                } as Message;
              }
              return msg as Message;
            });
            
            setMessages(parsedMessages);
            setTimeout(scrollToBottom, 100);
          } else {
            // Fetch chat messages from backend if not available in context
            console.log(`Fetching chat messages for ID: ${selectedChatId}`);
            
            const response = await api.get(`/chat/${selectedChatId}`);
            console.log('Chat response:', response.data);
            
            if (response.data && response.data.messages) {
              // Transform backend messages to frontend format
              const backendMessages = response.data.messages.map((msg: {
                id: string;
                content: string;
                role: 'user' | 'assistant' | 'system' | 'developer';
                timestamp: string;
              }) => ({
                _id: msg.id,
                content: msg.content,
                role: msg.role,
                createdAt: msg.timestamp,
                updatedAt: msg.timestamp,
                references: {}
              }));
              
              setMessages(backendMessages);
              setTimeout(scrollToBottom, 100);
            }
          }
        } catch (error) {
          console.error('Error loading chat from URL:', error);
          // If chat not found or error, show suggestions
          setShowSuggestions(true);
          setMessages([]);
        }
      }
    };

    loadChatFromUrl();
  }, [selectedChatId, chatId, scrollToBottom]);

  // Handle selected conversation from sidebar - separate effect
  useEffect(() => {
    if (selectedChatId && Array.isArray(selectedMessages) && selectedMessages.length > 0 && selectedChatId !== chatId) {
      try {
        setChatId(selectedChatId);
        setMessages(selectedMessages);
        setShowSuggestions(false);
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error('Error handling selected conversation:', error);
      }
    }
  }, [selectedChatId, chatId, scrollToBottom]);

  // Handle reset chat (new conversation)
  useEffect(() => {
    if (!selectedChatId && (!selectedMessages || selectedMessages.length === 0)) {
      setMessages([]);
      setChatId(null);
      setShowSuggestions(true);
    }
  }, [selectedChatId, selectedMessages]);

  useEffect(() => {
    smoothScrollToBottom();
  }, [messages]);

  // Rotate loading texts while loading
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
      }, 2000); // Change text every 2 seconds

      return () => clearInterval(interval);
    } else {
      setLoadingTextIndex(0); // Reset to first text when not loading
    }
  }, [isLoading, loadingTexts.length]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    setShowSuggestions(false);
    
    // Add user message to UI immediately
    const userMessage: Message = {
      _id: Date.now().toString(), // Temporary ID
      content: text,
      role: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const body: { message: string; id?: string } = {
        message: text
      };

      // Include chat ID if we have one
      if (chatId) {
        body.id = chatId;
      }

      const response = await api.post('/messages', body);

      // Handle response - API returns both id and openai_id, use id preferentially
      const responseId = response.data.id || response.data.openai_id;
      
      // Set chat ID from response if it exists (for new chats)
      if (responseId && !chatId) {
        setChatId(responseId);
        // Navigate to the new chat URL
        navigateToChat(responseId);
      }

      // Parse the assistant response - new format has id and message
      let messageContent = response.data.message;
      let messageReferences = {};
      
      // Handle any potential JSON parsing if the message contains structured data
      if (typeof messageContent === 'string') {
        try {
          const parsedContent = JSON.parse(messageContent);
          if (parsedContent.message && parsedContent.references) {
            messageContent = parsedContent.message;
            messageReferences = parsedContent.references;
          }
        } catch (e) {
          // If parsing fails, use content as is (plain text message)
          console.log('Message is plain text, using as is');
        }
      }

      // Add assistant response
      const assistantMessage: Message = {
        _id: responseId || Date.now().toString(),
        content: messageContent,
        role: 'assistant',
        references: messageReferences
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        _id: (Date.now() + 1).toString(),
        content: (error as AxiosError<{message?: string}>)?.response?.data?.message || 'Sorry, I encountered an error. Please try again.',
        role: 'assistant'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSelect = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div 
      className="flex flex-col h-full relative"
      style={{
        backgroundImage: "url('/vivatech.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto pb-32 md:pb-24 relative z-10" ref={messagesContainerRef}>
        {messages.length === 0 && showSuggestions ? (
          <div className="h-full flex flex-col justify-center space-y-6 md:space-y-8 animate-fade-in-up pt-16 md:pt-24 lg:pt-32">
            <div className="text-center space-y-3 px-4">
              <h2 className="text-white text-xl md:text-2xl font-bold drop-shadow-lg">
                {t('chat.discoverPlaces')}
              </h2>
              <p className="text-white/90 text-sm max-w-md mx-auto drop-shadow-md">
                {t('chat.discoverDescription')}
              </p>
            </div>
            <div className="w-full mt-12 md:mt-16">
              <InfiniteScrollPrompts onPromptSelect={handlePromptSelect} />
            </div>
          </div>
        ) : (
          <div className="px-4 py-6 pb-8">
            <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => (
              <ChatMessage
                  key={message._id}
                  message={message.content}
                  isUser={message.role === 'user'}
                  timestamp={new Date(message.createdAt || Date.now())}
                  references={message.references}
              />
            ))}
            {isLoading && (
                <div className="flex mb-8">
                  <div className="w-full p-3">
                    <div className="relative">
                      <p 
                        key={loadingTextIndex} 
                        className="relative overflow-hidden rounded-xl px-6 py-4 transition-all duration-500 ease-in-out transform animate-slideInUp bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border border-blue-100 dark:border-slate-600 shadow-sm"
                      >
                        <span className="relative z-10 animate-fadeIn font-medium text-blue-700 dark:text-blue-300 text-base">
                          {loadingTexts[loadingTextIndex]}
                        </span>
                        {/* Loading dots animation */}
                        <span className="inline-flex ml-2">
                          <span className="animate-bounce text-blue-500 dark:text-blue-400" style={{ animationDelay: '0ms' }}>.</span>
                          <span className="animate-bounce text-blue-500 dark:text-blue-400" style={{ animationDelay: '150ms' }}>.</span>
                          <span className="animate-bounce text-blue-500 dark:text-blue-400" style={{ animationDelay: '300ms' }}>.</span>
                        </span>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-slate-400/20 to-transparent translate-x-[-100%] animate-shimmerPass rounded-xl"></div>
                        {/* Subtle pulse effect */}
                        <div className="absolute inset-0 bg-blue-100/30 dark:bg-blue-900/20 rounded-xl animate-pulse opacity-50"></div>
                      </p>
                    </div>
                </div>
                </div>
              )}
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ChatGPT-style Input Area */}
      <div className="absolute bottom-0 left-0 right-0 relative z-10">
        <div className="text-base mx-auto px-4">
          <div className="mx-auto flex max-w-4xl flex-1 text-base">
            <div className="relative z-1 flex h-full max-w-full flex-1 flex-col">
              <form className="w-full">
                <div className="flex w-full cursor-text flex-col items-center justify-center rounded-[28px] bg-clip-padding shadow-lg bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-600 mb-4 backdrop-blur-sm focus-within:border-slate-200 dark:focus-within:border-slate-600 focus-within:ring-0 focus-within:shadow-lg">
                  <div className="relative flex w-full items-end px-2.5 py-2.5">
                    <div className="relative flex w-full flex-auto flex-col">
                      <div className="relative mx-2.5 grid grid-cols-[minmax(0,1fr)]">
                        <div className="relative flex-auto bg-transparent pt-1.5" style={{ marginBottom: '-18px', transform: 'translateY(-7px)' }}>
                          <div className="flex flex-col justify-start" style={{ minHeight: 0 }}>
                            <div className="flex min-h-12 items-start">
                              <div className="max-w-full min-w-0 flex-1">
                                <div className="text-slate-900 dark:text-white max-h-[25dvh] max-h-52 -mx-3 px-3 overflow-auto min-h-12 pe-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={t('chat.typeMessage')}
                                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                                    disabled={isLoading}
                                    className="flex-1 border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus:outline-none focus:border-0 outline-none text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-base"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="justify-content-end relative ms-2 flex w-full flex-auto flex-col">
                        <div className="flex-auto"></div>
                      </div>
                      <div style={{ height: '48px' }}></div>
                    </div>
                    <div className="absolute start-2.5 end-0 bottom-2.5 z-2 flex items-center">
                      <div className="w-full">
                        <div className="absolute end-2.5 bottom-0 flex items-center gap-2">
                          <div className="ms-auto flex items-center gap-1.5">
                            {/* Microphone button */}
                            <button 
                              type="button" 
                              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400"
                              aria-label="Voice input"
                            >
                              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]">
                                <path d="M11.165 4.41699C11.165 3.22048 10.1955 2.25018 8.99902 2.25C7.80241 2.25 6.83203 3.22038 6.83203 4.41699V8.16699C6.83221 9.36346 7.80252 10.333 8.99902 10.333C10.1954 10.3328 11.1649 9.36335 11.165 8.16699V4.41699ZM12.665 8.16699C12.6649 10.1918 11.0238 11.8328 8.99902 11.833C6.97409 11.833 5.33221 10.1919 5.33203 8.16699V4.41699C5.33203 2.39195 6.97398 0.75 8.99902 0.75C11.0239 0.750176 12.665 2.39206 12.665 4.41699V8.16699Z" fill="currentColor"></path>
                                <path d="M14.8058 9.11426C14.4089 8.99623 13.9915 9.22244 13.8732 9.61914C13.2481 11.7194 11.3018 13.25 9.00011 13.25C6.69845 13.25 4.75214 11.7194 4.12706 9.61914C4.00876 9.22245 3.59126 8.99626 3.19444 9.11426C2.79744 9.23241 2.57141 9.65085 2.68956 10.0479C3.43005 12.5353 5.60114 14.4067 8.25011 14.707V15.75H6.91612C6.50191 15.75 6.16612 16.0858 6.16612 16.5C6.16612 16.9142 6.50191 17.25 6.91612 17.25H11.0831L11.1593 17.2461C11.5376 17.2078 11.8331 16.8884 11.8331 16.5C11.8331 16.1116 11.5376 15.7922 11.1593 15.7539L11.0831 15.75H9.75011V14.707C12.3991 14.4066 14.5702 12.5353 15.3107 10.0479C15.4288 9.65085 15.2028 9.23241 14.8058 9.11426Z" fill="currentColor"></path>
                              </svg>
                            </button>
                            {/* Send button */}
          <Button
            onClick={() => handleSendMessage()}
                              disabled={isLoading || !inputValue.trim()}
                              size="sm"
                              className="bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white rounded-full h-10 w-10 flex-shrink-0"
          >
                              <ArrowUp className="w-4 h-4" />
          </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
