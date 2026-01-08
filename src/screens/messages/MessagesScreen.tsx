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
import { showToast } from '../../components/ui/toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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

const { width, height } = Dimensions.get('window');

const MessagesScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAppSelector(state => state.auth);
  const { conversations, messages, isLoading, error } = useAppSelector(state => state.messages);
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [chatLoadError, setChatLoadError] = useState<string | null>(null);
  const [chatHeaderImageError, setChatHeaderImageError] = useState(false);
  const messagesListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Normalize conversations to ensure it's always an array
    const normalizedConversations = Array.isArray(conversations) ? conversations : [];
    console.log('Conversations updated:', normalizedConversations.length, normalizedConversations);
    
    if (normalizedConversations.length > 0) {
      console.log('First conversation:', normalizedConversations[0]);
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
      setFilteredConversations([]);
    } else {
      const searchLower = searchTerm.toLowerCase();
      
      // Filter users
      const filtered = allUsers.filter(u => {
        const firstName = u.firstName?.toLowerCase() || '';
        const lastName = u.lastName?.toLowerCase() || '';
        const email = u.email?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return firstName.includes(searchLower) ||
               lastName.includes(searchLower) ||
               email.includes(searchLower) ||
               fullName.includes(searchLower);
      });
      setFilteredUsers(filtered);
      
      // Filter conversations (deduplicated)
      const normalizedConversations = Array.isArray(conversations) ? conversations : [];
      const deduplicatedConvs = deduplicateConversations(normalizedConversations);
      const filteredConvs = deduplicatedConvs.filter(conv => {
        const participantName = getParticipantName(conv, user?.id || '').toLowerCase();
        const lastMsg = conv.lastMessage?.content?.toLowerCase() || '';
        return participantName.includes(searchLower) || lastMsg.includes(searchLower);
      });
      setFilteredConversations(filteredConvs);
    }
  }, [searchTerm, allUsers, conversations, user?.id]);

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
      // Don't show error if it's a 401 (unauthorized) or 403 (forbidden) - expected for some roles
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        console.error('Non-auth error loading users:', error);
        // Only show toast for unexpected errors
        showToast('Failed to load users. Some users may not be available.', 'warning');
      }
      // Set empty array on error so search still works with existing conversations
      setAllUsers([]);
    }
  };

  // Deduplicate conversations by participant pair - keep only the most recent one
  const deduplicateConversations = (conversations: Conversation[]): Conversation[] => {
    if (!Array.isArray(conversations) || conversations.length === 0) {
      return [];
    }

    if (!user?.id) {
      return conversations;
    }

    // Group conversations by participant pair (excluding current user)
    const conversationMap = new Map<string, Conversation>();

    for (const conv of conversations) {
      if (!conv.participants || !Array.isArray(conv.participants)) {
        continue;
      }

      // Get the other participant (not the current user)
      const otherParticipant = conv.participants.find(p => p.id !== user.id);
      if (!otherParticipant) {
        continue;
      }

      // Create a unique key for this participant pair
      const participantKey = otherParticipant.id;

      // Check if we already have a conversation with this participant
      const existingConv = conversationMap.get(participantKey);

      if (!existingConv) {
        // First conversation with this participant
        conversationMap.set(participantKey, conv);
      } else {
        // Compare timestamps to keep the most recent one
        const existingTime = existingConv.updatedAt 
          ? new Date(existingConv.updatedAt).getTime() 
          : existingConv.lastMessage?.createdAt 
            ? new Date(existingConv.lastMessage.createdAt).getTime() 
            : 0;
        
        const currentTime = conv.updatedAt 
          ? new Date(conv.updatedAt).getTime() 
          : conv.lastMessage?.createdAt 
            ? new Date(conv.lastMessage.createdAt).getTime() 
            : 0;

        if (currentTime > existingTime) {
          // Current conversation is more recent, replace it
          conversationMap.set(participantKey, conv);
        }
      }
    }

    // Return deduplicated conversations as an array, sorted by most recent
    return Array.from(conversationMap.values()).sort((a, b) => {
      const timeA = a.updatedAt 
        ? new Date(a.updatedAt).getTime() 
        : a.lastMessage?.createdAt 
          ? new Date(a.lastMessage.createdAt).getTime() 
          : 0;
      
      const timeB = b.updatedAt 
        ? new Date(b.updatedAt).getTime() 
        : b.lastMessage?.createdAt 
          ? new Date(b.lastMessage.createdAt).getTime() 
          : 0;

      return timeB - timeA; // Most recent first
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('Refreshing conversations...');
      await dispatch(fetchConversations()).unwrap();
      console.log('Conversations refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
      showToast('Failed to refresh conversations', 'error');
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
      // Refresh messages and conversations list
      await dispatch(fetchMessages(selectedConversation.id));
      await dispatch(fetchConversations());
      // Scroll to bottom after sending
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      showToast(error?.message || 'Failed to send message', 'error');
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
        // Refresh conversations list after creating
        await dispatch(fetchConversations());
      } catch (error: any) {
        console.error('Error creating conversation:', error);
        showToast(error?.message || 'Failed to create conversation', 'error');
        return;
      }
    }
    if (conv) {
      setSelectedConversation(conv);
      setChatLoadError(null);
      setChatHeaderImageError(false); // Reset image error when opening new chat
      try {
        await dispatch(fetchMessages(conv.id)).unwrap();
        // Scroll to bottom when messages load
        setTimeout(() => {
          messagesListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      } catch (error: any) {
        console.error('Error loading messages:', error);
        setChatLoadError('Failed to load messages');
      }
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
      // Check student relationship first (most reliable)
      if (otherParticipant.student) {
        const firstName = otherParticipant.student.firstName || '';
        const lastName = otherParticipant.student.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) return fullName;
      }
      
      // Fallback to direct firstName/lastName on participant
      const firstName = otherParticipant.firstName || '';
      const lastName = otherParticipant.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;
      
      // Last resort: show email or a default name
      if (otherParticipant.email) {
        // Extract name from email if possible
        const emailName = otherParticipant.email.split('@')[0];
        return emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
      return 'Student User';
    } else if (otherParticipant.role === 'business') {
      const businessName = otherParticipant.business?.businessName;
      if (businessName) return businessName;
      return 'Business User';
    }
    
    return 'Unknown User';
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
      // Check student relationship first
      if (otherParticipant.student) {
        const firstName = otherParticipant.student.firstName || '';
        const lastName = otherParticipant.student.lastName || '';
        if (firstName && lastName) {
          return `${firstName[0]}${lastName[0]}`.toUpperCase();
        }
        if (firstName) {
          return firstName[0].toUpperCase();
        }
      }
      
      // Fallback to direct firstName/lastName on participant
      const firstName = otherParticipant.firstName || '';
      const lastName = otherParticipant.lastName || '';
      if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
      }
      if (firstName) {
        return firstName[0].toUpperCase();
      }
      
      return 'S';
    } else if (otherParticipant.role === 'business') {
      const businessName = otherParticipant.business?.businessName;
      if (businessName) {
        return businessName[0].toUpperCase();
      }
      return 'B';
    }
    
    return 'U';
  };

  const getParticipantProfileImage = (conversation: Conversation, currentUserId: string): string | null => {
    if (!conversation.participants || !Array.isArray(conversation.participants)) {
      return null;
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
    if (!otherParticipant) {
      return null;
    }
    
    // Debug logging
    if (__DEV__) {
      console.log('Participant data:', {
        id: otherParticipant.id,
        role: otherParticipant.role,
        student: otherParticipant.student,
        business: otherParticipant.business,
        hasStudentProfileImage: !!otherParticipant.student?.profileImage,
        hasBusinessLogo: !!otherParticipant.business?.logo,
      });
    }
    
    // Check if participant has a student record with profileImage
    if (otherParticipant.role === 'student' && otherParticipant.student?.profileImage) {
      return otherParticipant.student.profileImage;
    }
    
    // For businesses, check if they have a logo
    if (otherParticipant.role === 'business' && otherParticipant.business?.logo) {
      return otherParticipant.business.logo;
    }
    
    return null;
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
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
    
    const apiBaseUrl = process.env.API_BASE_URL || 'http://192.168.0.106:3001';
    let cleanPath = filePath;
    
    // Remove leading slash if present
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // If path already includes uploads/, use it as is
    if (cleanPath.startsWith('uploads/')) {
      return `${apiBaseUrl}/${cleanPath}`;
    }
    
    // Default to profiles directory
    return `${apiBaseUrl}/uploads/profiles/${cleanPath}`;
  };

  const parseMessageContent = (content: string) => {
    const talentMatch = content.match(/\[About talent:\s*(.+?)\]/);
    if (talentMatch) {
      const talentTitle = talentMatch[1].trim();
      const messageContent = content.replace(/\[About talent:.+?\]\n*\n*/g, '').trim();
      return { talentTitle, messageContent };
    }
    return { talentTitle: null, messageContent: content };
  };

  const ConversationCard = React.memo(({ conversation }: { conversation: Conversation }) => {
    const otherParticipant = getOtherParticipant(conversation);
    const participantName = getParticipantName(conversation, user?.id || '');
    const participantInitials = getParticipantInitials(conversation, user?.id || '');
    const profileImage = getParticipantProfileImage(conversation, user?.id || '');
    const lastMessage = conversation.lastMessage;
    const [imageError, setImageError] = useState(false);

    // Parse message content for talent context
    const messageParse = lastMessage ? parseMessageContent(lastMessage.content) : null;

    // Debug logging
    if (__DEV__ && profileImage) {
      console.log(`Profile image for ${participantName}:`, profileImage, 'Full URL:', getFileUrl(profileImage));
    }

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => {
          console.log('Opening conversation:', conversation.id);
          openChat(conversation);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.conversationHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {profileImage && !imageError ? (
                <Image
                  source={{ uri: getFileUrl(profileImage) }}
                  style={styles.avatarImage}
                  onError={() => setImageError(true)}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{participantInitials}</Text>
              )}
            </View>
          </View>
          <View style={styles.conversationInfo}>
            <Text style={styles.participantName} numberOfLines={1}>{participantName}</Text>
            {lastMessage ? (
              <View style={styles.messagePreviewContainer}>
                {messageParse?.talentTitle && (
                  <View style={styles.talentBadge}>
                    <Ionicons name="star" size={12} color="#8F1A27" />
                    <Text style={styles.talentBadgeText} numberOfLines={1}>
                      {messageParse.talentTitle}
                    </Text>
                  </View>
                )}
                {messageParse?.messageContent ? (
                  <Text style={styles.lastMessage} numberOfLines={messageParse.talentTitle ? 1 : 2}>
                    {messageParse.messageContent}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.lastMessage} numberOfLines={1}>
                Click to start messaging
              </Text>
            )}
          </View>
          <View style={styles.conversationMeta}>
            {(lastMessage || conversation.updatedAt) && (
              <Text style={styles.lastMessageTime}>
                {formatTime(lastMessage?.createdAt || conversation.updatedAt)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  });

  const renderConversationCard = ({ item: conversation }: { item: Conversation }) => (
    <ConversationCard conversation={conversation} key={conversation.id} />
  );

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
      <LinearGradient
        colors={['#FAFBFC', '#FFFFFF', '#F5F7FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.chatContainer}
      >
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowChatModal(false)}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.maroon} />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            {selectedConversation && (() => {
              const participantName = getParticipantName(selectedConversation, user?.id || '');
              const profileImage = getParticipantProfileImage(selectedConversation, user?.id || '');
              const initials = getParticipantInitials(selectedConversation, user?.id || '');
              
              return (
                <>
                  <View style={styles.chatHeaderAvatar}>
                    {profileImage && !chatHeaderImageError ? (
                      <Image
                        source={{ uri: getFileUrl(profileImage) }}
                        style={styles.chatHeaderAvatarImage}
                        onError={() => {
                          console.log('Profile image error:', profileImage);
                          setChatHeaderImageError(true);
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.chatHeaderAvatarFallback}>
                        <Text style={styles.chatHeaderAvatarText}>{initials}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.chatHeaderText}>
                    <Text style={styles.chatHeaderName} numberOfLines={1}>
                      {participantName}
                    </Text>
                    <Text style={styles.chatHeaderSubtitle}>Active now</Text>
                  </View>
                </>
              );
            })()}
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={messagesListRef}
          data={selectedConversation ? (messages[selectedConversation.id] || []).slice().sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateA - dateB; // Sort ascending (oldest first)
          }) : []}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesListContent}
        />

        {/* Message Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.inputContainer, { paddingBottom: Math.max(24, insets.bottom + 8) }]}
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
      </LinearGradient>
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
          {/* <View style={styles.headerActions}>
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
          </View> */}
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            placeholder="Search conversations or users..."
            placeholderTextColor="#9ca3af"
            value={searchTerm}
            onChangeText={(text) => {
              setSearchTerm(text);
              if (text.trim() && allUsers.length === 0) {
                loadAllUsers();
              }
            }}
            onFocus={() => {
              if (allUsers.length === 0) {
                loadAllUsers();
              }
            }}
            style={styles.searchInput}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchTerm('');
                setFilteredUsers([]);
                setFilteredConversations([]);
              }}
              style={styles.clearSearchButton}
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {searchTerm.trim() && (
        <View style={styles.searchResults}>
          {/* Filtered Conversations */}
          {filteredConversations.length > 0 && (
            <View style={styles.searchSection}>
              <Text style={styles.searchSectionTitle}>
                Conversations ({filteredConversations.length})
              </Text>
              <FlatList
                data={filteredConversations}
                keyExtractor={item => item.id}
                style={styles.searchResultsList}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <ConversationCard conversation={item} />
                )}
              />
            </View>
          )}
          
          {/* Filtered Users */}
          {filteredUsers.length > 0 && (
            <View style={styles.searchSection}>
              <Text style={styles.searchSectionTitle}>
                Users ({filteredUsers.length})
              </Text>
              <FlatList
                data={filteredUsers}
                keyExtractor={item => `${item.role}-${item.id}`}
                style={styles.searchResultsList}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={async () => {
                      setSearchTerm('');
                      setFilteredUsers([]);
                      setFilteredConversations([]);
                      await openChat(null, item.id);
                    }}
                  >
                    <View style={styles.searchResultAvatar}>
                      <Text style={styles.searchResultAvatarText}>
                        {item.firstName ? item.firstName[0].toUpperCase() : item.email?.[0].toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName} numberOfLines={1}>
                        {item.firstName && item.lastName 
                          ? `${item.firstName} ${item.lastName}`
                          : item.email || 'Unknown User'
                        }
                      </Text>
                      <Text style={styles.searchResultEmail} numberOfLines={1}>{item.email}</Text>
                      <View style={styles.searchResultRoleBadge}>
                        <Text style={styles.searchResultRole}>{item.role}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
          
          {/* No Results */}
          {searchTerm.trim() && filteredConversations.length === 0 && filteredUsers.length === 0 && (
            <View style={styles.noSearchResults}>
              <Ionicons name="search-outline" size={48} color="#d1d5db" />
              <Text style={styles.noSearchResultsText}>No results found</Text>
              <Text style={styles.noSearchResultsSubtext}>
                Try searching by name or email
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Conversations List */}
      {!searchTerm.trim() && (isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.maroon} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : !Array.isArray(conversations) || conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No messages</Text>
        </View>
      ) : (
        <FlatList
            data={deduplicateConversations(Array.isArray(conversations) ? conversations : [])}
            renderItem={renderConversationCard}
            keyExtractor={(item) => item.id}
            style={styles.conversationsList}
            contentContainerStyle={Array.isArray(conversations) && conversations.length === 0 ? styles.emptyListContainer : styles.conversationsListContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>No messages</Text>
              </View>
            }
          />
      ))}

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
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  refreshButton: {
    padding: 8,
  },
  conversationsList: {
    flex: 1,
  },
  conversationsListContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  conversationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.maroon,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '600',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  messagePreviewContainer: {
    gap: 4,
  },
  talentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 2,
  },
  talentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8F1A27',
    marginLeft: 4,
    maxWidth: 150,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  conversationMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
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
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    marginRight: 12,
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatHeaderName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  chatHeaderSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesListContent: {
    flexGrow: 1,
    paddingVertical: 16,
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingBottom:30
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
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    padding: 0,
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 4,
  },
  searchResults: {
    paddingHorizontal: 16,
    marginBottom: 12,
    maxHeight: height * 0.6,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  searchResultsList: {
    maxHeight: 300,
  },
  noSearchResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noSearchResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  noSearchResultsSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  searchResultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.maroon,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchResultAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  searchResultAvatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  searchResultEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  searchResultRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  searchResultRole: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'capitalize',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.maroon,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  chatHeaderAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  chatHeaderAvatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: COLORS.maroon,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderAvatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
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
  emptyListContainer: {
    flexGrow: 1,
  },
});

export default MessagesScreen; 