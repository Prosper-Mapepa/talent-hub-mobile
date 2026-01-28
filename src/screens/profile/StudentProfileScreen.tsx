import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  Alert,
  StatusBar,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, Audio } from 'expo-av';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAppSelector, useAppDispatch } from '../../store';
import { followUser, unfollowUser, checkFollowStatus, fetchFollowers, fetchFollowing } from '../../store/slices/followsSlice';
import { createConversation, sendMessage } from '../../store/slices/messagesSlice';
import { showToast } from '../../components/ui/toast';
import Constants from 'expo-constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../../services/api';
import { User, Student } from '../../types';
import { ActivityIndicator } from 'react-native';
import ReportBlockModal from '../../components/ReportBlockModal';

const { width, height } = Dimensions.get('window');

type StudentProfileParams = {
  StudentProfile: {
    student?: {
        id: string;
      userId?: string;
        firstName: string;
        lastName: string;
        major?: string;
        graduationYear?: number;
        year?: string;
        gpa?: number;
        availability?: string;
        bio?: string;
        about?: string;
        profileViews?: number;
        resume?: string;
        profileImage?: string;
      user?: {
        id: string;
      };
        achievements?: Array<{
          id: string;
          title: string;
          description: string;
          date: string;
          imageUrl?: string;
          certificateUrl?: string;
        }>;
        projects?: Array<{
          id: string;
          title: string;
          description: string;
          technologies?: string[];
          imageUrl?: string;
          githubUrl?: string;
          liveUrl?: string;
          createdAt: string;
        }>;
        skills?: Array<{
          id: string;
          name: string;
          proficiency: string;
          category: string;
        }>;
        talents?: Array<{
          id: string;
          title: string;
          description: string;
          category: string;
          files?: string[];
        }>;
      };
    studentId?: string;
    };
  };

type StudentProfileRouteProp = RouteProp<StudentProfileParams, 'StudentProfile'>;

