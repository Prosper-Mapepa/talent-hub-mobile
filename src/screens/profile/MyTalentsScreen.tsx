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

const MyTalentsScreen: React.FC = () => {
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
    } catch (error: any) {
      console.error('Error saving talent:', error);
      const errorMessage = error.message || 'Failed to save talent';
      Alert.alert('Error', errorMessage);
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
            } catch (error: any) {
              console.error('Error deleting talent:', error);
              const errorMessage = error.message || 'Failed to delete talent';
              Alert.alert('Error', errorMessage);
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
      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <View style={styles.addButtonContainerLeft}><Text style={styles.text}> Manage your talents </Text><TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingTalent(null);
            setTalentForm({ title: '', category: '', description: '' });
            setSelectedFiles([]);
            setShowTalentModal(true);
          }}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          {/* <Text style={styles.addButtonText}>Add Talent</Text> */}
        </TouchableOpacity></View>
      
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        {/* <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={24} color="#6A0032" />
            <Text style={styles.statNumber}>{talents?.length || 0}</Text>
            <Text style={styles.statLabel}>Total Talents</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="folder" size={24} color="#6A0032" />
            <Text style={styles.statNumber}>
              {talents?.filter(t => t.files && t.files.length > 0).length || 0}
            </Text>
            <Text style={styles.statLabel}>With Files</Text>
          </View>
        </View> */}

        {/* Talents List */}
        <View style={styles.talentsSection}>
          {/* <Text style={styles.sectionTitle}>Your Talents</Text> */}
          <View style={styles.cardsContainer}>
            {talents && talents.length > 0 ? (
              talents.map((talent, index) => (
                <View key={index} style={styles.talentCard}>
                  <View style={styles.talentCardHeader}>
                    <View style={styles.talentCardTitle}>
                      <Text style={styles.talentTitle} numberOfLines={2}>{talent.title}</Text>
                      <View style={styles.talentCategory}>
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
                  <Text style={styles.talentDescription} numberOfLines={3}>{talent.description}</Text>
                  {talent.files && talent.files.length > 0 && (
                    <View style={styles.talentFiles}>
                      <Ionicons name="images" size={14} color="#6B7280" />
                      <Text style={styles.filesLabel}>{talent.files.length} files</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="star-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No talents added yet</Text>
                <Text style={styles.emptySubtext}>Start building your portfolio by adding your first talent</Text>
                <TouchableOpacity
                  style={styles.addFirstButton}
                  onPress={() => {
                    setEditingTalent(null);
                    setTalentForm({ title: '', category: '', description: '' });
                    setSelectedFiles([]);
                    setShowTalentModal(true);
                  }}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addFirstButtonText}>Add Your First Talent</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={talentForm.title}
                  onChangeText={(text) => setTalentForm({ ...talentForm, title: text })}
                  placeholder="Enter talent title"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category *</Text>
                <View style={styles.categoryPicker}>
                  {talentCategories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        talentForm.category === category && styles.selectedCategoryButton,
                      ]}
                      onPress={() => setTalentForm({ ...talentForm, category: category })}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          talentForm.category === category && styles.selectedCategoryButtonText,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={talentForm.description}
                  onChangeText={(text) => setTalentForm({ ...talentForm, description: text })}
                  placeholder="Describe your talent in detail..."
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
                    {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Choose files to showcase your talent'}
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
                <Text style={styles.saveButtonText}>
                  {editingTalent ? 'Update Talent' : 'Save Talent'}
                </Text>
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
  addButtonContainerLeft: {

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  addButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
    paddingBottom: 25,
    // backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A0032',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
    marginBottom: 50,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6A0032',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  talentsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  cardsContainer: {
    gap: 6,
    marginTop: 16,
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
    minHeight: 120,
  },
  talentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  talentCardTitle: {
    flex: 1,
    marginRight: 16,
  },
  talentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  talentCategory: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  talentActions: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 8,
  },
  filesLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  talentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  talentDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  addFirstButton: {
    backgroundColor: '#6A0032',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    gap: 8,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(117, 12, 12, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',

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
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectedCategoryButton: {
    backgroundColor: '#6A0032',
    borderColor: '#6A0032',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
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

export default MyTalentsScreen;
