import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Phone, Video, Paperclip } from 'lucide-react';
import { format } from 'date-fns';

export default function NOCChat({ open, onOpenChange, technicianId, isOnline }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const scrollRef = useRef(null);

  // Load chat history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem(`noc_chat_${technicianId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [technicianId]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`noc_chat_${technicianId}`, JSON.stringify(messages));
    }
  }, [messages, technicianId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: 'technician',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      status: isOnline ? 'sent' : 'queued'
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');

    // Simulate NOC response (in production, this would be real-time via WebSocket)
    if (isOnline) {
      setTimeout(() => {
        const response = {
          id: Date.now() + 1,
          sender: 'noc',
          content: 'Roger that. NOC is monitoring. How can we assist?',
          timestamp: new Date().toISOString(),
          status: 'sent'
        };
        setMessages(prev => [...prev, response]);
      }, 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">NOC Support</DialogTitle>
              <p className="text-sm text-slate-400 mt-1">
                {isOnline ? 'Online - Real-time support' : 'Offline - Messages will be sent when online'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                className="border-slate-700"
                disabled={!isOnline}
              >
                <Phone className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="border-slate-700"
                disabled={!isOnline}
              >
                <Video className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea ref={scrollRef} className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p>No messages yet</p>
                <p className="text-sm mt-1">Start a conversation with the NOC team</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'technician' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender === 'technician'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs opacity-70">
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </p>
                    {message.sender === 'technician' && (
                      <span className="text-xs opacity-70">
                        {message.status === 'queued' ? '⏱ Queued' : '✓ Sent'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-slate-800">
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              className="border-slate-700"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isOnline ? "Type a message..." : "Message will be sent when online..."}
              className="flex-1 bg-slate-800/50 border-slate-700 text-white"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}