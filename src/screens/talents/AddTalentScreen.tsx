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
import { addTalent } from '../../store/slices/talentsSlice';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert as AlertComponent, AlertDescription } from '../../components/ui/alert';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export default function AddTalentScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { user } = useAppSelector((state) => state.auth);
  const { isLoading, error } = useAppSelector((state) => state.talents);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

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
      const newFiles = result.assets.map((asset, index) => {
        // Determine file extension from URI or MIME type
        let extension = 'jpg';
        if (asset.type === 'video') {
          extension = asset.uri.includes('.mov') ? 'mov' : 
                     asset.uri.includes('.mp4') ? 'mp4' : 'mp4';
        } else {
          extension = asset.uri.includes('.png') ? 'png' :
                     asset.uri.includes('.gif') ? 'gif' :
                     asset.uri.includes('.webp') ? 'webp' : 'jpg';
        }
        
        const fileName = asset.fileName || 
                        (asset.type === 'video' ? `video_${Date.now()}_${index}.${extension}` : 
                         `image_${Date.now()}_${index}.${extension}`);
        
        return {
        uri: asset.uri,
        type: asset.type || 'image',
          name: fileName,
        };
      });
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

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
      await dispatch(addTalent({
        studentId: user?.studentId!,
        talentData: formData,
        files: selectedFiles,
      })).unwrap();
      
      // Refresh the talents list to ensure latest data
      await dispatch(fetchAllTalents());
      
      showToast('Talent added successfully!', 'success', {
        text: 'OK',
        onPress: () => navigation.goBack()
      });
    } catch (error) {
      showToast('Failed to add talent. Please try again.', 'error');
    }
  };

  const getFileIcon = (file: any) => {
    if (file.type === 'video') return '🎥';
    if (file.type === 'document') return '📄';
    return '🖼️';
  };

  return (
    <ScrollView style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#8F1A27" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Talent</Text>
        <View style={styles.placeholder} />
      </View> */}

      {error && (
        <AlertComponent variant="destructive" style={styles.errorAlert}>
          <AlertDescription>{error}</AlertDescription>
        </AlertComponent>
      )}

      <Card style={styles.formCard}>
        <CardHeader>
          <CardTitle>Talent Information</CardTitle>
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

          {/* File Upload */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Media Files (Optional)</Text>
            <Text style={styles.subLabel}>Add images, videos, or documents to showcase your talent</Text>
            
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="image" size={20} color="#8F1A27" />
                <Text style={styles.uploadButtonText}>Add Images/Videos</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                <Ionicons name="document-text" size={20} color="#8F1A27" />
                <Text style={styles.uploadButtonText}>Add Documents</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <View style={styles.filesContainer}>
                <Text style={styles.filesTitle}>Selected Files:</Text>
                {selectedFiles.map((file, index) => (
                  <View key={index} style={styles.fileItem}>
                    <Text style={styles.fileIcon}>{getFileIcon(file)}</Text>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeFileButton}
                      onPress={() => removeFile(index)}
                    >
                      <Ionicons name="close-circle" size={16} color="#dc2626" />
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
            <Ionicons name="refresh" size={20} color="white" />
          ) : (
            <Ionicons name="add-circle" size={20} color="white" />
          )}
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Adding Talent...' : 'Add Talent'}
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
    // padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 10,
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
    marginBottom: 30,
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