import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { fetchAllTalents } from '../../store/slices/talentsSlice';
import { createConversation, sendMessage } from '../../store/slices/messagesSlice';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { showToast } from '../../components/ui/toast';
import { followUser, unfollowUser, checkFollowStatus } from '../../store/slices/followsSlice';

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
  const [heartBurstAnimations] = useState(() => new Map<string, { scale: Animated.Value; opacity: Animated.Value; rotation: Animated.Value }>());
  const [heartParticles] = useState(() => new Map<string, Array<{ 
    translateX: Animated.Value; 
    translateY: Animated.Value; 
    scale: Animated.Value; 
    opacity: Animated.Value; 
    rotation: Animated.Value;
  }>>());
  const [lastTap, setLastTap] = useState<{ talentId: string; timestamp: number } | null>(null);
  const tapTimeouts = React.useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [followingStatus, setFollowingStatus] = useState<Map<string, boolean>>(new Map());
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());
  
  // Custom modal states for messaging
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [currentTalent, setCurrentTalent] = useState<Talent | null>(null);
  const [modalType, setModalType] = useState<'message' | 'collaboration'>('message');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  // Reel viewer states
  const [reelModalVisible, setReelModalVisible] = useState(false);
  const [selectedReelTalent, setSelectedReelTalent] = useState<Talent | null>(null);
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [reelLastTap, setReelLastTap] = useState<{ timestamp: number } | null>(null);
  
  // Stories viewer states
  const [storiesModalVisible, setStoriesModalVisible] = useState(false);
  const [storiesByUser, setStoriesByUser] = useState<Map<string, Talent[]>>(new Map());
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentTalentIndex, setCurrentTalentIndex] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const storyProgressRef = useRef<Animated.Value>(new Animated.Value(0));
  const storyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const STORY_DURATION = 5000; // 5 seconds per story

  // Initialize scale animations for each talent
  useEffect(() => {
    talents.forEach(talent => {
      if (!scaleAnimations.has(talent.id)) {
        scaleAnimations.set(talent.id, new Animated.Value(1));
      }
      if (!heartBurstAnimations.has(talent.id)) {
        heartBurstAnimations.set(talent.id, {
          scale: new Animated.Value(0),
          opacity: new Animated.Value(0),
          rotation: new Animated.Value(0),
        });
      }
      if (!heartParticles.has(talent.id)) {
        // Create 8 particles for each talent
        const particles = Array.from({ length: 8 }, () => ({
          translateX: new Animated.Value(0),
          translateY: new Animated.Value(0),
          scale: new Animated.Value(0),
          opacity: new Animated.Value(0),
          rotation: new Animated.Value(0),
        }));
        heartParticles.set(talent.id, particles);
      }
    });
  }, [talents, scaleAnimations, heartBurstAnimations, heartParticles]);

  // Reset story timer when talent index changes
  useEffect(() => {
    if (storiesModalVisible) {
      startStoryTimer();
    }
    return () => {
      if (storyTimerRef.current) {
        clearTimeout(storyTimerRef.current);
      }
    };
  }, [currentTalentIndex, currentUserIndex, storiesModalVisible]);

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
  const filteredTalents = React.useMemo(() => {
    const talentsArray = Array.isArray(talents) ? talents : [];
    console.log(`Filtering ${talentsArray.length} talents. Search: "${searchTerm}", Filter: "${selectedFilter}"`);
    
    return talentsArray.filter((talent) => {
      const matchesSearch = !searchTerm.trim() || 
                           talent.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           talent.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = selectedFilter === 'all' || 
                           talent.category?.toLowerCase() === selectedFilter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [talents, searchTerm, selectedFilter]);

  // Get unique talent categories for filtering
  const talentCategories = ['all', ...Array.from(new Set((talents || []).map(t => t.category)))];

  const loadTalents = async () => {
    try {
      console.log('Loading talents from server...');
      const result = await dispatch(fetchAllTalents()).unwrap();
      console.log(`Talents loaded successfully. Count: ${Array.isArray(result) ? result.length : 'not an array'}`);
      console.log('Current talents in store:', talents?.length || 0);
    } catch (error: any) {
      console.error('Failed to load talents:', error);
      console.error('Error details:', error?.message, error?.response?.data);
    }
  };

  // Load talents on mount
  useEffect(() => {
    loadTalents();
  }, [dispatch]);

  // Refresh talents when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('TalentsScreen: Screen focused, refreshing talents...');
      loadTalents();
    }, [dispatch]) // Include dispatch in dependencies
  );

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

  const triggerHeartBurst = (talentId: string) => {
    const burstAnim = heartBurstAnimations.get(talentId);
    const particles = heartParticles.get(talentId);
    
    // Haptic feedback for better UX
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (burstAnim) {
      // Reset main heart burst
      burstAnim.scale.setValue(0);
      burstAnim.opacity.setValue(1);
      burstAnim.rotation.setValue(0);
      
      // Animate main heart with rotation
      Animated.parallel([
        Animated.spring(burstAnim.scale, {
          toValue: 2.0,
          friction: 3,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(burstAnim.rotation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(burstAnim.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        burstAnim.scale.setValue(0);
        burstAnim.rotation.setValue(0);
      });
    }

    // Animate particles
    if (particles) {
      const angles = [0, 45, 90, 135, 180, 225, 270, 315]; // 8 directions
      const distance = 80;
      
      particles.forEach((particle, index) => {
        // Reset particle
        particle.translateX.setValue(0);
        particle.translateY.setValue(0);
        particle.scale.setValue(0);
        particle.opacity.setValue(1);
        particle.rotation.setValue(0);
        
        const angle = (angles[index] * Math.PI) / 180;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        // Animate particle
        Animated.parallel([
          Animated.timing(particle.translateX, {
            toValue: x,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: y,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.spring(particle.scale, {
              toValue: 1,
              friction: 3,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.rotation, {
            toValue: 2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(200),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          particle.translateX.setValue(0);
          particle.translateY.setValue(0);
          particle.scale.setValue(0);
          particle.rotation.setValue(0);
        });
      });
    }
  };

  const handleLikeTalent = async (talentId: string) => {
    console.log('handleLikeTalent called with talentId:', talentId);
    console.log('Current user object:', user);
    console.log('User studentId:', user?.studentId);
    
    const isCurrentlyLiked = likedTalents.has(talentId);
    const willBeLiked = !isCurrentlyLiked;
    
    // Trigger heart burst animation only when liking (not unliking)
    if (willBeLiked) {
      triggerHeartBurst(talentId);
    }
    
    const scaleAnim = scaleAnimations.get(talentId);
    if (scaleAnim) {
      if (willBeLiked) {
        // More dramatic scale animation when liking
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.4,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Subtle animation when unliking
      Animated.sequence([
        Animated.timing(scaleAnim, {
            toValue: 0.85,
            duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      }
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
        const isLiked = !isCurrentlyLiked;
        console.log('Calling likeTalent API with:', { studentId: user.studentId, talentId, isLiked });
        await apiService.likeTalent(user.studentId, talentId, isLiked);
      } else {
        console.log('No studentId found in user object');
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      showToast('Failed to like talent.', 'error');
    }
  };

  const handleDoubleTap = (talent: Talent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    // Clear any existing timeout for this talent
    const existingTimeout = tapTimeouts.current.get(talent.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      tapTimeouts.current.delete(talent.id);
    }

    if (lastTap && lastTap.talentId === talent.id && now - lastTap.timestamp < DOUBLE_TAP_DELAY) {
      // Double tap detected - like the post
      if (!likedTalents.has(talent.id)) {
        handleLikeTalent(talent.id);
      }
      setLastTap(null);
    } else {
      // First tap - set up timeout for single tap navigation
      setLastTap({ talentId: talent.id, timestamp: now });
      const timeout = setTimeout(() => {
        // Single tap detected - navigate to detail
        handleViewTalent(talent);
        setLastTap(null);
        tapTimeouts.current.delete(talent.id);
      }, DOUBLE_TAP_DELAY);
      tapTimeouts.current.set(talent.id, timeout);
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
      showToast('Failed to save talent.', 'error');
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
            showToast('Link copied to clipboard!', 'success');
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
      showToast('You cannot collaborate with yourself.', 'warning');
      return;
    }

    // Check if user is authenticated
    if (!user?.studentId) {
      showToast('Please log in to send collaboration requests.', 'info');
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
    
    // Check if user is authenticated (either student or business)
    if (!user?.id) {
      console.log('User not authenticated');
      showToast('Please log in to send direct messages.', 'info');
      return;
    }

    // Check if user is trying to message themselves (only for students)
    if (user?.studentId && user.studentId === talent.studentId) {
      console.log('User trying to message themselves');
      showToast('You cannot send messages to yourself.', 'warning');
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
    const baseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'http://192.168.0.106:3001';
    return `${baseUrl}${filePath}`;
  };

  const renderStoryItem = (talent: Talent) => {
    const firstFile = talent.files && talent.files.length > 0 ? talent.files[0] : null;
    const isVideo = firstFile ? isVideoFile(firstFile) : false;
    
    return (
    <TouchableOpacity
      key={talent.id}
      style={styles.storyItem}
        onPress={() => openStoriesViewer(talent)}
        activeOpacity={0.8}
    >
      <View style={styles.storyRing}>
          {firstFile ? (
            isVideo ? (
              <View style={styles.storyVideoContainer}>
                <Video
                  source={{ uri: getFileUrl(firstFile) }}
                  style={styles.storyImage}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={true}
                  isMuted={true}
                  useNativeControls={false}
                  isLooping={true}
                />
              </View>
            ) : (
        <Image
                source={{ uri: getFileUrl(firstFile) }}
          style={styles.storyImage}
          defaultSource={require('../../../assets/adaptive-icon.png')}
        />
            )
          ) : (
            <Image
              source={require('../../../assets/adaptive-icon.png')}
              style={styles.storyImage}
            />
          )}
      </View>
      <Text style={styles.storyName} numberOfLines={1}>
        {talent.student?.firstName || 'Student'}
      </Text>
    </TouchableOpacity>
  );
  };

  const handleFollow = async (talent: Talent) => {
    if (!user?.id || !talent.student) return;
    
    // Use only the User ID, not the Student ID
    const followingId = talent.student.userId || talent.student.user?.id;
    if (!followingId) {
      showToast('Unable to find user information for this student.', 'error');
      return;
    }
    
    const followKey = `${user.id}-${followingId}`;
    const isCurrentlyFollowing = followingStatus.get(followKey) || false;
    
    // Prevent following yourself
    if (user.id === followingId || user.studentId === talent.studentId) {
      showToast('You cannot follow yourself.', 'warning');
      return;
    }
    
    setFollowLoading(prev => new Set(prev).add(followKey));
    
    try {
      if (isCurrentlyFollowing) {
        await dispatch(unfollowUser({ 
          followerId: user.id, 
          followingId 
        })).unwrap();
        setFollowingStatus(prev => {
          const newMap = new Map(prev);
          newMap.set(followKey, false);
          return newMap;
        });
        showToast(`Unfollowed ${talent.student.firstName} ${talent.student.lastName}`, 'info');
      } else {
        await dispatch(followUser({ 
          followerId: user.id, 
          followingId 
        })).unwrap();
        setFollowingStatus(prev => {
          const newMap = new Map(prev);
          newMap.set(followKey, true);
          return newMap;
        });
        showToast(`Following ${talent.student.firstName} ${talent.student.lastName}`, 'success');
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      showToast(error.message || 'Failed to update follow status', 'error');
    } finally {
      setFollowLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(followKey);
        return newSet;
      });
    }
  };

  // Check follow status for talents on mount
  useEffect(() => {
    if (!user?.id || talents.length === 0) return;
    
    const checkFollowStatuses = async () => {
      const statusChecks = talents
        .filter(talent => {
          // Only check if we have a User ID (not Student ID)
          const userId = talent.student?.userId || talent.student?.user?.id;
          return talent.student && userId;
        })
        .map(async (talent) => {
          // Use only the User ID, not the Student ID
          const followingId = talent.student!.userId || talent.student!.user?.id;
          if (!followingId) return;
          
          const followKey = `${user.id}-${followingId}`;
          
          // Skip if it's own profile
          if (user.id === followingId || user.studentId === talent.studentId) {
            return;
          }
          
          try {
            const result = await dispatch(checkFollowStatus({ 
              followerId: user.id, 
              followingId 
            })).unwrap();
            setFollowingStatus(prev => {
              const newMap = new Map(prev);
              newMap.set(followKey, result.isFollowing || false);
              return newMap;
            });
          } catch (error) {
            console.error('Error checking follow status:', error);
          }
        });
      
      await Promise.all(statusChecks);
    };
    
    checkFollowStatuses();
  }, [talents, user?.id, dispatch]);

  const openReelViewer = (talent: Talent, index: number = 0) => {
    setSelectedReelTalent(talent);
    setSelectedReelIndex(index);
    setReelModalVisible(true);
  };

  const openStoriesViewer = (talent: Talent) => {
    // Get all talents from the clicked user only
    const clickedStudentId = talent.student?.id || talent.studentId;
    if (!clickedStudentId) return;
    
    const userTalents = talents.filter(t => {
      const studentId = t.student?.id || t.studentId;
      return studentId === clickedStudentId;
    });
    
    // Group all users for vertical navigation
    const grouped = new Map<string, Talent[]>();
    talents.forEach(t => {
      if (t.student) {
        const studentId = t.student.id || t.studentId;
        if (studentId) {
          if (!grouped.has(studentId)) {
            grouped.set(studentId, []);
          }
          grouped.get(studentId)!.push(t);
        }
      }
    });
    
    setStoriesByUser(grouped);
    
    // Find the index of the clicked user
    const userArray = Array.from(grouped.keys());
    const userIndex = userArray.indexOf(clickedStudentId);
    
    setCurrentUserIndex(userIndex >= 0 ? userIndex : 0);
    setCurrentTalentIndex(0);
    setCurrentFileIndex(0);
    setStoryProgress(0);
    storyProgressRef.current.setValue(0);
    setStoriesModalVisible(true);
    startStoryTimer();
  };

  const startStoryTimer = () => {
    if (storyTimerRef.current) {
      clearTimeout(storyTimerRef.current);
    }
    
    storyProgressRef.current.setValue(0);
    
    // Animate progress bar
    Animated.timing(storyProgressRef.current, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start();
    
    // Auto-advance to next file
    storyTimerRef.current = setTimeout(() => {
      nextFile();
    }, STORY_DURATION);
  };

  const nextFile = () => {
    const userArray = Array.from(storiesByUser.keys());
    if (userArray.length === 0) return;
    
    const currentUserTalents = storiesByUser.get(userArray[currentUserIndex]) || [];
    const currentTalent = currentUserTalents[currentTalentIndex];
    
    if (!currentTalent) return;
    
    const files = currentTalent.files || [];
    
    if (currentFileIndex < files.length - 1) {
      // Next file in current talent
      setCurrentFileIndex(currentFileIndex + 1);
      setStoryProgress(0);
      storyProgressRef.current.setValue(0);
      startStoryTimer();
    } else if (currentTalentIndex < currentUserTalents.length - 1) {
      // Next talent from same user
      setCurrentTalentIndex(currentTalentIndex + 1);
      setCurrentFileIndex(0);
      setStoryProgress(0);
      storyProgressRef.current.setValue(0);
      startStoryTimer();
    } else {
      // End of current user's talents - don't auto-advance to next user
      closeStoriesViewer();
    }
  };

  const previousFile = () => {
    const userArray = Array.from(storiesByUser.keys());
    if (userArray.length === 0) return;
    
    const currentUserTalents = storiesByUser.get(userArray[currentUserIndex]) || [];
    const currentTalent = currentUserTalents[currentTalentIndex];
    
    if (!currentTalent) return;
    
    const files = currentTalent.files || [];
    
    if (currentFileIndex > 0) {
      // Previous file in current talent
      setCurrentFileIndex(currentFileIndex - 1);
      setStoryProgress(0);
      storyProgressRef.current.setValue(0);
      startStoryTimer();
    } else if (currentTalentIndex > 0) {
      // Previous talent from same user
      setCurrentTalentIndex(currentTalentIndex - 1);
      const prevTalent = currentUserTalents[currentTalentIndex - 1];
      const prevFiles = prevTalent?.files || [];
      setCurrentFileIndex(prevFiles.length > 0 ? prevFiles.length - 1 : 0);
      setStoryProgress(0);
      storyProgressRef.current.setValue(0);
      startStoryTimer();
    }
  };

  const nextUser = () => {
    const userArray = Array.from(storiesByUser.keys());
    if (currentUserIndex < userArray.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentTalentIndex(0);
      setStoryProgress(0);
      startStoryTimer();
    }
  };

  const previousUser = () => {
    if (currentUserIndex > 0) {
      setCurrentUserIndex(currentUserIndex - 1);
      const userArray = Array.from(storiesByUser.keys());
      const prevUserTalents = storiesByUser.get(userArray[currentUserIndex - 1]) || [];
      setCurrentTalentIndex(prevUserTalents.length - 1);
      setStoryProgress(0);
      startStoryTimer();
    }
  };

  const closeStoriesViewer = () => {
    if (storyTimerRef.current) {
      clearTimeout(storyTimerRef.current);
      storyTimerRef.current = null;
    }
    setStoriesModalVisible(false);
    storyProgressRef.current.setValue(0);
  };

  const isImageFile = (filePath: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
    return imageExtensions.some(ext => filePath.toLowerCase().includes(ext));
  };

  const isVideoFile = (filePath: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => filePath.toLowerCase().includes(ext));
  };

  const renderTalentCard = (talent: Talent) => {
    const firstFile = talent.files && talent.files.length > 0 ? talent.files[0] : null;
    const studentName = talent.student ? `${talent.student.firstName} ${talent.student.lastName}` : 'Unknown Student';
    const isLiked = likedTalents.has(talent.id);
    const isSaved = savedTalents.has(talent.id);
        // Use only the User ID, not the Student ID
        const followingId = talent.student?.userId || talent.student?.user?.id;
        const followKey = followingId ? `${user?.id}-${followingId}` : '';
        const isFollowing = followKey ? (followingStatus.get(followKey) || false) : false;
        const isFollowLoadingState = followKey ? followLoading.has(followKey) : false;
        const isOwnProfile = user?.id === followingId || user?.studentId === talent.studentId;

    const isVideoFile = (filePath: string) => {
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
      return videoExtensions.some(ext => filePath.toLowerCase().includes(ext));
    };

    return (
      <TouchableOpacity 
        key={talent.id} 
        style={styles.talentCard}
        activeOpacity={0.95}
        onPress={() => handleViewTalent(talent)}
      >
        {/* Header with user info */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('StudentProfile', { student: talent.student });
            }}
            activeOpacity={0.7}
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
          {!isOwnProfile && user?.id && (
            <TouchableOpacity
              style={isFollowing ? [styles.followButtonSmall, styles.followingButtonSmall] : styles.followButtonSmall}
              onPress={(e) => {
                e.stopPropagation();
                handleFollow(talent);
              }}
              disabled={isFollowLoadingState}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isFollowing ? "checkmark" : "add"} 
                size={14} 
                color={isFollowing ? "#8F1A27" : "white"} 
              />
              <Text style={isFollowing ? [styles.followButtonTextSmall, styles.followingButtonTextSmall] : styles.followButtonTextSmall}>
                {isFollowLoadingState ? '...' : (isFollowing ? 'Following' : 'Follow')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Media content - larger and more prominent */}
        <View style={styles.mediaContainer}>
          {firstFile ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                openReelViewer(talent, 0);
              }}
              activeOpacity={0.95}
            >
              {isVideoFile(firstFile) ? (
                <View style={styles.videoContainer}>
                  <Video
                    source={{ uri: getFileUrl(firstFile) }}
                    style={styles.mediaFile}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={true}
                    isMuted={true}
                    useNativeControls={false}
                    isLooping={true}
                    onPlaybackStatusUpdate={(status) => {
                      if (status.isLoaded) {
                        if (status.isPlaying) {
                          setPlayingVideos(prev => new Set(prev).add(talent.id));
                        } else {
                          setPlayingVideos(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(talent.id);
                            return newSet;
                          });
                        }
                      }
                    }}
                  />
                  {!playingVideos.has(talent.id) && (
                  <View style={styles.videoOverlay}>
                      <Ionicons name="play-circle" size={40} color="white" />
                  </View>
                  )}
                </View>
              ) : (
                <Image
                  source={{ uri: getFileUrl(firstFile) }}
                  style={styles.mediaFile}
                  resizeMode="cover"
                />
              )}
              {/* Heart burst animation overlay */}
              {(() => {
                const burstAnim = heartBurstAnimations.get(talent.id);
                const particles = heartParticles.get(talent.id);
                
                if (!burstAnim) return null;
                
                const rotation = burstAnim.rotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '20deg'],
                });
                
                return (
                  <>
                    {/* Main heart burst */}
                    <Animated.View
                      style={[
                        styles.heartBurst,
                        {
                          transform: [
                            { scale: burstAnim.scale },
                            { rotate: rotation },
                          ],
                          opacity: burstAnim.opacity,
                        },
                      ]}
                      pointerEvents="none"
                    >
                      <Ionicons name="heart" size={120} color="#ef4444" />
                    </Animated.View>
                    
                    {/* Particle hearts */}
                    {particles && particles.map((particle, index) => {
                      const particleRotation = particle.rotation.interpolate({
                        inputRange: [0, 2],
                        outputRange: ['0deg', '360deg'],
                      });
                      
                      return (
                        <Animated.View
                          key={index}
                          style={[
                            styles.heartParticle,
                            {
                              transform: [
                                { translateX: particle.translateX },
                                { translateY: particle.translateY },
                                { scale: particle.scale },
                                { rotate: particleRotation },
                              ],
                              opacity: particle.opacity,
                            },
                          ]}
                          pointerEvents="none"
                        >
                          <Ionicons 
                            name="heart" 
                            size={24} 
                            color={index % 2 === 0 ? "#ef4444" : "#ff6b9d"} 
                          />
                        </Animated.View>
                      );
                    })}
                  </>
                );
              })()}
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="image-outline" size={48} color="#d1d5db" />
              <Text style={styles.placeholderText}>No media</Text>
            </View>
          )}
        </View>

        {/* Content info - moved before actions for better flow */}
        <View style={styles.contentInfo}>
          <View style={styles.talentInfo}>
            <Text style={styles.talentTitle} numberOfLines={2}>
              {talent.title}
            </Text>
            <Text style={styles.talentDescription} numberOfLines={2}>
              {talent.description}
            </Text>
          </View>
          
          <View style={styles.talentMeta}>
            <Badge style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{talent.category}</Text>
            </Badge>
            <Text style={styles.timestamp}>
              {new Date(talent.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Action buttons - simplified and cleaner */}
        <View style={styles.actionBar}>
          <View style={styles.leftActions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
                isLiked && styles.likedButton
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleLikeTalent(talent.id);
              }}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnimations.get(talent.id) || new Animated.Value(1) }] }}>
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isLiked ? "#ef4444" : "#6b7280"} 
                />
              </Animated.View>
              {likedTalents.has(talent.id) && (
                <Text style={styles.actionCount}>1</Text>
              )}
            </Pressable>
            
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleDirectMessage(talent);
              }}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#6b7280" />
            </Pressable>
            
            {/* <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleCollaborate(talent);
              }}
            >
              <Ionicons name="people-outline" size={24} color="#6b7280" />
            </Pressable> */}
            
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleShareTalent(talent);
              }}
            >
              <Ionicons name="paper-plane-outline" size={24} color="#6b7280" />
            </Pressable>
          </View>
          
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
              isSaved && styles.savedButton
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleSaveTalent(talent.id);
            }}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnimations.get(talent.id) || new Animated.Value(1) }] }}>
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={isSaved ? "#8F1A27" : "#6b7280"} 
              />
            </Animated.View>
          </Pressable>
        </View>

        {/* Owner actions */}
        {user?.studentId === talent.studentId && (
          <View style={styles.ownerActions}>
            <Button
              size="sm"
              variant="outline"
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate('EditTalent', { talent });
              }}
              style={styles.editButton}
            >
              <Ionicons name="create" size={16} color="#8F1A27" />
              <Text style={styles.buttonText}>Edit</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={(e) => {
                e.stopPropagation();
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
      </TouchableOpacity>
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
            {/* <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'feed' : 'grid')}
            >
              <Ionicons 
                name={viewMode === 'grid' ? "list" : "grid"} 
                size={22} 
                color="#FFFFFF" 
              />
            </TouchableOpacity> */}
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
      {showStories && (() => {
        // Get unique students from talents (for stories)
        const uniqueStudents = new Map<string, Talent>();
        (talents || []).forEach(talent => {
          if (talent.student && talent.student.id && !uniqueStudents.has(talent.student.id)) {
            uniqueStudents.set(talent.student.id, talent);
          }
        });
        const uniqueTalents = Array.from(uniqueStudents.values()).slice(0, 10);
        
        return (
          <View style={styles.storiesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll}>
              {uniqueTalents.length > 0 ? (
                uniqueTalents.map(renderStoryItem)
              ) : (
                <Text style={styles.noStoriesText}>No talents available</Text>
              )}
            </ScrollView>
          </View>
        );
      })()}

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
                    showToast('Please enter a message.', 'warning');
                    return;
                  }
                  
                  if (!user?.id) {
                    showToast('You must be logged in to send messages.', 'error');
                    return;
                  }
                  
                  // Check if we have the necessary data
                  if (!currentTalent?.student) {
                    showToast('Unable to find student information for this talent.', 'error');
                    return;
                  }
                  
                  // Get the recipient's user ID - try different paths
                  const recipientUserId = currentTalent.student?.user?.id || 
                                         currentTalent.student?.userId;
                  
                  if (!recipientUserId) {
                    console.error('Talent data:', currentTalent);
                    showToast('Unable to find recipient user information. Please try again later.', 'error');
                    return;
                  }
                  
                  // Prevent sending messages to yourself
                  if (user.id === recipientUserId) {
                    showToast('You cannot send messages to yourself.', 'warning');
                    return;
                  }
                  
                  try {
                    setShowMessageModal(false);
                    
                    // Verify authentication token exists
                    const token = await AsyncStorage.getItem('authToken');
                    if (!token) {
                      throw new Error('You are not authenticated. Please log in again.');
                    }
                    
                    // Validate user IDs before proceeding
                    if (!user.id || user.id === 'undefined' || !user.id.trim()) {
                      throw new Error('Invalid sender ID. Please log out and log back in.');
                    }
                    
                    if (!recipientUserId || recipientUserId === 'undefined' || !recipientUserId.trim()) {
                      throw new Error('Invalid recipient ID. Please try again.');
                    }
                    
                    console.log('Sending direct message with data:', {
                      senderId: user.id,
                      recipientId: recipientUserId,
                      message: messageText.trim(),
                      talentId: currentTalent.id
                    });
                    
                    setIsSendingMessage(true);
                    
                    // Create conversation (backend will handle duplicates if needed)
                    let conversation;
                    try {
                      const conversationResult = await dispatch(createConversation([
                        user.id.trim(),
                        recipientUserId.trim()
                      ])).unwrap();
                      
                      conversation = conversationResult;
                      
                      // Debug: log the full conversation object
                      console.log('Full conversation object:', JSON.stringify(conversation, null, 2));
                      console.log('Conversation ID check:', {
                        hasConversation: !!conversation,
                        conversationId: conversation?.id,
                        conversationKeys: conversation ? Object.keys(conversation) : 'null'
                      });
                      
                      if (!conversation) {
                        console.error('Conversation is null or undefined');
                        throw new Error('Failed to create conversation - no conversation returned');
                      }
                      
                      if (!conversation.id) {
                        console.error('Conversation created but ID is missing:', conversation);
                        console.error('Available keys:', Object.keys(conversation));
                        throw new Error('Failed to create conversation - no ID returned. Please try again.');
                      }
                      
                      console.log('Conversation created successfully with ID:', conversation.id);
                    } catch (convError: any) {
                      console.error('Error creating conversation:', convError);
                      // Check if error is because conversation already exists
                      if (convError?.response?.status === 409 || convError?.message?.includes('already exists')) {
                        // Try to fetch existing conversations and find the one with this participant
                        // For now, just show a helpful error
                        throw new Error('A conversation already exists. Please check your Messages tab.');
                      }
                      throw new Error(convError?.message || 'Failed to create conversation. Please try again.');
                    }
                    
                    // Send the message
                    const messageContent = `[About talent: ${currentTalent.title}]\n\n${messageText.trim()}`;
                    await dispatch(sendMessage({
                      conversationId: conversation.id,
                      messageData: {
                        content: messageContent
                      }
                    })).unwrap();
                    
                    showToast(
                      'Message sent successfully!',
                      'success',
                        {
                          text: 'Go to Messages',
                          onPress: () => {
                            try {
                              navigation.navigate('Messages');
                            } catch (navError) {
                              console.log('Navigation error:', navError);
                              navigation.navigate('MainTabs', { screen: 'Messages' });
                            }
                          }
                      }
                    );
                    setMessageText('');
                    setShowMessageModal(false);
                  } catch (error: any) {
                    console.error('Failed to send message:', error);
                    let errorMessage = 'Failed to send message.';
                    if (error.message) {
                      errorMessage = error.message;
                    } else if (error.response?.status === 401) {
                      errorMessage = 'You are not authenticated. Please log out and log back in.';
                    } else if (error.response?.status === 403) {
                      errorMessage = 'You are not authorized to send messages.';
                    } else if (error.response?.status === 404) {
                      errorMessage = 'Recipient not found.';
                    } else if (error.response?.status === 400) {
                      errorMessage = 'Invalid request. Please check your message.';
                    }
                    showToast(errorMessage, 'error');
                    setShowMessageModal(true); // Re-open modal on error
                  } finally {
                    setIsSendingMessage(false);
                  }
                }}
                style={[styles.modalButton, styles.sendButton]}
                disabled={isSendingMessage}
              >
                {isSendingMessage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                <Text style={styles.sendButtonText}>Send Message</Text>
                )}
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
                    showToast('Please enter a message for your collaboration request.', 'warning');
                    return;
                  }
                  
                  try {
                    setShowCollaborationModal(false);
                    // Show loading toast (optional - can be removed if not needed)
                    // showToast('Sending collaboration request...', 'info');
                    
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
                    
                    showToast('Collaboration request sent successfully! The student will be notified.', 'success');
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
                    showToast(errorMessage, 'error');
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

      {/* Instagram Reel-style Media Viewer */}
      <Modal
        visible={reelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReelModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.reelContainer}>
          <StatusBar hidden={true} />
          
          {/* Close Button */}
          <TouchableOpacity
            style={styles.reelCloseButton}
            onPress={() => setReelModalVisible(false)}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          {/* Reel FlatList */}
          {selectedReelTalent && selectedReelTalent.files && selectedReelTalent.files.length > 0 && (
            <FlatList
              ref={flatListRef}
              data={selectedReelTalent.files}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              keyExtractor={(item, index) => `reel-${index}`}
              initialScrollIndex={selectedReelIndex}
              getItemLayout={(_, index) => ({
                length: height,
                offset: height * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.y / height);
                setSelectedReelIndex(index);
              }}
              renderItem={({ item, index }) => {
                const isVideo = isVideoFile(item);
                const studentName = selectedReelTalent.student 
                  ? `${selectedReelTalent.student.firstName} ${selectedReelTalent.student.lastName}` 
                  : 'Unknown Student';
                const isLiked = likedTalents.has(selectedReelTalent.id);
                const isSaved = savedTalents.has(selectedReelTalent.id);
                
                return (
                  <View style={styles.reelItem}>
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => {
                        const now = Date.now();
                        const DOUBLE_TAP_DELAY = 300;
                        
                        if (reelLastTap && now - reelLastTap.timestamp < DOUBLE_TAP_DELAY) {
                          // Double tap detected - like the post
                          if (!likedTalents.has(selectedReelTalent.id)) {
                            handleLikeTalent(selectedReelTalent.id);
                          }
                          setReelLastTap(null);
                        } else {
                          setReelLastTap({ timestamp: now });
                        }
                      }}
                      style={styles.reelMediaTouchable}
                    >
                      {isVideo ? (
                        <Video
                          source={{ uri: getFileUrl(item) }}
                          style={styles.reelMedia}
                          useNativeControls={false}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={true}
                          isMuted={false}
                          isLooping={true}
                        />
                      ) : (
                        <Image
                          source={{ uri: getFileUrl(item) }}
                          style={styles.reelMedia}
                          resizeMode="contain"
                        />
                      )}
                    </TouchableOpacity>
                    
                    {/* Heart burst animation overlay */}
                    {(() => {
                      const burstAnim = heartBurstAnimations.get(selectedReelTalent.id);
                      const particles = heartParticles.get(selectedReelTalent.id);
                      
                      if (!burstAnim) return null;
                      
                      const rotation = burstAnim.rotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '20deg'],
                      });
                      
                      return (
                        <>
                          {/* Main heart burst */}
                          <Animated.View
                            style={[
                              styles.reelHeartBurst,
                              {
                                transform: [
                                  { scale: burstAnim.scale },
                                  { rotate: rotation },
                                ],
                                opacity: burstAnim.opacity,
                              },
                            ]}
                            pointerEvents="none"
                          >
                            <Ionicons name="heart" size={120} color="#ef4444" />
                          </Animated.View>
                          
                          {/* Particle hearts */}
                          {particles && particles.map((particle, particleIndex) => {
                            const particleRotation = particle.rotation.interpolate({
                              inputRange: [0, 2],
                              outputRange: ['0deg', '360deg'],
                            });
                            
                            return (
                              <Animated.View
                                key={particleIndex}
                                style={[
                                  styles.reelHeartParticle,
                                  {
                                    transform: [
                                      { translateX: particle.translateX },
                                      { translateY: particle.translateY },
                                      { scale: particle.scale },
                                      { rotate: particleRotation },
                                    ],
                                    opacity: particle.opacity,
                                  },
                                ]}
                                pointerEvents="none"
                              >
                                <Ionicons name="heart" size={24} color="#ef4444" />
                              </Animated.View>
                            );
                          })}
                        </>
                      );
                    })()}
                    
                    {/* Content Overlay */}
                    <View style={styles.reelOverlay}>
                      {/* Top Info */}
                      <View style={styles.reelTopInfo}>
                        <TouchableOpacity
                          style={styles.reelProfileInfo}
                          onPress={() => {
                            setReelModalVisible(false);
                            if (selectedReelTalent.student?.id) {
                              navigation.navigate('StudentProfile', { studentId: selectedReelTalent.student.id });
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={styles.reelProfileImage}>
                            {selectedReelTalent.student?.profileImage ? (
                              <Image
                                source={{ uri: getFileUrl(selectedReelTalent.student.profileImage) }}
                                style={styles.reelProfileImg}
                                resizeMode="cover"
                              />
                            ) : (
                              <Ionicons name="person" size={20} color="white" />
                            )}
                          </View>
                          <Text style={styles.reelProfileName}>
                            {studentName}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Bottom Info */}
                      <View style={styles.reelBottomInfo}>
                        <Text style={styles.reelTitle}>{selectedReelTalent.title}</Text>
                        <Text style={styles.reelDescription} numberOfLines={3}>
                          {selectedReelTalent.description}
                        </Text>
                        {selectedReelTalent.category && (
                          <View style={styles.reelCategoryBadge}>
                            <Text style={styles.reelCategoryText}>{selectedReelTalent.category}</Text>
                          </View>
                        )}
                      </View>

                      {/* Media Indicator */}
                      {selectedReelTalent.files.length > 1 && (
                        <View style={styles.reelIndicator}>
                          {selectedReelTalent.files.map((_, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.reelDot,
                                index === idx && styles.reelDotActive
                              ]}
                            />
                          ))}
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View style={styles.reelActions}>
                        <Pressable 
                          onPress={() => handleLikeTalent(selectedReelTalent.id)} 
                          style={styles.reelActionButton}
                        >
                          <Ionicons 
                            name={isLiked ? "heart" : "heart-outline"} 
                            size={28} 
                            color={isLiked ? "#ff6b9d" : "white"} 
                          />
                        </Pressable>
                        <Pressable 
                          onPress={() => handleSaveTalent(selectedReelTalent.id)} 
                          style={styles.reelActionButton}
                        >
                          <Ionicons 
                            name={isSaved ? "bookmark" : "bookmark-outline"} 
                            size={28} 
                            color={isSaved ? "#FEBF17" : "white"} 
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setReelModalVisible(false);
                            if (selectedReelTalent.student?.id) {
                              navigation.navigate('StudentProfile', { studentId: selectedReelTalent.student.id });
                            }
                          }}
                          style={styles.reelActionButton}
                        >
                          <Ionicons name="person-circle-outline" size={28} color="white" />
                        </Pressable>
                      </View>
                    </View>
    </View>
  );
              }}
            />
          )}
        </View>
      </Modal>

      {/* Instagram Stories Viewer */}
      <Modal
        visible={storiesModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeStoriesViewer}
        statusBarTranslucent
      >
        <View style={styles.storiesViewerContainer}>
          <StatusBar hidden={true} />
          
          {(() => {
            const userArray = Array.from(storiesByUser.keys());
            if (userArray.length === 0) return null;
            
            return (
              <FlatList
                data={userArray}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                keyExtractor={(userId) => userId}
                initialScrollIndex={currentUserIndex}
                getItemLayout={(_, index) => ({
                  length: height,
                  offset: height * index,
                  index,
                })}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.y / height);
                  if (index !== currentUserIndex && index >= 0 && index < userArray.length) {
                    setCurrentUserIndex(index);
                    setCurrentTalentIndex(0);
                    setCurrentFileIndex(0);
                    setStoryProgress(0);
                    storyProgressRef.current.setValue(0);
                    startStoryTimer();
                  }
                }}
                renderItem={({ item: userId }) => {
                  const userTalents = storiesByUser.get(userId) || [];
                  const isCurrentUser = userArray[currentUserIndex] === userId;
                  
                  if (!isCurrentUser || userTalents.length === 0) {
                    return <View style={styles.storyUserView} />;
                  }
                  
                  const currentTalent = userTalents[currentTalentIndex];
                  if (!currentTalent) return <View style={styles.storyUserView} />;
                  
                  const files = currentTalent.files || [];
                  const currentFile = files.length > 0 && currentFileIndex < files.length
                    ? files[currentFileIndex]
                    : null;
                  const isVideo = currentFile ? isVideoFile(currentFile) : false;
                  const studentName = currentTalent.student 
                    ? `${currentTalent.student.firstName} ${currentTalent.student.lastName}` 
                    : 'Unknown Student';
                  
                  return (
                    <View style={styles.storyUserView}>
                      {/* Progress Bars - Show all files from all talents */}
                      <View style={styles.storiesProgressContainer}>
                        {userTalents.flatMap((talent, talentIdx) => {
                          const talentFiles = talent.files || [];
                          return talentFiles.map((_, fileIdx) => {
                            const globalIndex = userTalents.slice(0, talentIdx).reduce((sum, t) => sum + (t.files?.length || 0), 0) + fileIdx;
                            const isCurrent = talentIdx === currentTalentIndex && fileIdx === currentFileIndex;
                            const isPast = talentIdx < currentTalentIndex || (talentIdx === currentTalentIndex && fileIdx < currentFileIndex);
                            
                            return (
                              <View key={`${talentIdx}-${fileIdx}`} style={styles.storyProgressBarContainer}>
                                <View style={styles.storyProgressBarBackground} />
                                {isCurrent && (
                                  <Animated.View
                                    style={[
                                      styles.storyProgressBarFill,
                                      {
                                        width: storyProgressRef.current.interpolate({
                                          inputRange: [0, 1],
                                          outputRange: ['0%', '100%'],
                                        }),
                                      },
                                    ]}
                                  />
                                )}
                                {isPast && (
                                  <View style={[styles.storyProgressBarFill, { width: '100%' }]} />
                                )}
                              </View>
                            );
                          });
                        })}
                      </View>
                      
                      {/* Close Button */}
                      <TouchableOpacity
                        style={styles.storiesCloseButton}
                        onPress={closeStoriesViewer}
                      >
                        <Ionicons name="close" size={28} color="white" />
                      </TouchableOpacity>
                      
                      {/* Media Content */}
                      <TouchableOpacity
                        activeOpacity={1}
                        style={styles.storiesMediaContainer}
                        onPress={() => {
                          // Tap to advance to next file
                          if (storyTimerRef.current) {
                            clearTimeout(storyTimerRef.current);
                            storyTimerRef.current = null;
                          }
                          nextFile();
                        }}
                      >
                        {currentFile ? (
                          isVideo ? (
                            <Video
                              source={{ uri: getFileUrl(currentFile) }}
                              style={styles.storiesMedia}
                              useNativeControls={false}
                              resizeMode={ResizeMode.COVER}
                              shouldPlay={true}
                              isMuted={false}
                              isLooping={false}
                            />
                          ) : (
                            <Image
                              source={{ uri: getFileUrl(currentFile) }}
                              style={styles.storiesMedia}
                              resizeMode="contain"
                            />
                          )
                        ) : (
                          <View style={[styles.storiesMedia, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="image-outline" size={60} color="white" />
                          </View>
                        )}
                      </TouchableOpacity>
                      
                      {/* User Info at Top */}
                      <View style={styles.storiesUserInfo}>
                        <TouchableOpacity
                          style={styles.storiesUserInfoContent}
                          onPress={() => {
                            closeStoriesViewer();
                            if (currentTalent.student?.id) {
                              navigation.navigate('StudentProfile', { studentId: currentTalent.student.id });
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={styles.storiesUserAvatar}>
                            {currentTalent.student?.profileImage ? (
                              <Image
                                source={{ uri: getFileUrl(currentTalent.student.profileImage) }}
                                style={styles.storiesUserAvatarImg}
                                resizeMode="cover"
                              />
                            ) : (
                              <Ionicons name="person" size={20} color="white" />
                            )}
                          </View>
                          <Text style={styles.storiesUserName}>{studentName}</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {/* Bottom Content - Title, Description, Category, Actions */}
                      <View style={styles.storiesBottomInfo}>
                        <View style={styles.storiesBottomLeft}>
                          <Text style={styles.storiesTitle}>{currentTalent.title}</Text>
                          <Text style={styles.storiesDescription} numberOfLines={2}>
                            {currentTalent.description}
                          </Text>
                          {currentTalent.category && (
                            <View style={styles.storiesCategoryBadge}>
                              <Text style={styles.storiesCategoryText}>{currentTalent.category}</Text>
                            </View>
                          )}
                        </View>
                        
                        {/* Action Buttons */}
                        <View style={styles.storiesBottomActions}>
                          <Pressable 
                            onPress={() => handleLikeTalent(currentTalent.id)} 
                            style={styles.storiesActionButton}
                          >
                            <Ionicons 
                              name={likedTalents.has(currentTalent.id) ? "heart" : "heart-outline"} 
                              size={28} 
                              color={likedTalents.has(currentTalent.id) ? "#ff6b9d" : "white"} 
                            />
                          </Pressable>
                          <Pressable 
                            onPress={() => handleSaveTalent(currentTalent.id)} 
                            style={styles.storiesActionButton}
                          >
                            <Ionicons 
                              name={savedTalents.has(currentTalent.id) ? "bookmark" : "bookmark-outline"} 
                              size={28} 
                              color={savedTalents.has(currentTalent.id) ? "#FEBF17" : "white"} 
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              closeStoriesViewer();
                              if (currentTalent.student?.id) {
                                navigation.navigate('StudentProfile', { studentId: currentTalent.student.id });
                              }
                            }}
                            style={styles.storiesActionButton}
                          >
                            <Ionicons name="person-circle-outline" size={28} color="white" />
                          </Pressable>
                        </View>
                      </View>
                      
                      {/* Navigation Areas - Left/Right for files */}
                      <Pressable
                        style={styles.storiesLeftArea}
                        onPress={previousFile}
                      />
                      <Pressable
                        style={styles.storiesRightArea}
                        onPress={nextFile}
                      />
                    </View>
                  );
                }}
              />
            );
          })()}
        </View>
      </Modal>
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
    padding: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 13,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 44,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 15,
    paddingVertical: 11,
  },
  categoryContainer: {
    marginTop: 12,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    borderRadius: 18,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignSelf: 'flex-start',
    minHeight: 34,
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#8F1A27',
    borderColor: '#8F1A27',
  },
  categoryButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  categoryText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  talentsList: {
    paddingTop: 12,
    flex: 1,
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
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  talentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  talentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    padding: 14,
    paddingBottom: 10,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  followButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8F1A27',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  followingButtonSmall: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#8F1A27',
  },
  followButtonTextSmall: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  followingButtonTextSmall: {
    color: '#8F1A27',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  userHandle: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  moreButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  mediaContainer: {
    height: 280,
    overflow: 'hidden',
    marginBottom: 0,
    position: 'relative',
    backgroundColor: '#f9fafb',
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
  heartBurst: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -60,
    marginLeft: -60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 15,
  },
  heartParticle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#f3f4f6',
  },
  leftActions: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: 36,
    justifyContent: 'center',
  },
  actionButtonPressed: {
    opacity: 0.6,
  },
  actionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 2,
  },
  likedButton: {
    // No background change, just icon color
  },
  savedButton: {
    // No background change, just icon color
  },
  talentInfo: {
    paddingHorizontal: 14,
    paddingTop: 12,
    marginBottom: 10,
  },
  talentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  talentDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    fontWeight: '400',
  },
  talentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    marginTop: 4,
  },
  contentInfo: {
    paddingBottom: 0,
  },
  categoryBadge: {
    backgroundColor: '#FEBF17',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fafafa',
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  storiesScroll: {
    flexGrow: 0,
  },
  noStoriesText: {
    padding: 20,
    color: COLORS.gray,
    fontSize: 14,
    textAlign: 'center',
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
  storyVideoContainer: {
    width: 51,
    height: 51,
    borderRadius: 25.5,
    overflow: 'hidden',
    position: 'relative',
  },
  storyVideoIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
  // Instagram Reel Styles
  reelContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  reelCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelItem: {
    width: width,
    height: height,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelMedia: {
    width: width,
    height: height,
    backgroundColor: '#000',
    maxWidth: width,
    maxHeight: height,
  },
  reelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  reelTopInfo: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 5,
  },
  reelProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reelProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
  },
  reelProfileImg: {
    width: '100%',
    height: '100%',
  },
  reelProfileName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  reelBottomInfo: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 5,
  },
  reelTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  reelDescription: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  reelCategoryBadge: {
    backgroundColor: '#FEBF17',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  reelCategoryText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  reelIndicator: {
    position: 'absolute',
    right: 16,
    top: '50%',
    alignItems: 'center',
    gap: 8,
    zIndex: 5,
    transform: [{ translateY: -50 }],
  },
  reelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  reelDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  reelActions: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    alignItems: 'center',
    gap: 20,
    zIndex: 5,
  },
  reelActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelMediaTouchable: {
    width: '100%',
    height: '100%',
  },
  reelHeartBurst: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -60,
    marginLeft: -60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 15,
  },
  reelHeartParticle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  // Stories Viewer Styles
  storiesViewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyUserView: {
    width: width,
    height: height,
    position: 'relative',
  },
  storiesProgressContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 4,
    zIndex: 10,
  },
  storyProgressBarContainer: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  storyProgressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  storyProgressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 1,
  },
  storiesCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storiesMediaContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  storiesMedia: {
    width: '100%',
    height: '100%',
  },
  storiesUserInfo: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  storiesUserInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storiesUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
  },
  storiesUserAvatarImg: {
    width: '100%',
    height: '100%',
  },
  storiesUserName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  storiesTimeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  storiesLeftArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.3,
    zIndex: 5,
  },
  storiesRightArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.3,
    zIndex: 5,
  },
  storiesBottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  storiesBottomLeft: {
    flex: 1,
    marginRight: 16,
  },
  storiesTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  storiesDescription: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  storiesCategoryBadge: {
    backgroundColor: '#FEBF17',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  storiesCategoryText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  storiesBottomActions: {
    alignItems: 'center',
    gap: 20,
  },
  storiesActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 