import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  Pressable,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { fetchAllTalents } from '../../store/slices/talentsSlice';
import { Talent } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Alert as AlertComponent, AlertDescription } from '../../components/ui/alert';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import { COLORS } from '../../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';

const { width, height } = Dimensions.get('window');

export default function TalentsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { talents, isLoading, error } = useAppSelector((state) => state.talents);
  const { user } = useAppSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('feed');
  const [likedTalents, setLikedTalents] = useState<Set<string>>(new Set());
  const [savedTalents, setSavedTalents] = useState<Set<string>>(new Set());
  const [showStories, setShowStories] = useState(true);
  const [scaleAnimations] = useState(() => new Map<string, Animated.Value>());
  
  // Custom modal states for messaging
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [currentTalent, setCurrentTalent] = useState<Talent | null>(null);
  const [modalType, setModalType] = useState<'message' | 'collaboration'>('message');

  // Initialize scale animations for each talent
  useEffect(() => {
    talents.forEach(talent => {
      if (!scaleAnimations.has(talent.id)) {
        scaleAnimations.set(talent.id, new Animated.Value(1));
      }
    });
  }, [talents, scaleAnimations]);

  // Load user's liked and saved talents on mount
  useEffect(() => {
    console.log('TalentsScreen useEffect triggered, user:', user);
    if (user?.studentId && user.studentId.trim() !== '') {
      console.log('Calling loadUserPreferences with studentId:', user.studentId);
      loadUserPreferences();
    } else {
      console.log('No valid studentId found, not loading user preferences');
      console.log('User object:', user);
      // Set empty sets as fallback
      setLikedTalents(new Set());
      setSavedTalents(new Set());
    }
  }, [user?.studentId]);

  const loadUserPreferences = async () => {
    try {
      if (user?.studentId && user.studentId.trim() !== '') {
        console.log('Loading user preferences for studentId:', user.studentId);
        console.log('User object:', user);
        
        const [likedResponse, savedResponse] = await Promise.all([
          apiService.getLikedTalents(user.studentId),
          apiService.getSavedTalents(user.studentId),
        ]);
        
        console.log('Liked response:', likedResponse);
        console.log('Saved response:', savedResponse);
        
        // Add safety checks to ensure responses are arrays
        if (Array.isArray(likedResponse)) {
          setLikedTalents(new Set(likedResponse.map((talent: any) => talent.id)));
        } else {
          console.log('Liked response is not an array, setting empty set');
          setLikedTalents(new Set());
        }
        
        if (Array.isArray(savedResponse)) {
          setSavedTalents(new Set(savedResponse.map((talent: any) => talent.id)));
        } else {
          console.log('Saved response is not an array, setting empty set');
          setSavedTalents(new Set());
        }
      } else {
        console.log('No valid studentId found, skipping user preferences');
        console.log('User object:', user);
        // Set empty sets as fallback
        setLikedTalents(new Set());
        setSavedTalents(new Set());
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      // Set empty sets as fallback
      setLikedTalents(new Set());
      setSavedTalents(new Set());
    }
  };

  // Filter talents based on search and filter
  const filteredTalents = (talents || []).filter((talent) => {
    const matchesSearch = talent.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         talent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || talent.category.toLowerCase() === selectedFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  // Get unique talent categories for filtering
  const talentCategories = ['all', ...Array.from(new Set((talents || []).map(t => t.category)))];

  useEffect(() => {
    loadTalents();
  }, []);

  // Refresh talents when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('TalentsScreen: Screen focused, refreshing talents...');
      loadTalents();
    }, [])
  );

  const loadTalents = async () => {
    try {
      await dispatch(fetchAllTalents()).unwrap();
    } catch (error) {
      console.error('Failed to load talents:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTalents();
    setRefreshing(false);
  };

  const handleViewTalent = (talent: Talent) => {
    navigation.navigate('TalentDetail', { talent });
  };

  const handleAddTalent = () => {
    navigation.navigate('AddTalent');
  };

  const handleLikeTalent = async (talentId: string) => {
    console.log('handleLikeTalent called with talentId:', talentId);
    console.log('Current user object:', user);
    console.log('User studentId:', user?.studentId);
    
    const scaleAnim = scaleAnimations.get(talentId);
    if (scaleAnim) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    setLikedTalents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(talentId)) {
        newSet.delete(talentId);
      } else {
        newSet.add(talentId);
      }
      return newSet;
    });

    try {
      if (user?.studentId) {
        const isLiked = !likedTalents.has(talentId);
        console.log('Calling likeTalent API with:', { studentId: user.studentId, talentId, isLiked });
        await apiService.likeTalent(user.studentId, talentId, isLiked);
      } else {
        console.log('No studentId found in user object');
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      Alert.alert('Error', 'Failed to like talent.');
    }
  };

  const handleSaveTalent = async (talentId: string) => {
    console.log('handleSaveTalent called with talentId:', talentId);
    console.log('Current user object:', user);
    console.log('User studentId:', user?.studentId);
    
    const scaleAnim = scaleAnimations.get(talentId);
    if (scaleAnim) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    setSavedTalents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(talentId)) {
        newSet.delete(talentId);
      } else {
        newSet.add(talentId);
      }
      return newSet;
    });

    try {
      if (user?.studentId) {
        const isSaved = !savedTalents.has(talentId);
        console.log('Calling saveTalent API with:', { studentId: user.studentId, talentId, isSaved });
        await apiService.saveTalent(user.studentId, talentId, isSaved);
      } else {
        console.log('No studentId found in user object');
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
      Alert.alert('Error', 'Failed to save talent.');
    }
  };

  const handleShareTalent = (talent: Talent) => {
    Alert.alert(
      'Share Talent',
      'Share this amazing talent with others!',
      [
        { 
          text: 'Copy Link', 
          onPress: () => {
            // In a real app, you would copy a deep link to clipboard
            console.log('Copying link for talent:', talent.id);
            Alert.alert('Success', 'Link copied to clipboard!');
          }
        },
        { 
          text: 'View Profile', 
          onPress: () => navigation.navigate('StudentProfile', { student: talent.student })
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleCollaborate = async (talent: Talent) => {
    // Check if user is trying to collaborate with themselves
    if (user?.studentId === talent.studentId) {
      Alert.alert('Cannot Collaborate', 'You cannot collaborate with yourself.');
      return;
    }

    // Check if user is authenticated
    if (!user?.studentId) {
      Alert.alert('Authentication Required', 'Please log in to send collaboration requests.');
      return;
    }

    console.log('Showing collaboration prompt');
    
    // Set up collaboration modal
    setCurrentTalent(talent);
    setModalType('collaboration');
    setMessageText('');
    setShowCollaborationModal(true);
  };

  const handleDirectMessage = async (talent: Talent) => {
    console.log('handleDirectMessage called with talent:', talent);
    console.log('Current user:', user);
    
    // Check if user is trying to message themselves
    if (user?.studentId === talent.studentId) {
      console.log('User trying to message themselves');
      Alert.alert('Cannot Message', 'You cannot send messages to yourself.');
      return;
    }

    // Check if user is authenticated
    if (!user?.studentId) {
      console.log('User not authenticated');
      Alert.alert('Authentication Required', 'Please log in to send direct messages.');
      return;
    }

    console.log('Setting up message modal');
    setCurrentTalent(talent);
    setModalType('message');
    setMessageText('');
    setShowMessageModal(true);
  };

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    const baseUrl = process.env.API_BASE_URL || 'http://35.32.125.176:3001';
    return `${baseUrl}${filePath}`;
  };

  const renderStoryItem = (talent: Talent) => (
    <TouchableOpacity
      key={talent.id}
      style={styles.storyItem}
      onPress={() => handleViewTalent(talent)}
    >
      <View style={styles.storyRing}>
        <Image
          source={{ uri: getFileUrl(talent.files?.[0] || '') }}
          style={styles.storyImage}
          defaultSource={require('../../../assets/adaptive-icon.png')}
        />
      </View>
      <Text style={styles.storyName} numberOfLines={1}>
        {talent.student?.firstName || 'Student'}
      </Text>
    </TouchableOpacity>
  );

  const renderTalentCard = (talent: Talent) => {
    const firstFile = talent.files && talent.files.length > 0 ? talent.files[0] : null;
    const studentName = talent.student ? `${talent.student.firstName} ${talent.student.lastName}` : 'Unknown Student';
    const isLiked = likedTalents.has(talent.id);
    const isSaved = savedTalents.has(talent.id);

    const isVideoFile = (filePath: string) => {
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
      return videoExtensions.some(ext => filePath.toLowerCase().includes(ext));
    };

    return (
      <View key={talent.id} style={styles.talentCard}>
        {/* Header with user info and more options */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => navigation.navigate('StudentProfile', { student: talent.student })}
          >
            <Image
              source={require('../../../assets/adaptive-icon.png')}
              style={styles.userAvatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{studentName}</Text>
              <Text style={styles.userHandle}>@{talent.student?.firstName?.toLowerCase() || 'student'}</Text>
            </View>
          </TouchableOpacity>
          
         
        </View>

        {/* Media content */}
        <View style={styles.mediaContainer}>
          {firstFile ? (
            <TouchableOpacity
              onPress={() => handleViewTalent(talent)}
              activeOpacity={0.9}
            >
              {isVideoFile(firstFile) ? (
                <View style={styles.videoContainer}>
                  <Video
                    source={{ uri: getFileUrl(firstFile) }}
                    style={styles.mediaFile}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                    isMuted={true}
                    useNativeControls={false}
                    isLooping={false}
                  />
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play-circle" size={32} color="white" />
                  </View>
                </View>
              ) : (
                <Image
                  source={{ uri: getFileUrl(firstFile) }}
                  style={styles.mediaFile}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="image-outline" size={48} color="#d1d5db" />
              <Text style={styles.placeholderText}>No media</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionBar}>
          <View style={styles.leftActions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
                isLiked && styles.likedButton
              ]}
              onPress={() => handleLikeTalent(talent.id)}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnimations.get(talent.id) || new Animated.Value(1) }] }}>
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isLiked ? "#ef4444" : "#374151"} 
                />
              </Animated.View>
            </Pressable>
            
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed
              ]}
              onPress={() => handleDirectMessage(talent)}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#374151" />
            </Pressable>
            
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed
              ]}
              onPress={() => handleCollaborate(talent)}
            >
              <Ionicons name="people-outline" size={24} color="#374151" />
            </Pressable>
            
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed
              ]}
              onPress={() => handleShareTalent(talent)}
            >
              <Ionicons name="paper-plane-outline" size={24} color="#374151" />
            </Pressable>
          </View>
          
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
              isSaved && styles.savedButton
            ]}
            onPress={() => handleSaveTalent(talent.id)}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnimations.get(talent.id) || new Animated.Value(1) }] }}>
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={isSaved ? "#8F1A27" : "#374151"} 
              />
            </Animated.View>
          </Pressable>
        </View>

        {/* Content info */}
        <View style={styles.contentInfo}>
          <Text style={styles.likesCount}>
            {likedTalents.has(talent.id) ? '1 like' : '0 likes'}
          </Text>
          
          <View style={styles.talentInfo}>
            <Text style={styles.talentTitle} numberOfLines={2}>
              {talent.title}
            </Text>
            <Text style={styles.talentDescription} numberOfLines={3}>
              {talent.description}
            </Text>
          </View>
          
          <View style={styles.talentMeta}>
            <Badge style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{talent.category}</Text>
            </Badge>
            <Text style={styles.timestamp}>
              {new Date(talent.createdAt || Date.now()).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Owner actions */}
        {user?.studentId === talent.studentId && (
          <View style={styles.ownerActions}>
            <Button
              size="sm"
              variant="outline"
              onPress={() => navigation.navigate('EditTalent', { talent })}
              style={styles.editButton}
            >
              <Ionicons name="create" size={16} color="#8F1A27" />
              <Text style={styles.buttonText}>Edit</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() => {
                Alert.alert(
                  'Delete Talent',
                  'Are you sure you want to delete this talent?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive' },
                  ]
                );
              }}
              style={styles.deleteButton}
            >
              <Ionicons name="trash" size={16} color="#dc2626" />
              <Text style={styles.buttonText}>Delete</Text>
            </Button>
          </View>
        )}
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.container}>
        <AlertComponent variant="destructive" style={styles.errorAlert}>
          <AlertDescription>{error}</AlertDescription>
        </AlertComponent>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8F1A27" translucent />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#8F1A27', '#6A0032', '#8F1A27']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Discover</Text>
            <Text style={styles.subtitle}>Amazing student talents</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowStories(!showStories)}
            >
              <Ionicons 
                name={showStories ? "eye-off" : "eye"} 
                size={22} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'feed' : 'grid')}
            >
              <Ionicons 
                name={viewMode === 'grid' ? "list" : "grid"} 
                size={22} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleAddTalent}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Stories Section */}
      {showStories && (
        <View style={styles.storiesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(talents || []).slice(0, 10).map(renderStoryItem)}
          </ScrollView>
        </View>
      )}

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <Input
            placeholder="Search talents..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchInput}
          />
        </View>
         {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        {talentCategories.map((category) => (
          <Pressable
            key={category}
            style={({ pressed }) => [
              styles.categoryButton,
              selectedFilter === category && styles.categoryButtonActive,
              pressed && styles.categoryButtonPressed
            ]}
            onPress={() => setSelectedFilter(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedFilter === category && styles.categoryTextActive
            ]}>
              {category === 'all' ? 'All' : category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      </View>

     

      {/* Talents List */}
      <ScrollView
        style={styles.talentsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="refresh" size={32} color="#8F1A27" />
            <Text style={styles.loadingText}>Loading talents...</Text>
          </View>
        ) : filteredTalents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No talents found</Text>
            <Text style={styles.emptySubtext}>
              {searchTerm || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Be the first to add a talent!'
              }
            </Text>
          </View>
        ) : (
          <View style={[
            styles.talentsContainer,
            viewMode === 'grid' && styles.talentsGrid
          ]}>
            {filteredTalents.map(renderTalentCard)}
          </View>
        )}
      </ScrollView>

      {/* Custom Message Modal */}
      {showMessageModal && currentTalent && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Direct Message</Text>
              <TouchableOpacity
                onPress={() => setShowMessageModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Send a direct message to {currentTalent.student?.firstName || 'this student'} about their talent "{currentTalent.title}"
            </Text>
            
            <Input
              placeholder="Type your message..."
              value={messageText}
              onChangeText={setMessageText}
              style={styles.modalInput}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalActions}>
              <Button
                variant="outline"
                onPress={() => setShowMessageModal(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Button>
              <Button
                onPress={async () => {
                  if (!messageText.trim()) {
                    Alert.alert('Message Required', 'Please enter a message.');
                    return;
                  }
                  
                  try {
                    setShowMessageModal(false);
                    Alert.alert('Sending...', 'Sending message...');
                    
                    if (!user?.studentId) {
                      throw new Error('User ID not found');
                    }
                    
                    console.log('Sending direct message with data:', {
                      studentId: user.studentId,
                      recipientId: currentTalent.studentId,
                      message: messageText.trim(),
                      talentId: currentTalent.id
                    });
                    
                    // For now, we'll use the collaboration API as a direct message
                    // In the future, you can implement a separate direct messaging API
                    await apiService.requestCollaboration(
                      user.studentId,
                      currentTalent.studentId,
                      messageText.trim(),
                      currentTalent.id
                    );
                    
                    Alert.alert('Success', 'Message sent successfully! The student will be notified.');
                    setMessageText('');
                  } catch (error: any) {
                    console.error('Failed to send message:', error);
                    let errorMessage = 'Failed to send message.';
                    if (error.response?.status === 403) {
                      errorMessage = 'You cannot send messages to yourself.';
                    } else if (error.response?.status === 404) {
                      errorMessage = 'Student not found.';
                    } else if (error.response?.status === 400) {
                      errorMessage = 'Invalid request. Please check your message.';
                    }
                    Alert.alert('Error', errorMessage);
                  }
                }}
                style={[styles.modalButton, styles.sendButton]}
              >
                <Text style={styles.sendButtonText}>Send Message</Text>
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* Custom Collaboration Modal */}
      {showCollaborationModal && currentTalent && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Collaboration Request</Text>
              <TouchableOpacity
                onPress={() => setShowCollaborationModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Send a collaboration request to {currentTalent.student?.firstName || 'this student'} about their talent "{currentTalent.title}"
            </Text>
            
            <Input
              placeholder="Describe your collaboration idea..."
              value={messageText}
              onChangeText={setMessageText}
              style={styles.modalInput}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalActions}>
              <Button
                variant="outline"
                onPress={() => setShowCollaborationModal(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Button>
              <Button
                onPress={async () => {
                  if (!messageText.trim()) {
                    Alert.alert('Message Required', 'Please enter a message for your collaboration request.');
                    return;
                  }
                  
                  try {
                    setShowCollaborationModal(false);
                    Alert.alert('Sending...', 'Sending collaboration request...');
                    
                    if (!user?.studentId) {
                      throw new Error('User ID not found');
                    }
                    
                    console.log('Sending collaboration request with data:', {
                      studentId: user.studentId,
                      recipientId: currentTalent.studentId,
                      message: messageText.trim(),
                      talentId: currentTalent.id
                    });
                    
                    await apiService.requestCollaboration(
                      user.studentId,
                      currentTalent.studentId,
                      messageText.trim(),
                      currentTalent.id
                    );
                    
                    Alert.alert('Success', 'Collaboration request sent successfully! The student will be notified.');
                    setMessageText('');
                  } catch (error: any) {
                    console.error('Failed to send collaboration request:', error);
                    let errorMessage = 'Failed to send collaboration request.';
                    if (error.response?.status === 403) {
                      errorMessage = 'You cannot send collaboration requests to yourself.';
                    } else if (error.response?.status === 404) {
                      errorMessage = 'Student not found.';
                    } else if (error.response?.status === 400) {
                      errorMessage = 'Invalid request. Please check your message.';
                    }
                    Alert.alert('Error', errorMessage);
                  }
                }}
                style={[styles.modalButton, styles.sendButton]}
              >
                <Text style={styles.sendButtonText}>Send Request</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  headerGradient: {
    paddingTop: 35,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 0,
    opacity: 0.9,
    fontWeight: '500',
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInputContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 42,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    fontSize: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryContainer: {
   marginTop: 13,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryButtonActive: {
    backgroundColor: '#8F1A27',
    borderColor: '#8F1A27',
    shadowColor: '#8F1A27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  categoryText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  talentsList: {
    // marginTop: 20,
    // flex: 1,
    // paddingHorizontal: 12,
    paddingTop: 16,
    
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  talentsContainer: {
    paddingHorizontal: 6,
  },
  talentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  talentCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 18,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f8fafc',
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 1,
  },
  userHandle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  moreButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  mediaContainer: {
    height: 200,
    // borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  mediaFile: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 14,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  actionButtonPressed: {
    backgroundColor: '#e0e7ff',
    transform: [{ scale: 0.95 }],
  },
  likedButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  savedButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  likesCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  talentInfo: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  talentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 20,
  },
  talentDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 18,
    fontWeight: '400',
  },
  talentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  contentInfo: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryBadge: {
    backgroundColor: '#FEBF17',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryBadgeText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  timestamp: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderColor: '#8F1A27',
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderColor: '#dc2626',
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  buttonText: {
    fontSize: 12,
    color: '#8F1A27',
    fontWeight: '600',
  },
  storiesContainer: {
    height: 100,
    paddingHorizontal: 12,
    paddingVertical: 12,
    // marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  storyItem: {
    marginRight: 12,
    alignItems: 'center',
  },
  storyRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: '#8F1A27',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  storyImage: {
    width: 51,
    height: 51,
    borderRadius: 25.5,
  },
  storyName: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorAlert: {
    margin: 16,
  },
  placeholderContainer: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  starIcon: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#374151',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#8F1A27',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  modalButtonText: {
    fontSize: 14,
    color: '#8F1A27',
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#8F1A27',
    borderColor: '#8F1A27',
  },
  sendButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
}); 