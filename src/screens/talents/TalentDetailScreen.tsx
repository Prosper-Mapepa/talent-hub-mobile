import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { deleteTalent } from '../../store/slices/talentsSlice';
import { Talent } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert as AlertComponent, AlertDescription } from '../../components/ui/alert';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types';
// TODO: Update to expo-video when stable
import { Video, ResizeMode } from 'expo-av';

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
  const [videoRef, setVideoRef] = useState<any>(null);

  const isOwner = user?.studentId === talent.studentId;
  const studentName = talent.student ? `${talent.student.firstName} ${talent.student.lastName}` : 'Unknown Student';

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${process.env.API_BASE_URL || 'http://35.32.125.176:3001'}${filePath}`;
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
    if (videoRef) {
      try {
        await videoRef.playAsync();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing video:', error);
      }
    }
  };

  const handlePauseVideo = async () => {
    if (videoRef) {
      try {
        await videoRef.pauseAsync();
        setIsPlaying(false);
      } catch (error) {
        console.error('Error pausing video:', error);
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Talent',
      'Are you sure you want to delete this talent? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteTalent({
                studentId: talent.studentId,
                talentId: talent.id,
              })).unwrap();
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete talent. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('EditTalent', { talent });
  };

  const nextFile = () => {
    if (talent.files && talent.files.length > 0) {
      setCurrentFileIndex((prev) => (prev + 1) % talent.files.length);
    }
  };

  const previousFile = () => {
    if (talent.files && talent.files.length > 0) {
      setCurrentFileIndex((prev) => (prev - 1 + talent.files.length) % talent.files.length);
    }
  };

  const currentFile = talent.files && talent.files.length > 0 ? talent.files[currentFileIndex] : null;

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
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#8F1A27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Talent Details</Text>
        {isOwner && (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
              <Ionicons name="create" size={20} color="#8F1A27" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
              <Ionicons name="trash" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        )}
      </View> */}

      {error && (
        <AlertComponent variant="destructive" style={styles.errorAlert}>
          <AlertDescription>{error}</AlertDescription>
        </AlertComponent>
      )}

      <ScrollView style={styles.content}>
        {/* Talent Info Card */}
        <Card style={styles.infoCard}>
          <CardHeader>
            <View style={styles.titleRow}>
              <CardTitle style={styles.talentTitle}>{talent.title}</CardTitle>
              <Badge style={styles.categoryBadge}>{talent.category}</Badge>
            </View>
            <Text style={styles.studentName}>by {studentName}</Text>
          </CardHeader>
          <CardContent>
            <Text style={styles.description}>{talent.description}</Text>
          </CardContent>
        </Card>

        {/* Media Files */}
        {talent.files && talent.files.length > 0 && (
          <Card style={styles.mediaCard}>
            <CardHeader>
              <CardTitle>Media Files</CardTitle>
              {talent.files.length > 1 && (
                <Text style={styles.fileCounter}>
                  {currentFileIndex + 1} of {talent.files.length}
                </Text>
              )}
            </CardHeader>
            <CardContent>
              <View style={styles.mediaContainer}>
                {currentFile && (
                  <>
                    {isVideoFile(currentFile) ? (
                      <View style={styles.videoContainer}>
                        <Video
                          ref={setVideoRef}
                          source={{ uri: getFileUrl(currentFile) }}
                          style={styles.mediaFile}
                          useNativeControls={false}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                          isMuted={false}
                          isLooping={false}
                          onError={(error) => {
                            console.error('Video loading error:', error);
                            console.error('Video URL:', getFileUrl(currentFile));
                          }}
                          onLoad={() => {
                            console.log('Video loaded successfully');
                          }}
                          onPlaybackStatusUpdate={(status) => {
                            if (status.isLoaded) {
                              setIsPlaying(status.isPlaying);
                            }
                          }}
                        />
                        <TouchableOpacity
                          style={[
                            styles.videoPlayButton,
                            isPlaying && { backgroundColor: 'rgba(0, 0, 0, 0.3)' }
                          ]}
                          onPress={isPlaying ? handlePauseVideo : handlePlayVideo}
                        >
                          <Ionicons 
                            name={isPlaying ? "pause" : "play"} 
                            size={48} 
                            color="white" 
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: getFileUrl(currentFile) }}
                        style={styles.mediaFile}
                        resizeMode="contain"
                        onError={(error) => {
                          console.error('Image loading error:', error);
                          console.error('Image URL:', getFileUrl(currentFile));
                        }}
                      />
                    )}

                    {/* Navigation Controls */}
                    {talent.files.length > 1 && (
                      <View style={styles.navigationControls}>
                        <TouchableOpacity
                          onPress={previousFile}
                          style={styles.navButton}
                        >
                          <Ionicons name="chevron-back" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={nextFile}
                          style={styles.navButton}
                        >
                          <Ionicons name="chevron-forward" size={24} color="white" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* File Thumbnails */}
              {talent.files.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailsContainer}>
                  {talent.files.map((file, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setCurrentFileIndex(index)}
                      style={[
                        styles.thumbnail,
                        currentFileIndex === index && styles.activeThumbnail
                      ]}
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
            </CardContent>
          </Card>
        )}

        {/* Contact Actions */}
        <Card style={styles.actionsCard}>
          <CardHeader>
            <CardTitle>Get in Touch</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.actionButtons}>
              <Button
                onPress={() => {
                  // Show message feature coming soon
                  Alert.alert('Coming Soon', 'Direct messaging feature will be available soon!');
                }}
                style={styles.contactButton}
              >
                <Text style={styles.contactButtonText}>Message Student</Text>
              </Button>
              
              <Button
                variant="outline"
                onPress={() => {
                  Alert.alert('Coming Soon', 'Request service feature will be available soon!');
                }}
                style={styles.requestButton}
              >
                <Text style={styles.requestButtonText}>Collaborate</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  errorAlert: {
    margin: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  talentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#8F1A27',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  studentName: {
    fontSize: 14,
    color: '#6b7280',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  mediaCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
  },
  mediaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  fileCounter: {
    fontSize: 14,
    color: '#6b7280',
  },
  mediaContainer: {
    position: 'relative',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
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
    paddingHorizontal: 16,
  },
  navButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  thumbnailsContainer: {
    marginTop: 16,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#8F1A27',
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
    borderRadius: 16,
    marginBottom: 100,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  actionButtons: {
    gap: 12,
  },
  contactButton: {
    backgroundColor: '#8F1A27',
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  requestButton: {
    borderColor: '#8F1A27',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  requestButtonText: {
    color: '#8F1A27',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 