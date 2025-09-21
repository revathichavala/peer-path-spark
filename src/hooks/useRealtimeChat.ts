import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeClient, RealtimeMessage, TypingEvent, PresenceUpdate } from '@/lib/realtime-client';
import { mongoClient, ChatRoom } from '@/lib/mongodb-client';
import { useMongoAuth } from './useMongoAuth';

interface ChatState {
  rooms: ChatRoom[];
  messages: Record<string, RealtimeMessage[]>;
  typingUsers: Record<string, TypingEvent[]>;
  onlineUsers: Record<string, PresenceUpdate>;
  isConnected: boolean;
  isLoading: boolean;
}

export const useRealtimeChat = () => {
  const { user, isAuthenticated } = useMongoAuth();
  const [chatState, setChatState] = useState<ChatState>({
    rooms: [],
    messages: {},
    typingUsers: {},
    onlineUsers: {},
    isConnected: false,
    isLoading: false,
  });

  const currentRoomRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize realtime connection and load rooms
  useEffect(() => {
    if (isAuthenticated && user) {
      loadRooms();
      setupRealtimeHandlers();
    }
  }, [isAuthenticated, user]);

  const setupRealtimeHandlers = useCallback(() => {
    realtimeClient.setEventHandlers({
      onConnect: () => {
        setChatState(prev => ({ ...prev, isConnected: true }));
      },
      onDisconnect: () => {
        setChatState(prev => ({ ...prev, isConnected: false }));
      },
      onMessage: (message: RealtimeMessage) => {
        setChatState(prev => ({
          ...prev,
          messages: {
            ...prev.messages,
            [message.room_id]: [
              ...(prev.messages[message.room_id] || []),
              message,
            ],
          },
        }));
      },
      onMessageDeleted: (messageId: string) => {
        setChatState(prev => {
          const newMessages = { ...prev.messages };
          
          Object.keys(newMessages).forEach(roomId => {
            newMessages[roomId] = newMessages[roomId].filter(
              msg => msg.id !== messageId
            );
          });
          
          return { ...prev, messages: newMessages };
        });
      },
      onTyping: (typing: TypingEvent) => {
        setChatState(prev => {
          const roomTyping = prev.typingUsers[typing.room_id] || [];
          
          if (typing.is_typing) {
            // Add or update typing user
            const filtered = roomTyping.filter(t => t.user_id !== typing.user_id);
            return {
              ...prev,
              typingUsers: {
                ...prev.typingUsers,
                [typing.room_id]: [...filtered, typing],
              },
            };
          } else {
            // Remove typing user
            return {
              ...prev,
              typingUsers: {
                ...prev.typingUsers,
                [typing.room_id]: roomTyping.filter(t => t.user_id !== typing.user_id),
              },
            };
          }
        });
      },
      onPresenceUpdate: (presence: PresenceUpdate) => {
        setChatState(prev => ({
          ...prev,
          onlineUsers: {
            ...prev.onlineUsers,
            [presence.room_id]: presence,
          },
        }));
      },
      onError: (error: Error) => {
        console.error('Realtime error:', error);
      },
    });
  }, []);

  const loadRooms = async () => {
    setChatState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await mongoClient.getRooms();
      
      if (response.success && response.data) {
        setChatState(prev => ({
          ...prev,
          rooms: response.data!,
          isLoading: false,
        }));
      } else {
        console.error('Failed to load rooms:', response.error);
        setChatState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      setChatState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const joinRoom = useCallback(async (roomId: string) => {
    if (!realtimeClient.isConnected()) {
      console.warn('Not connected to realtime server');
      return;
    }

    // Leave current room if any
    if (currentRoomRef.current) {
      realtimeClient.leaveRoom(currentRoomRef.current);
    }

    // Join new room
    realtimeClient.joinRoom(roomId);
    currentRoomRef.current = roomId;

    // Load message history
    try {
      const response = await mongoClient.getRoomMessages(roomId);
      
      if (response.success && response.data) {
        // Convert API messages to RealtimeMessage format
        const realtimeMessages: RealtimeMessage[] = response.data.map(msg => ({
          id: msg.id,
          room_id: msg.room_id,
          sender_id: msg.sender_id,
          sender_name: msg.sender_id, // You may want to fetch this from user data
          content: msg.content,
          created_at: msg.created_at,
        }));

        setChatState(prev => ({
          ...prev,
          messages: {
            ...prev.messages,
            [roomId]: realtimeMessages,
          },
        }));
      }
    } catch (error) {
      console.error('Error loading message history:', error);
    }
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (realtimeClient.isConnected()) {
      realtimeClient.leaveRoom(roomId);
    }
    
    if (currentRoomRef.current === roomId) {
      currentRoomRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((roomId: string, content: string) => {
    if (!realtimeClient.isConnected() || !user) {
      console.warn('Cannot send message: not connected or not authenticated');
      return;
    }

    // Generate temporary ID for optimistic update
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    // Optimistic update
    const tempMessage: RealtimeMessage = {
      id: tempId,
      room_id: roomId,
      sender_id: user.id,
      sender_name: user.name,
      content,
      created_at: new Date().toISOString(),
      temp_id: tempId,
    };

    setChatState(prev => ({
      ...prev,
      messages: {
        ...prev.messages,
        [roomId]: [
          ...(prev.messages[roomId] || []),
          tempMessage,
        ],
      },
    }));

    // Send to server
    realtimeClient.sendMessage(roomId, content, tempId);
  }, [user]);

  const sendTyping = useCallback((roomId: string, isTyping: boolean) => {
    if (realtimeClient.isConnected()) {
      realtimeClient.sendTyping(roomId, isTyping);
    }

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (realtimeClient.isConnected()) {
          realtimeClient.sendTyping(roomId, false);
        }
      }, 3000);
    }
  }, []);

  const getCurrentRoom = useCallback(() => {
    return currentRoomRef.current;
  }, []);

  const getRoomMessages = useCallback((roomId: string) => {
    return chatState.messages[roomId] || [];
  }, [chatState.messages]);

  const getRoomTypingUsers = useCallback((roomId: string) => {
    return chatState.typingUsers[roomId] || [];
  }, [chatState.typingUsers]);

  const getRoomOnlineUsers = useCallback((roomId: string) => {
    return chatState.onlineUsers[roomId]?.users_online || [];
  }, [chatState.onlineUsers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (currentRoomRef.current) {
        realtimeClient.leaveRoom(currentRoomRef.current);
      }
    };
  }, []);

  return {
    rooms: chatState.rooms,
    isConnected: chatState.isConnected,
    isLoading: chatState.isLoading,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    getCurrentRoom,
    getRoomMessages,
    getRoomTypingUsers,
    getRoomOnlineUsers,
    refreshRooms: loadRooms,
  };
};