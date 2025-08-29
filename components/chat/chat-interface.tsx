'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  message: string;
  senderId: string;
  senderName: string;
  sentAt: string;
}

interface ChatInterfaceProps {
  carId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    name: string;
    email: string;
  };
}

export default function ChatInterface({ carId, currentUserId, otherUser }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load initial messages
    loadMessages();

    // Set up polling for new messages
    const interval = setInterval(loadMessages, 3000);

    return () => clearInterval(interval);
  }, [carId]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${carId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/chat/${carId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage('');
        loadMessages(); // Reload messages to show the new one
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0 border-b">
        <CardTitle className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-zinc-200 text-xs">
            <AvatarFallback>{getUserInitials(otherUser.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-xs">{otherUser.name}</p>
            <p className="text-xs text-muted-foreground font-normal">{otherUser.email}</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length > 0 ? (
            messages.map(message => {
              const isCurrentUser = message.senderId === currentUserId;

              return (
                <div
                  key={message.id}
                  className={cn('flex gap-3', isCurrentUser ? 'justify-end' : 'justify-start')}
                >
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8 flex-shrink-0 text-xs font-medium">
                      <AvatarFallback>{getUserInitials(message.senderName)}</AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      'max-w-[70%] rounded-lg px-3 py-2',
                      isCurrentUser ? 'bg-black text-white' : 'bg-muted'
                    )}
                  >
                    <p className="text-xs">{message.message}</p>
                    <p
                      className={cn(
                        'text-xs mt-1',
                        isCurrentUser ? 'text-zinc-300' : 'text-muted-foreground'
                      )}
                    >
                      {new Date(message.sentAt).toLocaleTimeString()}
                    </p>
                  </div>

                  {isCurrentUser && (
                    <Avatar className="h-8 w-8 flex-shrink-0 text-xs font-medium">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground h-full flex items-center justify-center">
              <p className="text-xs">No hay mensajes aún. ¡Inicia la conversación!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t px-4 pt-5">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={isLoading}
              className="flex-1 text-xs"
            />
            <Button type="submit" disabled={isLoading || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
