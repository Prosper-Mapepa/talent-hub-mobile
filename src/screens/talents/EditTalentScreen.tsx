import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { showToast } from '../../components/ui/toast';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { fetchAllTalents } from '../../store/slices/talentsSlice';
import { updateTalent } from '../../store/slices/talentsSlice';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert as AlertComponent, AlertDescription } from '../../components/ui/alert';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Talent } from '../../types';

export default function EditTalentScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const route = useRoute();
  const { talent } = route.params as { talent: Talent };
  const { user } = useAppSelector((state) => state.auth);
  const { isLoading, error } = useAppSelector((state) => state.talents);

  const [formData, setFormData] = useState({
    title: talent.title,
    category: talent.category,
    description: talent.description,
  });
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>(talent.files || []);

  const talentTitles = [
    'DJ & Music Production', 'Graphic Design Mastery', 'Creative Writing', 'Video Editing Pro', 
    'Web Development', 'Digital Art & Illustration', 'Photography Excellence', 'Content Creation', 
    'Social Media Marketing', 'Business Consulting', 'Academic Tutoring', 'Culinary Arts', 
    'Fitness Coaching', 'Language Translation', 'Music Performance', '3D Animation', 
    'UI/UX Design', 'Podcast Production', 'Event Planning', 'Fashion Design'
  ];

  const talentCategories = [
    'Music & Audio', 'Visual Arts', 'Creative Design', 'Technology & Development', 
    'Business & Consulting', 'Health & Wellness', 'Education & Learning', 'Entertainment', 
    'Media & Content', 'Other'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newFiles = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type || 'image',
        name: asset.fileName || `image_${Date.now()}`,
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      multiple: true,
    });

    if (!result.canceled) {
      const newFiles = result.assets.map(asset => ({
        uri: asset.uri,
        type: 'document',
        name: asset.name,
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeNewFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (index: number) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showToast('Please enter a title for your talent', 'error');
      return;
    }
    if (!formData.category.trim()) {
      showToast('Please select a category for your talent', 'error');
      return;
    }
    if (!formData.description.trim()) {
      showToast('Please enter a description for your talent', 'error');
      return;
    }

    try {
      await dispatch(updateTalent({
        studentId: talent.studentId,
        talentId: talent.id,
        talentData: formData,
        files: selectedFiles,
      })).unwrap();
      
      // Refresh the talents list to ensure latest data
      await dispatch(fetchAllTalents());
      
      showToast('Talent updated successfully!', 'success', {
        text: 'OK',
        onPress: () => navigation.goBack()
      });
    } catch (error) {
      showToast('Failed to update talent. Please try again.', 'error');
    }
  };

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${process.env.API_BASE_URL || 'http://35.32.69.18:3001'}${filePath}`;
  };

  const getFileIcon = (file: any) => {
    if (file.type === 'video') return '🎥';
    if (file.type === 'document') return '📄';
    return '🖼️';
  };

  const isImageFile = (filePath: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
    return imageExtensions.some(ext => filePath.toLowerCase().includes(ext));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#8F1A27" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Talent</Text>
        <View style={styles.placeholder} />
      </View>

      {error && (
        <View style={styles.errorContainer}>
        <AlertComponent variant="destructive" style={styles.errorAlert}>
          <AlertDescription>{error}</AlertDescription>
        </AlertComponent>
        </View>
      )}

      <View style={styles.formCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Talent Information</Text>
        </View>
        <View style={styles.cardContent}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <Input
              placeholder="Enter talent title"
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              style={styles.input}
            />
            <Text style={styles.suggestionsLabel}>Quick suggestions:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.suggestionsContainer}
              contentContainerStyle={styles.suggestionsContent}
            >
              {talentTitles.map((title) => (
                <TouchableOpacity
                  key={title}
                  style={[
                    styles.suggestionButton,
                    formData.title === title && styles.suggestionButtonActive
                  ]}
                  onPress={() => handleInputChange('title', title)}
                >
                  <Text style={[
                    styles.suggestionText,
                    formData.title === title && styles.suggestionTextActive
                  ]}>{title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <Input
              placeholder="Select category"
              value={formData.category}
              onChangeText={(value) => handleInputChange('category', value)}
              style={styles.input}
            />
            <Text style={styles.suggestionsLabel}>Quick suggestions:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.suggestionsContainer}
              contentContainerStyle={styles.suggestionsContent}
            >
              {talentCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.suggestionButton,
                    formData.category === category && styles.suggestionButtonActive
                  ]}
                  onPress={() => handleInputChange('category', category)}
                >
                  <Text style={[
                    styles.suggestionText,
                    formData.category === category && styles.suggestionTextActive
                  ]}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <Input
              placeholder="Describe your talent or service"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Existing Files */}
          {existingFiles.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Files</Text>
              <Text style={styles.subLabel}>These files will be kept unless removed</Text>
              <View style={styles.filesList}>
              {existingFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  {isImageFile(file) ? (
                    <Image
                      source={{ uri: getFileUrl(file) }}
                      style={styles.fileThumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                      <View style={styles.fileIconContainer}>
                        <Ionicons name="document-outline" size={20} color="#6b7280" />
                      </View>
                  )}
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.split('/').pop()}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => removeExistingFile(index)}
                  >
                      <Ionicons name="trash-outline" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
              </View>
            </View>
          )}

          {/* Add New Files */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Add New Files (Optional)</Text>
            <Text style={styles.subLabel}>Add more images, videos, or documents</Text>
            
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={20} color="#8F1A27" />
                <Text style={styles.uploadButtonText}>Images/Videos</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                <Ionicons name="document-text-outline" size={20} color="#8F1A27" />
                <Text style={styles.uploadButtonText}>Documents</Text>
              </TouchableOpacity>
            </View>

            {/* Selected New Files */}
            {selectedFiles.length > 0 && (
              <View style={styles.filesContainer}>
                <Text style={styles.filesTitle}>New Files ({selectedFiles.length}):</Text>
                <View style={styles.filesList}>
                {selectedFiles.map((file, index) => (
                  <View key={index} style={styles.fileItem}>
                      <View style={styles.fileIconContainer}>
                        {file.type === 'video' ? (
                          <Ionicons name="videocam-outline" size={20} color="#6b7280" />
                        ) : file.type === 'document' ? (
                          <Ionicons name="document-outline" size={20} color="#6b7280" />
                        ) : (
                          <Ionicons name="image-outline" size={20} color="#6b7280" />
                        )}
                      </View>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeFileButton}
                      onPress={() => removeNewFile(index)}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        >
          {isLoading ? (
            <Ionicons name="refresh" size={20} color="white" />
          ) : (
            <Ionicons name="checkmark-circle" size={20} color="white" />
          )}
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Updating...' : 'Update Talent'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8F1A27',
  },
  placeholder: {
    width: 40,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  errorAlert: {
    margin: 0,
  },
  formCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  cardContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  suggestionsLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    marginBottom: 6,
    fontWeight: '500',
  },
  suggestionsContainer: {
    marginTop: 4,
  },
  suggestionsContent: {
    paddingRight: 16,
  },
  suggestionButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionButtonActive: {
    backgroundColor: '#8F1A27',
    borderColor: '#8F1A27',
  },
  suggestionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  suggestionTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  filesContainer: {
    marginTop: 12,
  },
  filesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filesList: {
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fileThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 10,
  },
  fileIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  removeFileButton: {
    padding: 4,
    marginLeft: 8,
  },
  submitContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  submitButton: {
    backgroundColor: '#8F1A27',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#8F1A27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 