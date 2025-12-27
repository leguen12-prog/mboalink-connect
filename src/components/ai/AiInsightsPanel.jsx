import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, MessageSquare, Send, Sparkles, 
  Loader2, Bot, User as UserIcon, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from 'react-markdown';

export default function AiInsightsPanel({ context, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your AI network analyst. I can help you understand network issues, analyze device performance, and suggest solutions.\n\n${context ? `I see you're looking at: **${context.deviceName}**\n\nHow can I assist you?` : 'What would you like to know?'}`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const contextInfo = context ? `
Current Context:
- Device Type: ${context.deviceType?.toUpperCase()}
- Device ID: ${context.deviceId}
- Device Name: ${context.deviceName}
- Current Status: ${context.status}
${context.metrics ? `- Metrics: ${JSON.stringify(context.metrics, null, 2)}` : ''}
` : '';

      const conversationHistory = messages.slice(-6).map(m => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n\n');

      const prompt = `You are an expert FTTH network engineer AI for MBOALINK.

${contextInfo}

Previous conversation:
${conversationHistory}

User question: ${input}

Provide a helpful, technical but clear response. Use markdown formatting for better readability.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      }]);
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed top-0 right-0 h-full w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <p className="text-xs text-slate-500">Network Analysis</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                message.role === 'user' 
                  ? 'bg-amber-500/20 text-white border border-amber-500/30' 
                  : 'bg-slate-800/50 text-slate-300 border border-slate-700/50'
              }`}>
                {message.role === 'user' ? (
                  <p className="text-sm">{message.content}</p>
                ) : (
                  <ReactMarkdown 
                    className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="ml-4 mb-2 list-disc">{children}</ul>,
                      ol: ({ children }) => <ol className="ml-4 mb-2 list-decimal">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                      code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-slate-900 text-purple-400 text-xs">{children}</code>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>

              {message.role === 'user' && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-slate-700 text-white text-xs">
                    <UserIcon className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-slate-800/50 rounded-2xl px-4 py-3 border border-slate-700/50">
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about network issues..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
            className="bg-slate-800/50 border-slate-700 text-white flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          <Sparkles className="w-3 h-3 inline mr-1" />
          AI-powered network analysis
        </p>
      </div>
    </motion.div>
  );
}