import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAppSelector, useAppDispatch } from '../../store';
import { followUser, unfollowUser, checkFollowStatus } from '../../store/slices/followsSlice';
import { createConversation, sendMessage } from '../../store/slices/messagesSlice';
import { showToast } from '../../components/ui/toast';
import Constants from 'expo-constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

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
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  
  // Check if file is a video
  const isVideoFile = (filePath: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => filePath.toLowerCase().includes(ext));
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
            if (__DEV__) {
              const platform = require('react-native').Platform.OS;
              if (platform === 'android') {
                return 'http://10.0.2.2:3001';
              } else if (platform === 'ios') {
                return 'http://localhost:3001';
              }
            }
            return envApiUrl || 'http://192.168.0.106:3001';
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
      } else {
        await dispatch(followUser({ 
          followerId: user.id, 
          followingId 
        })).unwrap();
        setIsFollowing(true);
        showToast(`Following ${student.firstName} ${student.lastName}`, 'success');
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

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    
    const baseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'http://192.168.0.106:3001';
    return `${baseUrl}${filePath}`;
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

  const renderTalent = (talent: any) => {
    const firstFile = talent.files && talent.files.length > 0 ? talent.files[0] : null;
    const isVideo = firstFile ? isVideoFile(firstFile) : false;
    
    return (
    <Card key={talent.id} style={styles.talentCard}>
      <CardContent style={styles.talentContent}>
          {firstFile && (
            <>
              {isVideo ? (
                <View style={styles.videoContainer}>
                  <Video
                    source={{ uri: getFileUrl(firstFile) }}
                    style={styles.talentImage}
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
            style={styles.talentImage}
            resizeMode="cover"
          />
              )}
            </>
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
              {student?.firstName || ''} {student?.lastName || ''}
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
              <View style={styles.profileImageContainer}>
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
              </View>
              
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
                 {student.availability && (
                    <View style={styles.availabilityRow}>
                      <Ionicons name="time" size={16} color="#6b7280" />
                      <Text style={styles.availabilityText}>
                        {student.availability.replace(/_/g, ' ')}
                      </Text>
                   </View>
                 )}
                 
                 {student.profileViews && (
                    <View style={styles.viewsRow}>
                     <Ionicons name="eye" size={16} color="#8F1A27" />
                      <Text style={styles.viewsText}>
                        {student.profileViews} {student.profileViews === 1 ? 'view' : 'views'}
                      </Text>
                   </View>
                 )}
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
    paddingHorizontal: 20,
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
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
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
});