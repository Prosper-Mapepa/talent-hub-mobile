import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { fetchStudentTalents, addTalent, updateTalent, deleteTalent } from '../../store/slices/talentsSlice';
import { Ionicons } from '@expo/vector-icons';
import { Talent } from '../../types';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const TalentsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAppSelector(state => state.auth);
  const { talents, isLoading } = useAppSelector(state => state.talents);
  
  // Modal states
  const [showTalentModal, setShowTalentModal] = useState(false);
  
  // Edit states
  const [editingTalent, setEditingTalent] = useState<Talent | null>(null);
  
  // Form states
  const [talentForm, setTalentForm] = useState({
    title: '',
    category: '',
    description: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

  const talentCategories = [
    'Artwork', 'STEM', 'Creative', 'Academic', 'Technology',
    'Business', 'Health', 'Education', 'Entertainment', 'Other'
  ];

  useEffect(() => {
    if (user?.studentId) {
      dispatch(fetchStudentTalents(user.studentId));
    }
  }, [dispatch, user?.studentId]);

  const handleSaveTalent = async () => {
    if (!talentForm.title.trim() || !talentForm.category.trim() || !talentForm.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (editingTalent) {
        await dispatch(updateTalent({
          studentId: editingTalent.studentId,
          talentId: editingTalent.id,
          talentData: talentForm,
          files: selectedFiles,
        })).unwrap();
        Alert.alert('Success', 'Talent updated successfully!');
      } else {
        await dispatch(addTalent({
          studentId: user?.studentId!,
          talentData: talentForm,
          files: selectedFiles,
        })).unwrap();
        Alert.alert('Success', 'Talent added successfully!');
      }
      setShowTalentModal(false);
      setEditingTalent(null);
      setTalentForm({ title: '', category: '', description: '' });
      setSelectedFiles([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save talent');
    }
  };

  const handleDeleteTalent = (talent: Talent) => {
    Alert.alert(
      'Delete Talent',
      'Are you sure you want to delete this talent?',
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
              Alert.alert('Success', 'Talent deleted successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete talent');
            }
          },
        },
      ]
    );
  };

  const handleEditTalent = (talent: Talent) => {
    setEditingTalent(talent);
    setTalentForm({
      title: talent.title,
      category: talent.category,
      description: talent.description,
    });
    setSelectedFiles([]);
    setShowTalentModal(true);
  };

  const pickFiles = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newFiles = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type || 'image',
        name: asset.fileName || `file_${Date.now()}`,
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A0032" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#8F1A27', '#6A0032', '#8F1A27']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Talents</Text>
            <Text style={styles.subtitle}>Showcase your unique skills and abilities</Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              setEditingTalent(null);
              setTalentForm({ title: '', category: '', description: '' });
              setSelectedFiles([]);
              setShowTalentModal(true);
            }}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsContainer}>
          {talents && talents.length > 0 ? (
            talents.map((talent, index) => (
              <View key={index} style={styles.talentCard}>
                <View style={styles.talentCardHeader}>
                  <View style={styles.talentCardTitle}>
                    <Text style={styles.talentTitle}>{talent.title}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{talent.category}</Text>
                    </View>
                  </View>
                  <View style={styles.talentActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditTalent(talent)}
                    >
                      <Ionicons name="create" size={16} color="#6A0032" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteTalent(talent)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.talentDescription}>{talent.description}</Text>
                {talent.files && talent.files.length > 0 && (
                  <View style={styles.talentFiles}>
                    <Ionicons name="document" size={14} color="#6B7280" />
                    <Text style={styles.filesLabel}>{talent.files.length} files</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="star-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No talents added yet</Text>
              <Text style={styles.emptySubtext}>Showcase your unique skills and abilities</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Talent Modal */}
      <Modal
        visible={showTalentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTalentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTalent ? 'Edit Talent' : 'Add New Talent'}
              </Text>
              <TouchableOpacity onPress={() => setShowTalentModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={talentForm.title}
                  onChangeText={(text) => setTalentForm({ ...talentForm, title: text })}
                  placeholder="Enter talent title"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={talentForm.category}
                  onChangeText={(text) => setTalentForm({ ...talentForm, category: text })}
                  placeholder="Enter talent category"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={talentForm.description}
                  onChangeText={(text) => setTalentForm({ ...talentForm, description: text })}
                  placeholder="Enter talent description"
                  multiline
                  numberOfLines={4}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Files (optional)</Text>
                <TouchableOpacity
                  style={styles.fileInput}
                  onPress={pickFiles}
                >
                  <Ionicons name="folder" size={20} color="#6B7280" />
                  <Text style={styles.fileInputText}>
                    {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Choose files'}
                  </Text>
                </TouchableOpacity>
                {selectedFiles.length > 0 && (
                  <View style={styles.selectedFilesList}>
                    {selectedFiles.map((file, index) => (
                      <View key={index} style={styles.selectedFileItem}>
                        <Text style={styles.selectedFileName}>{file.name}</Text>
                        <TouchableOpacity onPress={() => removeFile(index)}>
                          <Ionicons name="close" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTalentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveTalent}
              >
                <Text style={styles.saveButtonText}>Save Talent</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
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
    marginTop: 0,
    opacity: 0.9,
  },
  headerButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cardsContainer: {
    gap: 16,
  },
  talentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  talentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  talentCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  talentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  talentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  talentDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  talentFiles: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  filesLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6A0032',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  fileInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  fileInputText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  selectedFilesList: {
    marginTop: 8,
    paddingLeft: 12,
  },
  selectedFileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  selectedFileName: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
});

export default TalentsScreen;