export default function StudentProfileScreen() {
  const route = useRoute<StudentProfileRouteProp>();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { student: studentParam, studentId } = route.params || {};
  const { user } = useAppSelector((state) => state.auth);
  
  const [student, setStudent] = useState(studentParam);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(!studentParam && !!studentId);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('about');
  const scrollViewRef = React.useRef<ScrollView>(null);
  const sectionRefs = React.useRef<{ [key: string]: number }>({});
  const videoRefs = React.useRef<Map<string, any>>(new Map());
  const [currentPlayingVideoId, setCurrentPlayingVideoId] = useState<string | null>(null);
  
  // Reel viewer state
  const [reelModalVisible, setReelModalVisible] = useState(false);
  const [selectedReelTalent, setSelectedReelTalent] = useState<any>(null);
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);
  const reelFlatListRef = useRef<FlatList>(null);
  const reelVideoRefs = useRef<Map<number, any>>(new Map());
  
  // Followers/Following/Who Liked state
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showWhoLikedModal, setShowWhoLikedModal] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [whoLiked, setWhoLiked] = useState<Student[]>([]);
  const [showReportBlockModal, setShowReportBlockModal] = useState(false);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);
  const [isLoadingWhoLiked, setIsLoadingWhoLiked] = useState(false);
  
  // Check if file is a video
  const isVideoFile = (filePath: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => filePath.toLowerCase().includes(ext));
  };

  const isImageFile = (filePath: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
    return imageExtensions.some(ext => filePath.toLowerCase().includes(ext));
  };

  // Fetch student data if only studentId is provided
  useEffect(() => {
    const fetchStudent = async () => {
      if (studentParam) {
        setStudent(studentParam);
        // Check if it's own profile - compare user IDs
        const isOwn = user?.id === studentParam.userId || user?.studentId === studentParam.id;
        setIsOwnProfile(isOwn);
        return;
      }

      if (studentId) {
        try {
          setIsLoading(true);
          setError(null);
          // Fetch student by ID using axios directly
          const getApiBaseUrl = () => {
            const envApiUrl = Constants.expoConfig?.extra?.apiBaseUrl;
            // If environment URL is set, use it (prioritizes configured URL)
            if (envApiUrl) {
              return envApiUrl;
            }
            // Check if we're in development mode
            if (__DEV__) {
              const platform = require('react-native').Platform.OS;
              if (platform === 'android') {
                return 'http://10.0.2.2:3001'; // Android emulator
              } else if (platform === 'ios') {
                return 'http://localhost:3001'; // iOS simulator
              }
            }
            // Production fallback
            return 'https://web-production-11221.up.railway.app';
          };
          
          const token = await AsyncStorage.getItem('authToken');
          const baseURL = getApiBaseUrl();
          const response = await axios.get(`${baseURL}/students/${studentId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          const fetchedStudent = response.data.data;
          setStudent(fetchedStudent);
          // Check if it's own profile - compare user IDs
          const isOwn = user?.id === fetchedStudent?.userId || user?.studentId === fetchedStudent?.id;
          setIsOwnProfile(isOwn);
        } catch (err: any) {
          console.error('Error fetching student:', err);
          setError('Failed to load student profile');
          Alert.alert('Error', 'Failed to load student profile. Please try again.');
          navigation.goBack();
        } finally {
          setIsLoading(false);
        }
      } else {
        setError('No student information provided');
      }
    };

        fetchStudent();
      }, [studentId, studentParam, user?.studentId, navigation]);

      // Check follow status when student is loaded
      useEffect(() => {
        if (student && user?.id && !isOwnProfile) {
          const checkStatus = async () => {
            try {
              // Use only the User ID, not the Student ID
              const followingId = student.userId || student.user?.id;
              if (!followingId) {
                setIsFollowing(false);
                return;
              }
              const result = await dispatch(checkFollowStatus({ 
                followerId: user.id, 
                followingId 
              })).unwrap();
              setIsFollowing(result.isFollowing || false);
            } catch (error) {
              console.error('Error checking follow status:', error);
              setIsFollowing(false);
            }
          };
          checkStatus();
        } else {
          setIsFollowing(false);
        }
      }, [student, user?.id, isOwnProfile, dispatch]);

  // Function to refresh follower/following/who liked counts
  const refreshFollowerCounts = React.useCallback(async (userId: string, studentId: string) => {
    try {
      const followersResult = await dispatch(fetchFollowers(userId)).unwrap();
      setFollowers(followersResult.followers || []);
      const followingResult = await dispatch(fetchFollowing(userId)).unwrap();
      setFollowing(followingResult.following || []);
      // Automatically fetch who liked
      const students = await apiService.getWhoLikedTalents(studentId);
      setWhoLiked(students || []);
    } catch (error) {
      console.error('Error refreshing social stats:', error);
    }
  }, [dispatch]);

  // Load follower/following/who liked counts when student is loaded
  useEffect(() => {
    if (student) {
      const userId = student.userId || student.user?.id;
      const studentId = student.id;
      if (userId && studentId) {
        refreshFollowerCounts(userId, studentId);
      }
    }
  }, [student, refreshFollowerCounts]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Add refresh logic here if needed
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleEditProfile = () => {
    if (!student) return;
    navigation.navigate('EditStudentProfile' as never, { student } as never);
  };

  const handleContact = () => {
    if (!student) return;
    
    // Check if user is authenticated
    if (!user?.id) {
      showToast('Please log in to send direct messages.', 'info');
      return;
    }

    // Check if user is trying to message themselves
    if (user?.studentId && user.studentId === student.id) {
      showToast('You cannot send messages to yourself.', 'warning');
      return;
    }

    setMessageText('');
    setShowMessageModal(true);
  };

  const handleFollow = async () => {
    if (!student || !user?.id || isOwnProfile) return;
    
    // Use only the User ID, not the Student ID
    const followingId = student.userId || student.user?.id;
    if (!followingId) {
      showToast('Unable to find user information for this student.', 'error');
      return;
    }
    
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await dispatch(unfollowUser({ 
          followerId: user.id, 
          followingId 
        })).unwrap();
        setIsFollowing(false);
        showToast(`Unfollowed ${student.firstName} ${student.lastName}`, 'info');
        // Refresh follower/following/who liked counts after unfollow
        await refreshFollowerCounts(followingId, student.id);
      } else {
        await dispatch(followUser({ 
          followerId: user.id, 
          followingId 
        })).unwrap();
        setIsFollowing(true);
        showToast(`Following ${student.firstName} ${student.lastName}`, 'success');
        // Refresh follower/following/who liked counts after follow
        await refreshFollowerCounts(followingId, student.id);
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      showToast(error.message || 'Failed to update follow status', 'error');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleResumeView = () => {
    if (!student || !student.resume) return;
      // Navigate to resume viewer or open PDF
      Alert.alert(
        'View Resume',
        'Resume viewing functionality will be implemented here.',
        [
          { text: 'OK', style: 'default' },
        ]
      );
  };

  const handleShowFollowers = async () => {
    if (!student) return;
    const userId = student.userId || student.user?.id;
    if (!userId) {
      showToast('Unable to find user information', 'error');
      return;
    }
    setIsLoadingFollowers(true);
    setShowFollowersModal(true);
    try {
      const result = await dispatch(fetchFollowers(userId)).unwrap();
      setFollowers(result.followers || []);
    } catch (error: any) {
      console.error('Error fetching followers:', error);
      showToast('Failed to load followers', 'error');
      setShowFollowersModal(false);
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const handleShowFollowing = async () => {
    if (!student) return;
    const userId = student.userId || student.user?.id;
    if (!userId) {
      showToast('Unable to find user information', 'error');
      return;
    }
    setIsLoadingFollowing(true);
    setShowFollowingModal(true);
    try {
      const result = await dispatch(fetchFollowing(userId)).unwrap();
      setFollowing(result.following || []);
    } catch (error: any) {
      console.error('Error fetching following:', error);
      showToast('Failed to load following list', 'error');
      setShowFollowingModal(false);
    } finally {
      setIsLoadingFollowing(false);
    }
  };

  const handleShowWhoLiked = async () => {
    if (!student?.id) return;
    setIsLoadingWhoLiked(true);
    setShowWhoLikedModal(true);
    try {
      const students = await apiService.getWhoLikedTalents(student.id);
      setWhoLiked(students || []);
    } catch (error: any) {
      console.error('Error fetching who liked:', error);
      showToast('Failed to load who liked content', 'error');
    } finally {
      setIsLoadingWhoLiked(false);
    }
  };

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    
    const baseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'https://web-production-11221.up.railway.app';
    return `${baseUrl}${filePath}`;
  };

  const openReelViewer = async (talent: any, fileIndex: number = 0) => {
    // Configure audio to play through device speakers
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting audio mode:', error);
    }
    
    // Clear previous video refs
    reelVideoRefs.current.clear();
    
    setSelectedReelTalent(talent);
    setSelectedReelIndex(fileIndex);
    setReelModalVisible(true);
    
    // Auto-play the first video if it's a video file
    setTimeout(async () => {
      if (talent.files && talent.files.length > 0 && isVideoFile(talent.files[fileIndex])) {
        const videoRef = reelVideoRefs.current.get(fileIndex);
        if (videoRef) {
          try {
            await videoRef.playAsync();
          } catch (error) {
            console.error('Error auto-playing video:', error);
          }
        }
      }
    }, 300);
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'EXPERT': return '#10b981';
      case 'ADVANCED': return '#3b82f6';
      case 'INTERMEDIATE': return '#f59e0b';
      case 'BEGINNER': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderAchievement = (achievement: any) => (
    <Card key={achievement.id} style={styles.achievementCard}>
      <CardContent style={styles.achievementContent}>
        {achievement.imageUrl && (
          <Image
            source={{ uri: getFileUrl(achievement.imageUrl) }}
            style={styles.achievementImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.achievementText}>
          <Text style={styles.achievementTitle}>{achievement.title}</Text>
          <Text style={styles.achievementDescription}>{achievement.description}</Text>
          <Text style={styles.achievementDate}>{achievement.date}</Text>
        </View>
      </CardContent>
    </Card>
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return '';
    }
  };

  const renderProject = (project: any) => (
    <Card key={project.id} style={styles.projectCard}>
      <CardContent style={styles.projectContent}>
        {project.imageUrl && (
          <Image
            source={{ uri: getFileUrl(project.imageUrl) }}
            style={styles.projectImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.projectText}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <Text style={styles.projectDescription}>{project.description}</Text>
          
          {project.technologies && project.technologies.length > 0 && (
            <View style={styles.technologiesContainer}>
              <View style={styles.technologiesList}>
                {project.technologies.map((tech: string, index: number) => (
                  <Badge key={index} style={styles.technologyBadge}>
                    <Text style={styles.technologyText}>{tech}</Text>
                  </Badge>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.projectFooter}>
            {project.createdAt && formatDate(project.createdAt) && (
              <View style={styles.projectDateContainer}>
                <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text style={styles.projectDate}>
                  {formatDate(project.createdAt)}
            </Text>
              </View>
            )}
            <View style={styles.projectLinks}>
              {project.githubUrl && (
                <TouchableOpacity style={styles.projectLink}>
                  <Ionicons name="logo-github" size={18} color="#8F1A27" />
                  <Text style={styles.projectLinkText}>GitHub</Text>
                </TouchableOpacity>
              )}
              {project.liveUrl && (
                <TouchableOpacity style={styles.projectLink}>
                  <Ionicons name="link" size={18} color="#8F1A27" />
                  <Text style={styles.projectLinkText}>Live</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  );

  const renderSkill = (skill: any) => (
    <Card key={skill.id} style={styles.skillCard}>
      <CardContent style={styles.skillContent}>
        <View style={styles.skillInfo}>
          <Text style={styles.skillName} numberOfLines={2} ellipsizeMode="tail">
            {skill.name}
          </Text>
          <View style={styles.skillMetaRow}>
            <Text style={styles.skillCategory} numberOfLines={1} ellipsizeMode="tail">
              {skill.category}
            </Text>
            <View style={[styles.skillProficiencyBadge, { backgroundColor: getProficiencyColor(skill.proficiency) }]}>
              <Text style={styles.skillProficiencyText}>{skill.proficiency}</Text>
        </View>
          </View>
        </View>
      </CardContent>
    </Card>
  );

  // Get files in reverse order (newest first) - when talent is updated, new files are appended
  // So reversing gives us newest files first, followed by older files
  const getFilesNewestFirst = (files: string[] | undefined | null): string[] => {
    if (!files || !Array.isArray(files) || files.length === 0) {
      return [];
    }
    // Reverse to show newest files first (new files are appended to the end)
    return [...files].reverse();
  };

  const renderTalent = (talent: any) => {
    const talentFiles = getFilesNewestFirst(talent.files);
    return (
    <Card key={talent.id} style={styles.talentCard}>
      <CardContent style={styles.talentContent}>
          {talentFiles.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.talentFilesContainer}
              contentContainerStyle={styles.talentFilesContent}
            >
              {talentFiles.map((file: string, index: number) => {
                const isVideo = isVideoFile(file);
                const isImage = isImageFile(file);
                const fileKey = `${talent.id}-${index}`;
                const isCurrentlyPlaying = currentPlayingVideoId === fileKey;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.talentFileItem}
                    activeOpacity={0.95}
                    onPress={() => {
                      openReelViewer(talent, index);
                    }}
                  >
                    {isVideo ? (
                      <View style={styles.videoContainer}>
                        <Video
                          ref={(ref) => {
                            if (ref) {
                              videoRefs.current.set(fileKey, ref);
                            } else {
                              videoRefs.current.delete(fileKey);
                            }
                          }}
                          source={{ uri: getFileUrl(file) }}
                          style={styles.talentFileImage}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={isCurrentlyPlaying}
                          isMuted={!isCurrentlyPlaying}
                          useNativeControls={false}
                          isLooping={true}
                        />
                        {!isCurrentlyPlaying && (
                          <View style={styles.videoOverlay}>
                            <Ionicons name="play-circle" size={40} color="white" />
                          </View>
                        )}
                      </View>
                    ) : isImage ? (
                      <Image
                        source={{ uri: getFileUrl(file) }}
                        style={styles.talentFileImage}
                        resizeMode="cover"
                        onError={(error) => {
                          console.error('Image loading error:', error);
                          console.error('File path:', file);
                          console.error('Image URL:', getFileUrl(file));
                        }}
                      />
                    ) : (
                      <View style={styles.talentFilePlaceholder}>
                        <Ionicons name="document" size={24} color="#9ca3af" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        <View style={styles.talentText}>
          <View style={styles.talentHeader}>
            <Text style={styles.talentTitle}>{talent.title}</Text>
              <View style={styles.talentCategory}>
                <Text style={styles.talentCategoryText}>{talent.category}</Text>
              </View>
          </View>
          <Text style={styles.talentDescription}>{talent.description}</Text>
        </View>
      </CardContent>
    </Card>
  );
  };

  // Show loading or error state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#8F1A27" translucent />
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={32} color="#8F1A27" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (error || !student) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#8F1A27" translucent />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#dc2626" />
          <Text style={styles.errorText}>{error || 'Student not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8F1A27" translucent />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#8F1A27', '#6A0032']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerSubtitle}>
              {/* {student?.firstName || ''} {student?.lastName || ''} */}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {isOwnProfile ? (
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Ionicons name="create" size={20} color="#8F1A27" />
              </TouchableOpacity>
            ) : (
                  <View style={styles.headerActionButtons}>
                    <TouchableOpacity 
                      style={[styles.followButton, isFollowing && styles.followingButton]} 
                      onPress={handleFollow}
                      disabled={isFollowLoading}
                    >
                      <Ionicons 
                        name={isFollowing ? "checkmark" : "add"} 
                        size={18} 
                        color={isFollowing ? "#8F1A27" : "white"} 
                      />
                      <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
                <Ionicons name="mail" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.moreButton} 
                onPress={() => setShowReportBlockModal(true)}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="white" />
              </TouchableOpacity>
                  </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Tabs Navigation */}
      <View style={styles.tabsContainer}>
      <ScrollView
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.activeTab]}
            onPress={() => {
              setActiveTab('about');
              scrollViewRef.current?.scrollTo({ y: sectionRefs.current.about || 0, animated: true });
            }}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>About</Text>
          </TouchableOpacity>
          
          {student.talents && student.talents.length > 0 && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'talents' && styles.activeTab]}
              onPress={() => {
                setActiveTab('talents');
                scrollViewRef.current?.scrollTo({ y: sectionRefs.current.talents || 0, animated: true });
              }}
            >
              <Text style={[styles.tabText, activeTab === 'talents' && styles.activeTabText]}>Talents</Text>
            </TouchableOpacity>
          )}
          
          {student.projects && student.projects.length > 0 && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'projects' && styles.activeTab]}
              onPress={() => {
                setActiveTab('projects');
                scrollViewRef.current?.scrollTo({ y: sectionRefs.current.projects || 0, animated: true });
              }}
            >
              <Text style={[styles.tabText, activeTab === 'projects' && styles.activeTabText]}>Projects</Text>
            </TouchableOpacity>
          )}
          
          {student.skills && student.skills.length > 0 && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'skills' && styles.activeTab]}
              onPress={() => {
                setActiveTab('skills');
                scrollViewRef.current?.scrollTo({ y: sectionRefs.current.skills || 0, animated: true });
              }}
            >
              <Text style={[styles.tabText, activeTab === 'skills' && styles.activeTabText]}>Skills</Text>
            </TouchableOpacity>
          )}
          
          {student.achievements && student.achievements.length > 0 && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
              onPress={() => {
                setActiveTab('achievements');
                scrollViewRef.current?.scrollTo({ y: sectionRefs.current.achievements || 0, animated: true });
              }}
            >
              <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>Achievements</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={(event) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          // Update active tab based on scroll position
          const sections = ['about', 'talents', 'projects', 'skills', 'achievements'];
          for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            if (sectionRefs.current[section] && scrollY >= sectionRefs.current[section] - 100) {
              setActiveTab(section);
              break;
            }
          }
        }}
        scrollEventThrottle={16}
      >
        {/* Profile Section */}
        <View 
          style={styles.profileSection}
          onLayout={(event) => {
            sectionRefs.current.about = event.nativeEvent.layout.y;
          }}
        >
          <Card style={styles.profileCard}>
            <CardContent style={styles.profileContent}>
              {/* <View style={styles.profileImageContainer}>
                {student.profileImage ? (
                  <Image
                    source={{ uri: getFileUrl(student.profileImage) }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="person" size={48} color="#8F1A27" />
                  </View>
                )}
              </View> */}
              
                             <View style={styles.profileInfo}>
                 <Text style={styles.studentName}>
                   {student.firstName} {student.lastName}
                 </Text>
                 
                <View style={styles.infoChips}>
                 {student.major && (
                    <View style={styles.infoChip}>
                      <Ionicons name="school" size={14} color="#8F1A27" />
                      <Text style={styles.infoChipText} numberOfLines={1}>{student.major}</Text>
                   </View>
                 )}
                 
                 {student.year && (
                    <View style={styles.infoChip}>
                      <Ionicons name="time" size={16} color="#8F1A27" />
                      <Text style={styles.infoChipText}>{student.year}</Text>
                   </View>
                 )}
                 
                  {/* {student.graduationYear && (
                    <View style={styles.infoChip}>
                      <Text style={styles.infoChipText}>Class of {student.graduationYear}</Text>
                   </View>
                  )} */}
                 
                 {student.gpa && (
                    <View style={[styles.infoChip, styles.gpaChip]}>
                      <Ionicons name="trophy" size={14} color="#FEBF17" />
                      <Text style={[styles.infoChipText, styles.gpaText]}>GPA: {student.gpa.toFixed(2)}</Text>
                   </View>
                 )}
                </View>
                 
                <View style={styles.profileMetaRow}>
                 {student.availability ? (
                    <View style={styles.availabilityRow}>
                      <Ionicons name="time" size={16} color="#6b7280" />
                      <Text style={styles.availabilityText}>
                        {student.availability.replace(/_/g, ' ')}
                      </Text>
                    </View>
                 ) : null}
                 
                 {student.profileViews ? (
                    <View style={styles.viewsRow}>
                      <Ionicons name="eye" size={16} color="#8F1A27" />
                      <Text style={styles.viewsText}>
                        {student.profileViews} {student.profileViews === 1 ? 'view' : 'views'}
                      </Text>
                    </View>
                 ) : null}
                 
                 {/* Followers/Following/Who Liked */}
                 <View style={styles.socialStatsRow}>
                   <TouchableOpacity style={styles.socialStatButton} onPress={handleShowFollowers}>
                     <Text style={styles.socialStatNumber}>{followers.length}</Text>
                     <Text style={styles.socialStatLabel}>Followers</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={styles.socialStatButton} onPress={handleShowFollowing}>
                     <Text style={styles.socialStatNumber}>{following.length}</Text>
                     <Text style={styles.socialStatLabel}>Following</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={styles.socialStatButton} onPress={handleShowWhoLiked}>
                     <Text style={styles.socialStatNumber}>{whoLiked.length}</Text>
                     <Text style={styles.socialStatLabel}>Liked</Text>
                   </TouchableOpacity>
                 </View>
                </View>
               </View>
            </CardContent>
          </Card>

          {(student.bio || student.about) && (
            <Card style={styles.bioCard}>
              <CardContent style={styles.bioContent}>
                <Text style={styles.bioText}>{student.bio || student.about}</Text>
              </CardContent>
            </Card>
          )}

          {/* Resume Section */}
          {student.resume && (
            <Card style={styles.resumeCard}>
              <CardContent style={styles.resumeContent}>
                <TouchableOpacity style={styles.resumeButton} onPress={handleResumeView}>
                  <Ionicons name="document-text" size={20} color="#8F1A27" />
                  <Text style={styles.resumeButtonText}>View Resume</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </CardContent>
            </Card>
          )}
        </View>

        {/* Talents Section */}
        {student.talents && student.talents.length > 0 && (
          <View 
            style={styles.section}
            onLayout={(event) => {
              sectionRefs.current.talents = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={22} color="#8F1A27" />
              <Text style={styles.sectionTitle}>Talents</Text>
            </View>
            {student.talents.map(renderTalent)}
          </View>
        )}

        {/* Projects Section */}
        {student.projects && student.projects.length > 0 && (
          <View 
            style={styles.section}
            onLayout={(event) => {
              sectionRefs.current.projects = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="folder" size={22} color="#8F1A27" />
            <Text style={styles.sectionTitle}>Projects</Text>
            </View>
            {student.projects.map(renderProject)}
          </View>
        )}

        {/* Skills Section */}
        {student.skills && student.skills.length > 0 && (
                                  <View 
            style={styles.section}
            onLayout={(event) => {
              sectionRefs.current.skills = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="code-slash" size={22} color="#8F1A27" />
              <Text style={styles.sectionTitle}>Skills</Text>
            </View>
            
            <View style={styles.skillsGrid}>
              {student.skills.map(renderSkill)}
            </View>
          </View>
        )}

        {/* Achievements Section */}
        {student.achievements && student.achievements.length > 0 && (
          <View 
            style={styles.section}
            onLayout={(event) => {
              sectionRefs.current.achievements = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={22} color="#8F1A27" />
              <Text style={styles.sectionTitle}>Achievements</Text>
            </View>
            {student.achievements.map(renderAchievement)}
          </View>
        )}

        {/* Contact Section */}
            {!isOwnProfile && user?.id && (
          <View style={styles.contactSection}>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.followButtonLarge, isFollowing && styles.followingButtonLarge]}
                    onPress={handleFollow}
                    disabled={isFollowLoading}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={isFollowing ? "checkmark-circle" : "add-circle"} 
                      size={20} 
                      color={isFollowing ? "#8F1A27" : "white"} 
                    />
                    <Text style={[styles.followButtonTextLarge, isFollowing && styles.followingButtonTextLarge]}>
                      {isFollowLoading ? 'Loading...' : (isFollowing ? 'Following' : 'Follow')}
                    </Text>
                  </TouchableOpacity>
            <Button
              style={styles.contactButtonLarge}
              onPress={handleContact}
            >
              <Ionicons name="mail" size={20} color="white" />
                    <Text style={styles.contactButtonText}>Message</Text>
            </Button>
                </View>
          </View>
        )}
      </ScrollView>

      {/* Message Modal */}
      {showMessageModal && student && (
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
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
              Send a direct message to {student.firstName || ''} {student.lastName || ''}
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
                  
                  // Get the recipient's user ID
                  const recipientUserId = student.userId || student.user?.id;
                  
                  if (!recipientUserId) {
                    showToast('Unable to find recipient user information. Please try again later.', 'error');
                    return;
                  }
                  
                  // Prevent sending messages to yourself
                  if (user.id === recipientUserId) {
                    showToast('You cannot send messages to yourself.', 'warning');
                    return;
                  }
                  
                  try {
                    setIsSendingMessage(true);
                    
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
                    
                    // Create conversation
                    let conversation;
                    try {
                      const conversationResult = await dispatch(createConversation([
                        user.id.trim(),
                        recipientUserId.trim()
                      ])).unwrap();
                      
                      conversation = conversationResult;
                      
                      if (!conversation) {
                        throw new Error('Failed to create conversation - no conversation returned');
                      }
                      
                      if (!conversation.id) {
                        throw new Error('Failed to create conversation - no ID returned. Please try again.');
                      }
                    } catch (convError: any) {
                      console.error('Error creating conversation:', convError);
                      if (convError?.response?.status === 409 || convError?.message?.includes('already exists')) {
                        throw new Error('A conversation already exists. Please check your Messages tab.');
                      }
                      throw new Error(convError?.message || 'Failed to create conversation. Please try again.');
                    }
                    
                    // Send the message
                    await dispatch(sendMessage({
                      conversationId: conversation.id,
                      messageData: {
                        content: messageText.trim()
                      }
                    })).unwrap();
                    
                    showToast(
                      'Message sent successfully!',
                      'success',
                      {
                        text: 'Go to Messages',
                        onPress: () => {
                          try {
                            navigation.navigate('MainTabs', { screen: 'Messages' });
                          } catch (navError) {
                            console.log('Navigation error:', navError);
                          }
                        }
                      }
                    );
                    setMessageText('');
                    setShowMessageModal(false);
                  } catch (error: any) {
                    console.error('Failed to send message:', error);
                    console.error('Error type:', typeof error);
                    console.error('Error structure:', JSON.stringify(error, null, 2));
                    
                    // Extract error message with priority: string from rejectWithValue > API response message > error.message > status-based fallback
                    let errorMessage = 'Failed to send message.';
                    
                    // When .unwrap() throws from a rejected thunk, it throws the value from rejectWithValue (which is a string)
                    if (typeof error === 'string') {
                      errorMessage = error;
                    }
                    // Handle Axios error objects (from direct API calls, not thunks)
                    else if (error.response?.data?.message) {
                      errorMessage = error.response.data.message;
                    } else if (error.message && !error.message.includes('Request failed with status code')) {
                      // Use error.message only if it's not a generic Axios error message
                      errorMessage = error.message;
                    } else if (error.response?.status === 401) {
                      errorMessage = 'You are not authenticated. Please log out and log back in.';
                    } else if (error.response?.status === 403) {
                      // For 403, check if there's a more specific message in the response
                      errorMessage = error.response?.data?.message || 'You are not authorized to send messages.';
                    } else if (error.response?.status === 404) {
                      errorMessage = 'Recipient not found.';
                    } else if (error.response?.status === 400) {
                      errorMessage = error.response?.data?.message || 'Invalid request. Please check your message.';
                    }
                    
                    console.log('Final error message to display:', errorMessage);
                    
                    // Show error toast and keep modal closed to avoid overlapping modals
                    showToast(errorMessage, 'error');
                    // Don't re-open modal immediately - let user see the error first
                    // User can manually open the modal again if they want to retry
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
        </KeyboardAvoidingView>
      )}

      {/* Followers Modal */}
      {showFollowersModal && (
        <Modal
          visible={showFollowersModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFollowersModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Followers</Text>
                <TouchableOpacity
                  onPress={() => setShowFollowersModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {isLoadingFollowers ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#8F1A27" />
                </View>
              ) : followers.length === 0 ? (
                <View style={styles.modalEmptyContainer}>
                  <Ionicons name="people-outline" size={48} color="#d1d5db" />
                  <Text style={styles.modalEmptyText}>No followers yet</Text>
                </View>
              ) : (
                <FlatList
                  data={followers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalListItem}
                      onPress={() => {
                        setShowFollowersModal(false);
                        if (item.studentId) {
                          navigation.navigate('StudentProfile', { studentId: item.studentId });
                        }
                      }}
                    >
                      <View style={styles.modalListAvatar}>
                        <Text style={styles.modalListAvatarText}>
                          {item.firstName?.[0]?.toUpperCase() || item.email?.[0]?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View style={styles.modalListInfo}>
                        <Text style={styles.modalListName}>
                          {item.firstName && item.lastName
                            ? `${item.firstName} ${item.lastName}`
                            : item.email || 'Unknown User'}
                        </Text>
                        <Text style={styles.modalListEmail}>{item.email}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <Modal
          visible={showFollowingModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFollowingModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Following</Text>
                <TouchableOpacity
                  onPress={() => setShowFollowingModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {isLoadingFollowing ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#8F1A27" />
                </View>
              ) : following.length === 0 ? (
                <View style={styles.modalEmptyContainer}>
                  <Ionicons name="people-outline" size={48} color="#d1d5db" />
                  <Text style={styles.modalEmptyText}>Not following anyone yet</Text>
                </View>
              ) : (
                <FlatList
                  data={following}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalListItem}
                      onPress={() => {
                        setShowFollowingModal(false);
                        if (item.studentId) {
                          navigation.navigate('StudentProfile', { studentId: item.studentId });
                        }
                      }}
                    >
                      <View style={styles.modalListAvatar}>
                        <Text style={styles.modalListAvatarText}>
                          {item.firstName?.[0]?.toUpperCase() || item.email?.[0]?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View style={styles.modalListInfo}>
                        <Text style={styles.modalListName}>
                          {item.firstName && item.lastName
                            ? `${item.firstName} ${item.lastName}`
                            : item.email || 'Unknown User'}
                        </Text>
                        <Text style={styles.modalListEmail}>{item.email}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Reel Viewer Modal */}
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
              ref={reelFlatListRef}
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
              onMomentumScrollEnd={async (event) => {
                const index = Math.round(event.nativeEvent.contentOffset.y / height);
                
                // Pause previous video
                if (selectedReelIndex !== index) {
                  const prevVideoRef = reelVideoRefs.current.get(selectedReelIndex);
                  if (prevVideoRef) {
                    try {
                      await prevVideoRef.pauseAsync();
                    } catch (error) {
                      console.error('Error pausing previous video:', error);
                    }
                  }
                }
                
                // Play new video
                const newVideoRef = reelVideoRefs.current.get(index);
                if (newVideoRef && selectedReelTalent?.files && isVideoFile(selectedReelTalent.files[index])) {
                  try {
                    await newVideoRef.playAsync();
                  } catch (error) {
                    console.error('Error playing new video:', error);
                  }
                }
                
                setSelectedReelIndex(index);
              }}
              renderItem={({ item, index }) => {
                const isVideo = isVideoFile(item);
                const isImage = isImageFile(item);
                const studentName = student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
                const isCurrentlyPlaying = selectedReelIndex === index;
                
                return (
                  <View style={styles.reelItem}>
                    {isVideo ? (
                      <Video
                        ref={(ref) => {
                          if (ref) {
                            reelVideoRefs.current.set(index, ref);
                          } else {
                            reelVideoRefs.current.delete(index);
                          }
                        }}
                        source={{ uri: getFileUrl(item) }}
                        style={styles.reelMedia}
                        useNativeControls={false}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={isCurrentlyPlaying}
                        isMuted={!isCurrentlyPlaying}
                        isLooping={true}
                      />
                    ) : isImage ? (
                      <Image
                        source={{ uri: getFileUrl(item) }}
                        style={styles.reelMedia}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.reelMedia}>
                        <Ionicons name="document" size={48} color="white" />
                      </View>
                    )}
                    
                    {/* Content Overlay */}
                    <View style={styles.reelOverlay}>
                      {/* Top Info */}
                      <View style={styles.reelTopInfo}>
                        <TouchableOpacity
                          style={styles.reelProfileInfo}
                          onPress={() => setReelModalVisible(false)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.reelProfileImage}>
                            {student?.profileImage ? (
                              <Image
                                source={{ uri: getFileUrl(student.profileImage) }}
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
                          {selectedReelTalent.files.map((_: unknown, idx: number) => (
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
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </Modal>

      {/* Who Liked Modal */}
      {showWhoLikedModal && (
        <Modal
          visible={showWhoLikedModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowWhoLikedModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Who Liked Content</Text>
                <TouchableOpacity
                  onPress={() => setShowWhoLikedModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {isLoadingWhoLiked ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#8F1A27" />
                </View>
              ) : whoLiked.length === 0 ? (
                <View style={styles.modalEmptyContainer}>
                  <Ionicons name="heart-outline" size={48} color="#d1d5db" />
                  <Text style={styles.modalEmptyText}>No one has liked content yet</Text>
                </View>
              ) : (
                <FlatList
                  data={whoLiked}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalListItem}
                      onPress={() => {
                        setShowWhoLikedModal(false);
                        navigation.navigate('StudentProfile', { studentId: item.id });
                      }}
                    >
                      <View style={styles.modalListAvatar}>
                        <Text style={styles.modalListAvatarText}>
                          {item.firstName?.[0]?.toUpperCase() || item.user?.firstName?.[0]?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View style={styles.modalListInfo}>
                        <Text style={styles.modalListName}>
                          {item.firstName && item.lastName
                            ? `${item.firstName} ${item.lastName}`
                            : item.user?.email || 'Unknown User'}
                        </Text>
                        {item.user?.email && (
                          <Text style={styles.modalListEmail}>{item.user.email}</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
      <ReportBlockModal
        visible={showReportBlockModal}
        onClose={() => setShowReportBlockModal(false)}
        userId={student?.user?.id}
        userName={student ? `${student.firstName} ${student.lastName}` : undefined}
        contentType="PROFILE"
        onBlockSuccess={() => {
          // Refresh the profile or navigate back
          navigation.goBack();
        }}
        onReportSuccess={() => {
          setShowReportBlockModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  headerGradient: {
    paddingTop: 35,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8F1A27',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  followingButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#8F1A27',
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#8F1A27',
  },
  editButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
  },
  contactButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 8,
  },
  moreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 8,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#8F1A27',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 12,
    paddingBottom: 8,
  },
  profileCard: {
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // padding: 4,
  },
  profileImageContainer: {
    marginRight: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  profileInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  infoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoChipText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  gpaChip: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  gpaText: {
    color: '#92400E',
  },
  profileMetaRow: {
    marginTop: 2,
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availabilityText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewsText: {
    fontSize: 12,
    color: '#8F1A27',
    fontWeight: '500',
  },
  bioCard: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  bioContent: {
    padding: 16,
  },
  bioText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  section: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  achievementCard: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  achievementContent: {
    padding: 0,
  },
  achievementImage: {
    width: '100%',
    height: 160,
  },
  achievementText: {
    padding: 14,
  },
  achievementTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  achievementDescription: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 8,
  },
  achievementDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  projectCard: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  projectContent: {
    padding: 0,
  },
  projectImage: {
    width: '100%',
    height: 160,
  },
  projectText: {
    padding: 14,
  },
  projectTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  projectDescription: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  projectLinks: {
    flexDirection: 'row',
    gap: 16,
  },
  projectLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  projectLinkText: {
    fontSize: 13,
    color: '#8F1A27',
    fontWeight: '600',
  },
  skillsGrid: {
    gap: 10,
  },
  skillCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderRadius: 10,
  },
  skillContent: {
    padding: 14,
  },
  skillInfo: {
    width: '100%',
  },
  skillName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  skillMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  skillCategory: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  skillProficiencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  skillProficiencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  resumeCard: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  resumeContent: {
    padding: 0,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resumeButtonText: {
    fontSize: 15,
    color: '#8F1A27',
    fontWeight: '600',
    flex: 1,
    marginLeft: 10,
  },
  technologiesContainer: {
    marginBottom: 12,
  },
  technologiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  technologyBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  technologyText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  projectDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  talentCard: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  talentContent: {
    padding: 0,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  talentImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  talentText: {
    padding: 14,
  },
  talentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 12,
  },
  talentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  talentCategory: {
    backgroundColor: '#FEBF17',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  talentCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'uppercase',
  },
  talentDescription: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  talentFilesContainer: {
    marginBottom: 0,
  },
  talentFilesContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 0,
  },
  talentFileItem: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  talentFileImage: {
    width: 200,
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  talentFilePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactSection: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  followButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8F1A27',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#8F1A27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  followingButtonLarge: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#8F1A27',
  },
  followButtonTextLarge: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  followingButtonTextLarge: {
    color: '#8F1A27',
  },
  contactButtonLarge: {
    flex: 1,
    backgroundColor: '#8F1A27',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8F1A27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8F1A27',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: width - 40,
    maxWidth: 500,
    maxHeight: height * 0.8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    marginBottom: 20,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#8F1A27',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  socialStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  socialStatButton: {
    alignItems: 'center',
    flex: 1,
  },
  socialStatNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8F1A27',
    marginBottom: 2,
  },
  socialStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
  },
  modalListAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8F1A27',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalListAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalListInfo: {
    flex: 1,
  },
  modalListName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  modalListEmail: {
    fontSize: 13,
    color: '#6b7280',
  },
  // Reel Viewer Styles
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
    justifyContent: 'center',
    alignItems: 'center',
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
});