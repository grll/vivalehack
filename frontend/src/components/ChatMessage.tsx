import React from 'react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { IoDocumentText, IoCalendar, IoPerson } from 'react-icons/io5';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  references?: Record<string, Reference>;
}

interface Reference {
  type: 'document' | 'event' | 'person';
  link: string;
  eventId?: string;
  documentId?: string;
}

interface ParsedResponse {
  message: string;
  references: Record<string, Reference>;
}

// Parse JSON content if it's a JSON string
const parseMessageContent = (content: string): { text: string; references: Record<string, Reference> } => {
  try {
    const parsed: ParsedResponse = JSON.parse(content);
    return {
      text: parsed.message || content,
      references: parsed.references || {}
    };
  } catch (error) {
    // If not JSON, return as plain text
    return {
      text: content,
      references: {}
    };
  }
};

// Process and render text with references
const renderMessageWithReferences = (
  text: string, 
  references: Record<string, Reference>
) => {
  // Process the text to replace {key} patterns with placeholders
  let processedText = text;
  
  const referencePattern = /{([^}]+)}/g;
  const matches = [...text.matchAll(referencePattern)];
  
  matches.forEach((match) => {
    const [fullMatch, key] = match;
    const reference = references[key];
    
    if (reference) {
      let replacement = '';
      switch (reference.type) {
        case 'document':
          replacement = `[DOCUMENT_${key}]`;
          break;
        case 'event':
          replacement = `[EVENT_${key}]`;
          break;
        case 'person':
          replacement = `[PERSON_${key}]`;
          break;
      }
      processedText = processedText.replace(fullMatch, replacement);
    }
  });

  // Split the entire processed text by our placeholders and create React elements
  const parts = processedText.split(/(\[(?:DOCUMENT|EVENT|PERSON)_[^\]]+\])/);
  
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-gray dark:prose-gray">
      {parts.map((part, index) => {
        const documentMatch = part.match(/^\[DOCUMENT_([^\]]+)\]$/);
        const eventMatch = part.match(/^\[EVENT_([^\]]+)\]$/);
        const personMatch = part.match(/^\[PERSON_([^\]]+)\]$/);
        
        if (documentMatch) {
          const key = documentMatch[1];
          const reference = references[key];
          
          if (reference) {
            return (
              <a
                key={index}
                href={reference.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors align-middle"
                title={`View document: ${key}`}
              >
                <IoDocumentText className="w-5 h-5" />
              </a>
            );
          }
        }
        
        if (eventMatch) {
          const key = eventMatch[1];
          const reference = references[key];
          
          if (reference) {
            return (
              <a
                key={index}
                href={reference.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center ml-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors align-middle"
                title={`View event: ${key}`}
              >
                <IoCalendar className="w-5 h-5" />
              </a>
            );
          }
        }

        if (personMatch) {
          const key = personMatch[1];
          const reference = references[key];
          
          if (reference) {
            return (
              <a
                key={index}
                href={reference.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center ml-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors align-middle"
                title={`View profile: ${key}`}
              >
                <IoPerson className="w-5 h-5" />
              </a>
            );
          }
        }
        
        // Regular text - render with ReactMarkdown
        if (part && !documentMatch && !eventMatch && !personMatch) {
          return (
            <ReactMarkdown
              key={index}
              components={{
                h1: ({children}) => <h1 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{children}</h1>,
                h2: ({children}) => <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{children}</h2>,
                h3: ({children}) => <h3 className="text-base font-bold mb-2 text-gray-900 dark:text-white">{children}</h3>,
                ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                li: ({children}) => <li className="text-gray-900 dark:text-white">{children}</li>,
                p: ({children}) => (
                  <p className="mb-3 last:mb-0 text-gray-900 dark:text-white leading-relaxed">
                    {children}
                  </p>
                ),
                strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                em: ({children}) => <em className="italic text-gray-900 dark:text-white">{children}</em>,
                code: ({children}) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-gray-900 dark:text-white">{children}</code>,
                pre: ({children}) => <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto mb-4">{children}</pre>,
                a: ({children, href}) => (
                  <a 
                    href={href} 
                    className="inline-block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 no-underline" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {part}
            </ReactMarkdown>
          );
        }
        
        return null;
      })}
    </div>
  );
};

const ChatMessage = ({ message, isUser, timestamp, references = {} }: ChatMessageProps) => {
  // Use the passed references instead of parsing the content
  const processedContent = renderMessageWithReferences(message, references);

  return (
    <div className={cn(
      "flex mb-8",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "relative rounded-3xl",
        isUser 
          ? 'max-w-[70%] px-5 py-2.5 text-gray-900 dark:text-black bg-[#e9eaec] dark:bg-white'
          : 'w-full p-3 text-gray-900 dark:text-white'
      )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{message}</div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-gray dark:prose-gray">
            {processedContent}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
