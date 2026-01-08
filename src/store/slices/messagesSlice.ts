import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, Message } from '../../types';
import apiService from '../../services/api';

interface MessagesState {
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  isLoading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  conversations: [],
  messages: {},
  isLoading: false,
  error: null,
};

export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const conversations = await apiService.getConversations();
      return conversations;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const messages = await apiService.getMessages(conversationId);
      return { conversationId, messages };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ conversationId, messageData }: {
    conversationId: string;
    messageData: { content: string };
  }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { user: { id: string } } };
      const senderId = state.auth.user?.id;
      
      if (!senderId || senderId === 'undefined' || !senderId.trim()) {
        return rejectWithValue('Sender ID is missing. Please log out and log back in.');
      }
      
      if (!conversationId || conversationId === 'undefined' || !conversationId.trim()) {
        return rejectWithValue('Conversation ID is missing.');
      }
      
      if (!messageData.content || !messageData.content.trim()) {
        return rejectWithValue('Message content is required.');
      }
      
      const message = await apiService.sendMessage(conversationId, { 
        senderId: senderId.trim(), 
        content: messageData.content.trim() 
      });
      return { conversationId, message };
    } catch (error: any) {
      console.error('Send message error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to send message');
    }
  }
);

export const createConversation = createAsyncThunk(
  'messages/createConversation',
  async (participantIds: string[], { rejectWithValue }) => {
    try {
      // Validate participantIds
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
        return rejectWithValue('At least 2 participants are required');
      }
      
      // Filter and validate each ID
      const validIds = participantIds
        .filter(id => id && typeof id === 'string' && id.trim() !== '' && id !== 'undefined')
        .map(id => id.trim());
      
      if (validIds.length !== participantIds.length) {
        return rejectWithValue('Invalid participant IDs provided');
      }
      
      const conversation = await apiService.createConversation(validIds);
      return conversation;
    } catch (error: any) {
      console.error('Create conversation error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create conversation');
    }
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      delete state.messages[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        // Normalize conversations to always be an array
        if (Array.isArray(action.payload)) {
          state.conversations = action.payload;
        } else if (action.payload && typeof action.payload === 'object' && 'data' in action.payload) {
          // Handle case where response is wrapped in a data property
          state.conversations = Array.isArray(action.payload.data) ? action.payload.data : [];
        } else {
          state.conversations = [];
        }
        state.error = null;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Keep existing conversations on error, don't clear them
      })
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        const { conversationId, messages } = action.payload;
        state.messages[conversationId] = messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { conversationId, message } = action.payload;
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        state.messages[conversationId].push(message);
        
        // Update the conversation's lastMessage and updatedAt
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (conversation) {
          conversation.lastMessage = message;
          conversation.updatedAt = message.createdAt;
          // Move conversation to the top of the list
          state.conversations = [
            conversation,
            ...state.conversations.filter(c => c.id !== conversationId)
          ];
        }
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        // Ensure conversations is an array
        if (!Array.isArray(state.conversations)) {
          state.conversations = [];
        }
        // Check if conversation already exists
        const existingIndex = state.conversations.findIndex(c => c.id === action.payload.id);
        if (existingIndex >= 0) {
          // Update existing conversation
          state.conversations[existingIndex] = action.payload;
        } else {
          // Add new conversation to the beginning
          state.conversations.unshift(action.payload);
        }
      });
  },
});

export const { addMessage, clearError, clearMessages } = messagesSlice.actions;
export default messagesSlice.reducer; 