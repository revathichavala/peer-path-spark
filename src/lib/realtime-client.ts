import { io, Socket } from 'socket.io-client';

export interface RealtimeMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  temp_id?: string;
}

export interface TypingEvent {
  room_id: string;
  user_id: string;
  user_name: string;
  is_typing: boolean;
}

export interface PresenceUpdate {
  room_id: string;
  users_online: Array<{
    id: string;
    name: string;
    avatar_url?: string;
  }>;
}

export interface RealtimeEventHandlers {
  onMessage: (message: RealtimeMessage) => void;
  onMessageDeleted: (messageId: string) => void;
  onTyping: (typing: TypingEvent) => void;
  onPresenceUpdate: (presence: PresenceUpdate) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onError: (error: Error) => void;
}

class RealtimeClient {
  private socket: Socket | null = null;
  private accessToken: string | null = null;
  private handlers: Partial<RealtimeEventHandlers> = {};
  private currentRooms = new Set<string>();

  constructor(private serverUrl: string) {}

  connect(accessToken: string) {
    if (this.socket?.connected) {
      this.disconnect();
    }

    this.accessToken = accessToken;
    
    this.socket = io(this.serverUrl, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentRooms.clear();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to realtime server');
      this.handlers.onConnect?.();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from realtime server');
      this.handlers.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handlers.onError?.(new Error(error.message));
    });

    this.socket.on('new_message', (message: RealtimeMessage) => {
      this.handlers.onMessage?.(message);
    });

    this.socket.on('message_deleted', (data: { message_id: string }) => {
      this.handlers.onMessageDeleted?.(data.message_id);
    });

    this.socket.on('user_typing', (typing: TypingEvent) => {
      this.handlers.onTyping?.(typing);
    });

    this.socket.on('presence_update', (presence: PresenceUpdate) => {
      this.handlers.onPresenceUpdate?.(presence);
    });

    this.socket.on('room_joined', (data: { room_id: string }) => {
      console.log(`Joined room: ${data.room_id}`);
      this.currentRooms.add(data.room_id);
    });

    this.socket.on('room_left', (data: { room_id: string }) => {
      console.log(`Left room: ${data.room_id}`);
      this.currentRooms.delete(data.room_id);
    });
  }

  setEventHandlers(handlers: Partial<RealtimeEventHandlers>) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  joinRoom(roomId: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot join room');
      return;
    }

    this.socket.emit('join_room', { room_id: roomId });
  }

  leaveRoom(roomId: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot leave room');
      return;
    }

    this.socket.emit('leave_room', { room_id: roomId });
  }

  sendMessage(roomId: string, content: string, tempId?: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot send message');
      return;
    }

    this.socket.emit('send_message', {
      room_id: roomId,
      content,
      temp_id: tempId,
    });
  }

  sendTyping(roomId: string, isTyping: boolean) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot send typing indicator');
      return;
    }

    this.socket.emit('typing', {
      room_id: roomId,
      is_typing: isTyping,
    });
  }

  acknowledgeMessage(messageId: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot acknowledge message');
      return;
    }

    this.socket.emit('ack_message', { message_id: messageId });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getCurrentRooms(): string[] {
    return Array.from(this.currentRooms);
  }
}

// Create singleton instance
export const realtimeClient = new RealtimeClient(
  process.env.NODE_ENV === 'development'
    ? 'ws://localhost:5000'
    : 'wss://your-flask-backend.com'
);