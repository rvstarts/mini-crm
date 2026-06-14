import { create } from 'zustand'

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: any[];
}

export interface AICommandState {
  messages: any[];
  sessions: ChatSession[];
  setMessages: (messages: any[] | ((prev: any[]) => any[])) => void;
  clearMessages: () => void;
  saveSessionAndNewChat: () => void;
  loadSession: (id: string) => void;
}

export const useAICommandStore = create<AICommandState>((set, get) => ({
  messages: [],
  sessions: [],
  setMessages: (update) => set((state) => ({ 
    messages: typeof update === 'function' ? update(state.messages) : update 
  })),
  clearMessages: () => set({ messages: [] }),
  saveSessionAndNewChat: () => {
    const { messages, sessions } = get();
    if (messages.length > 1) { // Only save if there's actual user interaction
      // Try to find the first user message for a title
      const userMsg = messages.find(m => m.role === 'user');
      const title = userMsg ? userMsg.content.substring(0, 30) + (userMsg.content.length > 30 ? '...' : '') : 'New Conversation';
      
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: title,
        timestamp: Date.now(),
        messages: [...messages]
      };
      set({ sessions: [newSession, ...sessions], messages: [] });
    } else {
      set({ messages: [] });
    }
  },
  loadSession: (id: string) => {
    const { sessions } = get();
    const session = sessions.find(s => s.id === id);
    if (session) {
      set({ messages: session.messages });
    }
  }
}))
