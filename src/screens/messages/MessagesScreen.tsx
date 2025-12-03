import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { fetchConversations, fetchMessages, sendMessage, createConversation } from '../../store/slices/messagesSlice';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, Message, User } from '../../types';
import apiService from '../../services/api';
import { COLORS } from '../../theme/colors';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Alert as AlertComponent, AlertDescription } from '../../components/ui/alert';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const MessagesScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAppSelector(state => state.auth);
  const { conversations, messages, isLoading, error } = useAppSelector(state => state.messages);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [chatLoadError, setChatLoadError] = useState<string | null>(null);
  const messagesListRef = useRef<FlatList>(null);

  useEffect(() => {
    console.log('Conversations updated:', conversations?.length || 0, conversations);
    
    // Check if conversations is an object with data property
    if (conversations && typeof conversations === 'object' && 'data' in conversations) {
      console.log('Conversations has data property:', conversations.data);
    }
    
    // Check if conversations is an array
    if (Array.isArray(conversations)) {
      console.log('Conversations is an array with length:', conversations.length);
      if (conversations.length > 0) {
        console.log('First conversation:', conversations[0]);
      }
    }
  }, [conversations]);

  useEffect(() => {
    if (user?.id) {
      console.log('Fetching conversations for user:', user.id);
      dispatch(fetchConversations()).unwrap().then((result) => {
        console.log('Conversations fetched successfully:', result);
        if (Array.isArray(result) && result.length === 0) {
          console.log('No conversations found for user');
        }
      }).catch((error: any) => {
        console.error('Failed to fetch conversations:', error);
        // Don't show error if it's a 401 (unauthorized) - user probably logged out
        if (error?.response?.status !== 401) {
          console.error('Non-auth error fetching conversations:', error);
        }
      });
    } else {
      console.log('User not logged in, skipping conversation load');
    }
    loadAllUsers();
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers([]);
    } else {
      setFilteredUsers(
        allUsers.filter(u =>
          u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, allUsers]);

  const loadAllUsers = async () => {
    try {
      // Check if user is logged in before making API call
      if (!user?.id) {
        console.log('User not logged in, skipping user load');
        return;
      }
      
      const users = await apiService.getAllUsers();
      const filteredUsers = users.filter(u => u.id !== user?.id);
      setAllUsers(filteredUsers);
      console.log('Loaded users for search:', filteredUsers.length);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      // Don't show error if it's a 401 (unauthorized) - user probably logged out
      if (error?.response?.status !== 401) {
        console.error('Non-auth error loading users:', error);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('Refreshing conversations...');
      await dispatch(fetchConversations()).unwrap();
      console.log('Conversations refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
      Alert.alert('Error', 'Failed to refresh conversations');
    } finally {
    setRefreshing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      await dispatch(sendMessage({
        conversationId: selectedConversation.id,
        messageData: {
          content: newMessage.trim()
        }
      })).unwrap();
      setNewMessage('');
      // Refresh messages
      dispatch(fetchMessages(selectedConversation.id));
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const openChat = async (conversation: Conversation | null, otherUserId?: string) => {
    let conv = conversation;
    if (!conv && user && otherUserId) {
      // Create a new conversation if it doesn't exist
      try {
        const newConversation = await dispatch(createConversation([user.id, otherUserId])).unwrap();
        conv = newConversation;
      } catch (error) {
        Alert.alert('Error', 'Failed to create conversation');
        return;
      }
    }
    if (conv) {
      setSelectedConversation(conv);
      dispatch(fetchMessages(conv.id));
      setShowChatModal(true);
    }
  };

  const getOtherParticipant = (conversation: Conversation | null | undefined) => {
    if (!user || !conversation || !conversation.participants) return null;
    return conversation.participants.find(p => p.id !== user.id);
  };

  const getParticipantName = (conversation: Conversation, currentUserId: string) => {
    if (!conversation.participants || !Array.isArray(conversation.participants)) {
      return 'Unknown User';
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
    if (!otherParticipant) {
      return 'Unknown User';
    }
    
    // Handle different participant object structures
    if (otherParticipant.role === 'student') {
      const firstName = otherParticipant.firstName || '';
      const lastName = otherParticipant.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || otherParticipant.email || 'Student User';
    } else if (otherParticipant.role === 'business') {
      return otherParticipant.business?.businessName || otherParticipant.email || 'Business User';
    }
    
    return otherParticipant.email || 'Unknown User';
  };

  const getParticipantInitials = (conversation: Conversation, currentUserId: string) => {
    if (!conversation.participants || !Array.isArray(conversation.participants)) {
      return 'U';
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
    if (!otherParticipant) {
      return 'U';
    }
    
    if (otherParticipant.role === 'student') {
      const firstName = otherParticipant.firstName || '';
      const lastName = otherParticipant.lastName || '';
      if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
      }
      return otherParticipant.email ? otherParticipant.email[0].toUpperCase() : 'S';
    } else if (otherParticipant.role === 'business') {
      const businessName = otherParticipant.business?.businessName;
      if (businessName) {
        return businessName[0].toUpperCase();
      }
      return otherParticipant.email ? otherParticipant.email[0].toUpperCase() : 'B';
    }
    
    return 'U';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${process.env.API_BASE_URL || 'http://35.32.69.18:3001'}${filePath}`;
  };

  const renderConversationCard = ({ item: conversation }: { item: Conversation }) => {
    const otherParticipant = getOtherParticipant(conversation);
    const participantName = getParticipantName(conversation, user?.id || '');
    const participantInitials = getParticipantInitials(conversation, user?.id || '');
    const lastMessage = conversation.lastMessage;

    console.log('Rendering conversation:', conversation.id, participantName, otherParticipant);

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => {
          console.log('Opening conversation:', conversation.id);
          openChat(conversation);
        }}
      >
        <View style={styles.conversationHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{participantInitials}</Text>
            </View>
          </View>
          <View style={styles.conversationInfo}>
            <Text style={styles.participantName}>{participantName}</Text>
            {lastMessage ? (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {lastMessage.content}
              </Text>
            ) : (
              <Text style={styles.lastMessage} numberOfLines={1}>
                Click to start messaging
              </Text>
            )}
          </View>
          <View style={styles.conversationMeta}>
            {lastMessage && (
              <Text style={styles.lastMessageTime}>
                {formatTime(lastMessage.createdAt)}
              </Text>
            )}
            {conversation.updatedAt && (
              <Text style={styles.lastMessageTime}>
                {formatTime(conversation.updatedAt)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item: message }: { item: Message }) => {
    const isMyMessage = message.senderId === user?.id;

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(message.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderChatModal = () => (
    <Modal
      visible={showChatModal}
      animationType="slide"
      onRequestClose={() => setShowChatModal(false)}
    >
      <View style={styles.chatContainer}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowChatModal(false)}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.maroon} />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            {selectedConversation && (
              <>
                <View style={styles.chatHeaderAvatar}>
                  <Text style={styles.chatHeaderAvatarText}>
                    {getParticipantInitials(selectedConversation, user?.id || '')}
                  </Text>
                </View>
                <View style={styles.chatHeaderText}>
            <Text style={styles.chatHeaderName}>
                    {getParticipantName(selectedConversation, user?.id || '')}
            </Text>
                  <Text style={styles.chatHeaderSubtitle}>Online</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={messagesListRef}
          data={selectedConversation ? (messages[selectedConversation.id] || []) : []}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          inverted
          showsVerticalScrollIndicator={false}
        />

        {/* Message Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || isSending) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="send" size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#8F1A27', '#6A0032', '#8F1A27']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Messages</Text>
              <Text style={styles.subtitle}>Error occurred</Text>
            </View>
          </View>
        </LinearGradient>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.redAccent} />
          <Text style={styles.errorText}>Failed to load conversations</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          
          <TouchableOpacity
            style={styles.createConversationButton}
            onPress={() => {
              console.log('Retrying conversation fetch...');
              dispatch(fetchConversations());
            }}
          >
            <Text style={styles.createConversationButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Don't render messages screen if user is not logged in
  if (!user?.id) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Please log in to view messages</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#8F1A27', '#6A0032', '#8F1A27']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Messages</Text>
            <Text style={styles.subtitle}>Connect with students and businesses</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={() => {
                console.log('Opening user search from header button');
                setSearchTerm('');
                setFilteredUsers([]);
                // Load all users to show them immediately
                loadAllUsers();
              }}
            >
              <Ionicons name="add" size={20} color="#6A0032" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            onFocus={() => {
              console.log('Search input focused, loading all users');
              loadAllUsers();
            }}
            style={styles.searchInput}
        />
        </View>
      </View>

      {/* User Search Results */}
      {(searchTerm.trim() || filteredUsers.length > 0) && (
        <View style={styles.searchResults}>
          <View style={styles.searchResultsHeader}>
            <Text style={styles.searchResultsTitle}>
              {searchTerm.trim() ? 'Search Results' : 'All Users'}
            </Text>
            {!searchTerm.trim() && (
              <TouchableOpacity
                style={styles.closeSearchButton}
                onPress={() => {
                  setSearchTerm('');
                  setFilteredUsers([]);
                }}
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
          
          <FlatList
            data={searchTerm.trim() ? filteredUsers : allUsers}
            keyExtractor={item => `${item.role}-${item.id}`}
            style={styles.searchResultsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={async () => {
                  setSearchTerm('');
                  setFilteredUsers([]);
                  await openChat(null, item.id);
                }}
              >
                <View style={styles.searchResultAvatar}>
                  <Text style={styles.searchResultAvatarText}>
                    {item.firstName ? item.firstName[0] : item.email?.[0] || 'U'}
                  </Text>
                </View>
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultName}>
                    {item.firstName && item.lastName 
                      ? `${item.firstName} ${item.lastName}`
                      : item.email || 'Unknown User'
                    }
                  </Text>
                  <Text style={styles.searchResultEmail}>{item.email}</Text>
                  <Text style={styles.searchResultRole}>{item.role}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Conversations List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.maroon} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : !conversations || conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={64} color={COLORS.gray} />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Start connecting with others to see messages here</Text>
          
          {/* Debug info - only show in development */}
          {__DEV__ && (
            <>
              <Text style={styles.debugText}>User ID: {user?.id}</Text>
              <Text style={styles.debugText}>Loading: {isLoading.toString()}</Text>
              <Text style={styles.debugText}>Error: {error || 'None'}</Text>
              <Text style={styles.debugText}>Conversations type: {typeof conversations}</Text>
              <Text style={styles.debugText}>Conversations length: {conversations?.length || 'undefined'}</Text>
            </>
          )}
          
          <TouchableOpacity
            style={styles.createConversationButton}
            onPress={() => {
              console.log('Opening user search from start conversation button');
              setSearchTerm('');
              setFilteredUsers([]);
              // Load all users to show them immediately
              loadAllUsers();
            }}
          >
            <Text style={styles.createConversationButtonText}>Start a Conversation</Text>
          </TouchableOpacity>
          
          {/* Alternative: Show all users directly */}
          <TouchableOpacity
            style={styles.showUsersButton}
            onPress={() => {
              console.log('Showing all users directly');
              setSearchTerm('');
              setFilteredUsers([]);
              loadAllUsers();
            }}
          >
            <Text style={styles.showUsersButtonText}>Browse All Users</Text>
          </TouchableOpacity>
          
          {/* Test button for debugging */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => {
                console.log('Manually triggering conversation fetch...');
                dispatch(fetchConversations());
              }}
            >
              <Text style={styles.testButtonText}>Test Fetch Conversations</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          {/* Debug info - only show in development */}
          {__DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>Found {conversations.length} conversations</Text>
            </View>
          )}
          
          <FlatList
            data={conversations}
            renderItem={renderConversationCard}
            keyExtractor={(item) => item.id}
            style={styles.conversationsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {renderChatModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  refreshButton: {
    padding: 8,
  },
  conversationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  conversationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.maroon,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.gray,
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.redAccent,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.gray,
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  chatHeaderSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: COLORS.maroon,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: COLORS.white,
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  myMessageTime: {
    color: COLORS.white,
    opacity: 0.8,
  },
  otherMessageTime: {
    color: COLORS.gray,
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    backgroundColor: COLORS.maroon,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchResults: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeSearchButton: {
    padding: 4,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.maroon,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchResultAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  searchResultAvatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchResultEmail: {
    fontSize: 14,
    color: COLORS.gray,
  },
  searchResultRole: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 2,
  },
  errorAlert: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.gray,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.maroon,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatHeaderAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  chatHeaderAvatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatHeaderText: {
    flex: 1,
  },
  debugContainer: {
    padding: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  debugText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  createConversationButton: {
    marginTop: 20,
    backgroundColor: COLORS.maroon,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  createConversationButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  showUsersButton: {
    marginTop: 12,
    backgroundColor: COLORS.blue || '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  showUsersButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  testButton: {
    marginTop: 10,
    backgroundColor: COLORS.blue,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  apiTestButton: {
    marginTop: 10,
    backgroundColor: COLORS.purple,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  apiTestButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerGradient: {
    paddingTop: 35,
    paddingBottom: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addButton: {
    padding: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
});

export default MessagesScreen; 