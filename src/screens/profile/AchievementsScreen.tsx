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
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { showToast } from '../../components/ui/toast';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { fetchStudentProfile, addAchievement, updateAchievement, deleteAchievement } from '../../store/slices/studentsSlice';
import { Ionicons } from '@expo/vector-icons';
import { Achievement } from '../../types';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

const AchievementsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAppSelector(state => state.auth);
  const { profile: student, isLoading } = useAppSelector(state => state.students);
  
  // Modal states
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  
  // Edit states
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  
  // Form states
  const [achievementForm, setAchievementForm] = useState({
    title: '',
    description: '',
    date: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'student') {
      dispatch(fetchStudentProfile());
    }
  }, [dispatch, user?.role]);

  const handleSaveAchievement = async () => {
    if (!achievementForm.title.trim()) {
      showToast('Achievement title cannot be empty.', 'error');
      return;
    }

    try {
      if (editingAchievement) {
        await dispatch(updateAchievement({
          id: editingAchievement.id,
          title: achievementForm.title,
          description: achievementForm.description,
          date: achievementForm.date,
        })).unwrap();
        showToast('Achievement updated successfully!', 'success');
      } else {
        await dispatch(addAchievement({
          achievementData: {
            title: achievementForm.title,
            description: achievementForm.description,
            date: achievementForm.date,
          },
          files: selectedFiles
        })).unwrap();
        showToast('Achievement added successfully!', 'success');
      }
      setShowAchievementModal(false);
      setEditingAchievement(null);
      setAchievementForm({ title: '', description: '', date: '' });
      setSelectedFiles([]);
    } catch (error: any) {
      showToast(error.message || 'Failed to save achievement', 'error');
    }
  };

  const handleDeleteAchievement = (achievement: Achievement) => {
    showToast(
      'Are you sure you want to delete this achievement?',
      'warning',
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await dispatch(deleteAchievement(achievement.id)).unwrap();
            showToast('Achievement deleted successfully!', 'success');
          } catch (error: any) {
            showToast(error.message || 'Failed to delete achievement', 'error');
          }
        },
      }
    );
  };

  const handleEditAchievement = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setAchievementForm({
      title: achievement.title,
      description: achievement.description,
      date: achievement.date || '',
    });
    setSelectedFiles([]);
    setShowAchievementModal(true);
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
        <View style={styles.addButtonContainerLeft}>
          <Text style={styles.text}> Manage your achievements </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAchievementModal(true)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
          
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsContainer}>
          {student?.achievements && student.achievements.length > 0 ? (
            student.achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementCard}>
                <View style={styles.achievementCardHeader}>
                  <View style={styles.achievementCardTitle}>
                    <Text style={styles.achievementTitle} numberOfLines={2}>{achievement.title}</Text>
                    {achievement.date && (
                      <Text style={styles.achievementDate}>{achievement.date}</Text>
                    )}
                  </View>
                  <View style={styles.achievementActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditAchievement(achievement)}
                    >
                      <Ionicons name="create" size={16} color="#6A0032" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteAchievement(achievement)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.achievementDescription} numberOfLines={3}>{achievement.description}</Text>
                {achievement.date && (
                  <View style={styles.achievementDateDisplay}>
                    <Ionicons name="calendar" size={14} color="#6B7280" />
                    <Text style={styles.filesLabel}>{achievement.date}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="trophy-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No achievements added yet</Text>
              <Text style={styles.emptySubtext}>Highlight your accomplishments</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Achievement Modal */}
      <Modal
        visible={showAchievementModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAchievementModal(false)}
      >
        <SafeAreaView style={styles.modalContent}>
          <StatusBar barStyle="dark-content" />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAchievement ? 'Edit Achievement' : 'Add New Achievement'}
              </Text>
              <TouchableOpacity onPress={() => setShowAchievementModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={achievementForm.title}
                  onChangeText={(text) => setAchievementForm({ ...achievementForm, title: text })}
                  placeholder="Enter achievement title"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={achievementForm.description}
                  onChangeText={(text) => setAchievementForm({ ...achievementForm, description: text })}
                  placeholder="Enter achievement description"
                  multiline
                  numberOfLines={4}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={achievementForm.date}
                  onChangeText={(text) => setAchievementForm({ ...achievementForm, date: text })}
                  placeholder="Enter achievement date (e.g., 2023-10-27)"
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
                onPress={() => setShowAchievementModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveAchievement}
              >
                <Text style={styles.saveButtonText}>Save Achievement</Text>
              </TouchableOpacity>
            </View>
        </SafeAreaView>
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
    marginBottom: 10,
    // backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',

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
  cardsContainer: {
    gap: 6,
    marginTop: 10,
  },
  achievementCard: {
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
  achievementCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  achievementCardTitle: {
    flex: 1,
    marginRight: 16,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  achievementActions: {
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
  achievementDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  achievementDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  achievementFiles: {
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
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    flex: 1,
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 28 : 20,
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

export default AchievementsScreen;
