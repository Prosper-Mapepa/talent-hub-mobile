import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  StatusBar,
  Animated,
  Pressable,
  Modal,
  FlatList,
} from 'react-native';
import { showToast } from '../../components/ui/toast';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { deleteTalent } from '../../store/slices/talentsSlice';
import { createConversation, sendMessage } from '../../store/slices/messagesSlice';
import { Talent } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Alert as AlertComponent, AlertDescription } from '../../components/ui/alert';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types';
// TODO: Update to expo-video when stable
import { Video, ResizeMode } from 'expo-av';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function TalentDetailScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { talent } = route.params as { talent: Talent };
  const { user } = useAppSelector((state) => state.auth);
  const { isLoading, error } = useAppSelector((state) => state.talents);

  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<any>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeScale] = useState(new Animated.Value(1));
  const [saveScale] = useState(new Animated.Value(1));
  const [reelModalVisible, setReelModalVisible] = useState(false);
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');

  const isOwner = user?.studentId === talent.studentId;
  const studentName = talent.student ? `${talent.student.firstName} ${talent.student.lastName}` : 'Unknown Student';

  // Load like/save status
  useEffect(() => {
    const loadStatus = async () => {
      if (user?.studentId) {
        try {
          const [liked, saved] = await Promise.all([
            apiService.getLikedTalents(user.studentId),
            apiService.getSavedTalents(user.studentId),
          ]);
          setIsLiked(liked.some((t: any) => t.id === talent.id));
          setIsSaved(saved.some((t: any) => t.id === talent.id));
        } catch (error) {
          console.error('Error loading like/save status:', error);
        }
      }
    };
    loadStatus();
  }, [user?.studentId, talent.id]);

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    const baseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'http://192.168.0.106:3001';
    return `${baseUrl}${filePath}`;
  };

  const isVideoFile = (filePath: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => filePath.toLowerCase().includes(ext));
  };

  const isImageFile = (filePath: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
    return imageExtensions.some(ext => filePath.toLowerCase().includes(ext));
  };

  const handlePlayVideo = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.playAsync();
        setIsPlaying(true);
        setIsVideoPlaying(true);
      } catch (error) {
        console.error('Error playing video:', error);
      }
    }
  };

  const handlePauseVideo = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
        setIsVideoPlaying(false);
      } catch (error) {
        console.error('Error pausing video:', error);
      }
    }
  };

  const handleDelete = () => {
    showToast(
      'Are you sure you want to delete this talent? This action cannot be undone.',
      'warning',
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await dispatch(deleteTalent({
                studentId: talent.studentId,
                talentId: talent.id,
              })).unwrap();
              navigation.goBack();
            } catch (error) {
            showToast('Failed to delete talent. Please try again.', 'error');
            }
          },
      }
    );
  };

  const handleEdit = () => {
    navigation.navigate('EditTalent', { talent });
  };

  const handleMessage = () => {
    if (!user?.id) {
      showToast('You must be logged in to send messages.', 'info');
      return;
    }
    
    if (!talent.student) {
      showToast('Unable to find student information.', 'error');
      return;
    }
    
    const recipientUserId = talent.student?.user?.id || talent.student?.userId;
    if (!recipientUserId) {
      showToast('Unable to find recipient user information.', 'error');
      return;
    }
    
    if (user.id === recipientUserId) {
      showToast('You cannot send messages to yourself.', 'warning');
      return;
    }
    
    setShowMessageModal(true);
  };

  const handleLike = async () => {
    if (!user?.studentId) {
      showToast('Please log in to like talents.', 'info');
      return;
    }

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
    // Animate like button
    Animated.sequence([
      Animated.spring(likeScale, {
        toValue: newLikedState ? 1.3 : 0.9,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(likeScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    if (newLikedState) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await apiService.likeTalent(user.studentId, talent.id, newLikedState);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      setIsLiked(!newLikedState); // Revert on error
          showToast('Failed to like talent.', 'error');
    }
  };

  const handleSave = async () => {
    if (!user?.studentId) {
      showToast('Please log in to save talents.', 'info');
      return;
    }

    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    
    // Animate save button
    Animated.sequence([
      Animated.spring(saveScale, {
        toValue: newSavedState ? 1.2 : 0.9,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(saveScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await apiService.saveTalent(user.studentId, talent.id, newSavedState);
    } catch (error) {
      console.error('Failed to toggle save:', error);
      setIsSaved(!newSavedState); // Revert on error
          showToast('Failed to save talent.', 'error');
    }
  };

  const nextFile = () => {
    if (talent.files && talent.files.length > 0) {
      if (videoRef.current) {
        videoRef.current.pauseAsync();
      }
      setCurrentFileIndex((prev) => (prev + 1) % talent.files.length);
      setIsVideoPlaying(false);
      setIsPlaying(false);
    }
  };

  const previousFile = () => {
    if (talent.files && talent.files.length > 0) {
      if (videoRef.current) {
        videoRef.current.pauseAsync();
      }
      setCurrentFileIndex((prev) => (prev - 1 + talent.files.length) % talent.files.length);
      setIsVideoPlaying(false);
      setIsPlaying(false);
    }
  };

  const currentFile = talent.files && talent.files.length > 0 ? talent.files[currentFileIndex] : null;

  // Auto-play video when file changes
  useEffect(() => {
    if (currentFile && isVideoFile(currentFile) && videoRef.current) {
      // Small delay to ensure video is loaded
      const timer = setTimeout(async () => {
        try {
          await videoRef.current?.playAsync();
          setIsVideoPlaying(true);
          setIsPlaying(true);
        } catch (error) {
          console.error('Error autoplaying video:', error);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsVideoPlaying(false);
      setIsPlaying(false);
    }
  }, [currentFileIndex, currentFile]);

  const openReelViewer = (index: number) => {
    setSelectedReelIndex(index);
    setReelModalVisible(true);
  };

  // Debug logging
  console.log('Talent files:', talent.files);
  console.log('Current file:', currentFile);
  console.log('Current file index:', currentFileIndex);
  if (currentFile) {
    console.log('Is video file:', isVideoFile(currentFile));
    console.log('File URL:', getFileUrl(currentFile));
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8F1A27" translucent />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#8F1A27', '#6A0032', '#8F1A27']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
          <View style={styles.headerSpacer} />
          {isOwner ? (
          <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleEdit} style={styles.headerActionButton}>
                <Ionicons name="create" size={20} color="#FFFFFF" />
            </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerActionButton}>
                <Ionicons name="trash" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          ) : (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleMessage} style={styles.headerActionButton}>
                <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <Pressable onPress={handleLike} style={styles.headerActionButton}>
                <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                  <Ionicons 
                    name={isLiked ? "heart" : "heart-outline"} 
                    size={22} 
                    color={isLiked ? "#ff6b9d" : "#FFFFFF"} 
                  />
                </Animated.View>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.headerActionButton}>
                <Animated.View style={{ transform: [{ scale: saveScale }] }}>
                  <Ionicons 
                    name={isSaved ? "bookmark" : "bookmark-outline"} 
                    size={22} 
                    color={isSaved ? "#FEBF17" : "#FFFFFF"} 
                  />
                </Animated.View>
              </Pressable>
            </View>
          )}
        </View>
      </LinearGradient>

      {error && (
        <AlertComponent variant="destructive" style={styles.errorAlert}>
          <AlertDescription>{error}</AlertDescription>
        </AlertComponent>
      )}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.profileInfo}
            onPress={() => {
              if (talent.student?.id) {
                navigation.navigate('StudentProfile', { studentId: talent.student.id });
              }
            }}
            activeOpacity={0.7}
          >
            <Image
              source={require('../../../assets/adaptive-icon.png')}
              style={styles.profileAvatar}
            />
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{studentName}</Text>
              <Text style={styles.profileHandle}>@{talent.student?.firstName?.toLowerCase() || 'student'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Talent Info Card */}
        <View style={styles.infoCard}>
            <View style={styles.titleRow}>
            <Text style={styles.talentTitle}>{talent.title}</Text>
            <Badge style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{talent.category}</Text>
            </Badge>
            </View>
            <Text style={styles.description}>{talent.description}</Text>
        </View>

        {/* Media Files */}
        {talent.files && talent.files.length > 0 && (
          <View style={styles.mediaCard}>
            <View style={styles.mediaHeader}>
              <Text style={styles.mediaTitle}>Media</Text>
              {talent.files.length > 1 && (
                <Text style={styles.fileCounter}>
                  {currentFileIndex + 1} / {talent.files.length}
                </Text>
              )}
            </View>
              <View style={styles.mediaContainer}>
                {currentFile && (
                  <>
                    {isVideoFile(currentFile) ? (
                      <View style={styles.videoContainer}>
                        <TouchableOpacity
                          activeOpacity={1}
                          onPress={() => openReelViewer(currentFileIndex)}
                          style={styles.mediaTouchable}
                        >
                        <Video
                            ref={(ref) => {
                              videoRef.current = ref;
                            }}
                          source={{ uri: getFileUrl(currentFile) }}
                          style={styles.mediaFile}
                          useNativeControls={false}
                          resizeMode={ResizeMode.COVER}
                            shouldPlay={true}
                          isMuted={false}
                            isLooping={true}
                          onError={(error) => {
                            console.error('Video loading error:', error);
                            console.error('Video URL:', getFileUrl(currentFile));
                          }}
                          onLoad={() => {
                            console.log('Video loaded successfully');
                              // Auto-play when video loads
                              if (videoRef.current) {
                                videoRef.current.playAsync().then(() => {
                                  setIsVideoPlaying(true);
                                  setIsPlaying(true);
                                }).catch((error: any) => {
                                  console.error('Error autoplaying video:', error);
                                });
                              }
                          }}
                          onPlaybackStatusUpdate={(status) => {
                            if (status.isLoaded) {
                                const playing = status.isPlaying;
                                setIsPlaying(playing);
                                setIsVideoPlaying(playing);
                                console.log('Video playing status:', playing, 'isVideoPlaying:', playing);
                            }
                          }}
                        />
                        </TouchableOpacity>
                        {!isVideoPlaying && (
                          <Pressable
                            style={styles.videoPlayButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handlePlayVideo();
                            }}
                        >
                            <View style={styles.playButtonCircle}>
                          <Ionicons 
                                name="play" 
                                size={40} 
                            color="white" 
                          />
                            </View>
                          </Pressable>
                        )}
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.95}
                        onPress={() => openReelViewer(currentFileIndex)}
                        style={styles.mediaTouchable}
                      >
                      <Image
                        source={{ uri: getFileUrl(currentFile) }}
                        style={styles.mediaFile}
                          resizeMode="cover"
                        onError={(error) => {
                          console.error('Image loading error:', error);
                          console.error('Image URL:', getFileUrl(currentFile));
                        }}
                      />
                      </TouchableOpacity>
                    )}

                    {/* Navigation Controls */}
                    {talent.files.length > 1 && (
                      <View style={styles.navigationControls}>
                        <TouchableOpacity
                          onPress={previousFile}
                          style={styles.navButton}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="chevron-back" size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={nextFile}
                          style={styles.navButton}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="chevron-forward" size={22} color="white" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* File Thumbnails */}
              {talent.files.length > 1 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.thumbnailsContainer}
                  contentContainerStyle={styles.thumbnailsContent}
                >
                  {talent.files.map((file, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        if (videoRef.current) {
                          videoRef.current.pauseAsync();
                        }
                        setCurrentFileIndex(index);
                        setIsVideoPlaying(false);
                        setIsPlaying(false);
                      }}
                      style={[
                        styles.thumbnail,
                        currentFileIndex === index && styles.activeThumbnail
                      ]}
                      activeOpacity={0.7}
                    >
                      {isImageFile(file) ? (
                        <Image
                          source={{ uri: getFileUrl(file) }}
                          style={styles.thumbnailImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.thumbnailPlaceholder}>
                          <Ionicons name="play" size={16} color="#8F1A27" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
          </View>
        )}

        {/* Contact Actions */}
        {!isOwner && (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Get in Touch</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={handleMessage}
                style={styles.contactButton}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.contactButtonText}>Message</Text>
              </TouchableOpacity>
              
              {/* <TouchableOpacity
                onPress={() => {
                    showToast('Opening collaboration request feature...', 'info');
                }}
                style={styles.requestButton}
                activeOpacity={0.8}
              >
                <Ionicons name="people" size={18} color="#8F1A27" style={{ marginRight: 8 }} />
                <Text style={styles.requestButtonText}>Collaborate</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        )}
      </ScrollView>

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
          {talent.files && talent.files.length > 0 && (
            <FlatList
              ref={flatListRef}
              data={talent.files}
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
                setCurrentFileIndex(index);
              }}
              renderItem={({ item, index }) => {
                const isVideo = isVideoFile(item);
                return (
                  <View style={styles.reelItem}>
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
                    
                    {/* Content Overlay */}
                    <View style={styles.reelOverlay}>
                      {/* Top Info */}
                      <View style={styles.reelTopInfo}>
                        <TouchableOpacity
                          style={styles.reelProfileInfo}
                          onPress={() => {
                            setReelModalVisible(false);
                            if (talent.student?.id) {
                              navigation.navigate('StudentProfile', { studentId: talent.student.id });
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={styles.reelProfileImage}>
                            {talent.student?.profileImage ? (
                              <Image
                                source={{ uri: getFileUrl(talent.student.profileImage) }}
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
                        <Text style={styles.reelTitle}>{talent.title}</Text>
                        <Text style={styles.reelDescription} numberOfLines={3}>
                          {talent.description}
                        </Text>
                        {talent.category && (
                          <View style={styles.reelCategoryBadge}>
                            <Text style={styles.reelCategoryText}>{talent.category}</Text>
                          </View>
                        )}
                      </View>

                      {/* Media Indicator */}
                      {talent.files.length > 1 && (
                        <View style={styles.reelIndicator}>
                          {talent.files.map((_, idx) => (
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
                        <Pressable onPress={handleLike} style={styles.reelActionButton}>
                          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                            <Ionicons 
                              name={isLiked ? "heart" : "heart-outline"} 
                              size={28} 
                              color={isLiked ? "#ff6b9d" : "white"} 
                            />
                          </Animated.View>
                        </Pressable>
                        <Pressable onPress={handleSave} style={styles.reelActionButton}>
                          <Animated.View style={{ transform: [{ scale: saveScale }] }}>
                            <Ionicons 
                              name={isSaved ? "bookmark" : "bookmark-outline"} 
                              size={28} 
                              color={isSaved ? "#FEBF17" : "white"} 
                            />
                          </Animated.View>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setReelModalVisible(false);
                            if (talent.student?.id) {
                              navigation.navigate('StudentProfile', { studentId: talent.student.id });
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

      {/* Message Modal */}
      {showMessageModal && (
        <Modal
          visible={showMessageModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMessageModal(false)}
        >
          <View style={styles.messageModalOverlay}>
            <View style={styles.messageModalContainer}>
              <View style={styles.messageModalHeader}>
                <Text style={styles.messageModalTitle}>Send Direct Message</Text>
                <TouchableOpacity
                  onPress={() => setShowMessageModal(false)}
                  style={styles.messageModalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.messageModalSubtitle}>
                Send a direct message to {talent.student?.firstName || 'this student'} about their talent "{talent.title}"
              </Text>
              
              <Input
                placeholder="Type your message..."
                value={messageText}
                onChangeText={setMessageText}
                style={styles.messageModalInput}
                multiline
                numberOfLines={4}
              />
              
              <View style={styles.messageModalActions}>
                <TouchableOpacity
                  onPress={() => setShowMessageModal(false)}
                  style={styles.messageModalCancelButton}
                >
                  <Text style={styles.messageModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    if (!messageText.trim()) {
                      showToast('Please enter a message.', 'warning');
                      return;
                    }
                    
                    if (!user?.id) {
                      showToast('You must be logged in to send messages.', 'error');
                      return;
                    }
                    
                    if (!talent.student) {
                      showToast('Unable to find student information for this talent.', 'error');
                      return;
                    }
                    
                    const recipientUserId = talent.student?.user?.id || talent.student?.userId;
                    
                    if (!recipientUserId) {
                      showToast('Unable to find recipient user information. Please try again later.', 'error');
                      return;
                    }
                    
                    if (user.id === recipientUserId) {
                      showToast('You cannot send messages to yourself.', 'warning');
                      return;
                    }
                    
                    try {
                      setShowMessageModal(false);
                      
                      const token = await AsyncStorage.getItem('authToken');
                      if (!token) {
                        throw new Error('You are not authenticated. Please log in again.');
                      }
                      
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
                        
                        if (!conversation || !conversation.id) {
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
                      const messageContent = `[About talent: ${talent.title}]\n\n${messageText.trim()}`;
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
                              (navigation as any).navigate('MainTabs', { screen: 'Messages' });
                            } catch (navError) {
                              console.log('Navigation error:', navError);
                            }
                          }
                        }
                      );
                      setMessageText('');
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
                      setShowMessageModal(true);
                    }
                  }}
                  style={styles.messageModalSendButton}
                >
                  <Text style={styles.messageModalSendText}>Send Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingTop: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerSpacer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorAlert: {
    margin: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  profileSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginTop: -16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  profileHandle: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  talentTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  categoryBadge: {
    backgroundColor: '#FEBF17',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    fontWeight: '400',
  },
  mediaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  mediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6',
    marginBottom: 16,
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  fileCounter: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  mediaContainer: {
    position: 'relative',
    height: 280,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },
  mediaFile: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  videoPlayButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  playButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(143, 26, 39, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    pointerEvents: 'box-none',
  },
  navButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 18,
    padding: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailsContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  thumbnailsContent: {
    paddingRight: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  activeThumbnail: {
    borderColor: '#8F1A27',
    borderWidth: 2.5,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  actionButtons: {
    gap: 10,
  },
  contactButton: {
    backgroundColor: '#8F1A27',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  requestButton: {
    borderColor: '#8F1A27',
    borderWidth: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  requestButtonText: {
    color: '#8F1A27',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  mediaTouchable: {
    width: '100%',
    height: '100%',
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
  // Message Modal Styles
  messageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  messageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  messageModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  messageModalCloseButton: {
    padding: 4,
  },
  messageModalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    paddingHorizontal: 20,
    paddingBottom: 16,
    lineHeight: 20,
  },
  messageModalInput: {
    marginHorizontal: 20,
    marginBottom: 20,
    minHeight: 100,
  },
  messageModalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  messageModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageModalCancelText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
  messageModalSendButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#8F1A27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageModalSendText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
}); 