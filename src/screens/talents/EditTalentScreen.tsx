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
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
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
    'Music', 'Research', 'Design', 'Writing', 'Development', 
    'Art', 'Photography', 'Video', 'Media', 'Marketing', 
    'Consulting', 'Tutoring', 'Cooking', 'Fitness', 'Language'
  ];

  const talentCategories = [
    'Artwork', 'STEM', 'Creative', 'Academic', 'Technology',
    'Business', 'Health', 'Education', 'Entertainment', 'Other'
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
      Alert.alert('Error', 'Please enter a title for your talent');
      return;
    }
    if (!formData.category.trim()) {
      Alert.alert('Error', 'Please select a category for your talent');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description for your talent');
      return;
    }

    try {
      await dispatch(updateTalent({
        studentId: talent.studentId,
        talentId: talent.id,
        talentData: formData,
        files: selectedFiles,
      })).unwrap();
      
      Alert.alert('Success', 'Talent updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update talent. Please try again.');
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#8F1A27" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Talent</Text>
        <View style={styles.placeholder} />
      </View>

      {error && (
        <AlertComponent variant="destructive" style={styles.errorAlert}>
          <AlertDescription>{error}</AlertDescription>
        </AlertComponent>
      )}

      <Card style={styles.formCard}>
        <CardHeader>
          <CardTitle style={styles.cardTitle}>Talent Information</CardTitle>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <Input
              placeholder="Enter talent title"
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              style={styles.input}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsContainer}>
              {talentTitles.map((title) => (
                <TouchableOpacity
                  key={title}
                  style={styles.suggestionButton}
                  onPress={() => handleInputChange('title', title)}
                >
                  <Text style={styles.suggestionText}>{title}</Text>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsContainer}>
              {talentCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.suggestionButton}
                  onPress={() => handleInputChange('category', category)}
                >
                  <Text style={styles.suggestionText}>{category}</Text>
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
              {existingFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  {isImageFile(file) ? (
                    <Image
                      source={{ uri: getFileUrl(file) }}
                      style={styles.fileThumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.fileIcon}>📄</Text>
                  )}
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.split('/').pop()}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => removeExistingFile(index)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add New Files */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Add New Files (Optional)</Text>
            <Text style={styles.subLabel}>Add more images, videos, or documents</Text>
            
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={20} color="#8F1A27" />
                <Text style={styles.uploadButtonText}>Add Images/Videos</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                <Ionicons name="document-text-outline" size={20} color="#8F1A27" />
                <Text style={styles.uploadButtonText}>Add Documents</Text>
              </TouchableOpacity>
            </View>

            {/* Selected New Files */}
            {selectedFiles.length > 0 && (
              <View style={styles.filesContainer}>
                <Text style={styles.filesTitle}>New Files:</Text>
                {selectedFiles.map((file, index) => (
                  <View key={index} style={styles.fileItem}>
                    <Text style={styles.fileIcon}>{getFileIcon(file)}</Text>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeFileButton}
                      onPress={() => removeNewFile(index)}
                    >
                      <Ionicons name="close-outline" size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          onPress={handleSubmit}
          disabled={isLoading}
          style={styles.submitButton}
        >
          {isLoading ? (
            <Ionicons name="refresh-outline" size={20} color="white" />
          ) : (
            <Ionicons name="add-outline" size={20} color="white" />
          )}
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Updating Talent...' : 'Update Talent'}
          </Text>
        </Button>
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
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8F1A27',
  },
  placeholder: {
    width: 40,
  },
  errorAlert: {
    margin: 20,
  },
  formCard: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cardContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filesContainer: {
    marginTop: 12,
  },
  filesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  fileIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  removeFileButton: {
    padding: 4,
  },
  submitContainer: {
    padding: 20,
  },
  submitButton: {
    backgroundColor: '#8F1A27',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 