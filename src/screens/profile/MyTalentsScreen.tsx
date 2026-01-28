import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { showToast } from '../../components/ui/toast';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { fetchStudentTalents, deleteTalent } from '../../store/slices/talentsSlice';
import { Ionicons } from '@expo/vector-icons';
import { Talent } from '../../types';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types';

const { width } = Dimensions.get('window');

type ProfileNav = StackNavigationProp<RootStackParamList>;

const MyTalentsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<ProfileNav>();
  const { user } = useAppSelector(state => state.auth);
  const { talents, isLoading } = useAppSelector(state => state.talents);
  
  // Legacy modal state no longer used (kept only to avoid larger refactor)
  // const [showTalentModal, setShowTalentModal] = useState(false);

  useEffect(() => {
    if (user?.studentId) {
      dispatch(fetchStudentTalents(user.studentId));
    }
  }, [dispatch, user?.studentId]);

  // All add/edit operations are delegated to AddTalentScreen/EditTalentScreen now.

  const handleDeleteTalent = (talent: Talent) => {
    showToast(
      'Are you sure you want to delete this talent?',
      'warning',
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await dispatch(deleteTalent({
              studentId: talent.studentId,
              talentId: talent.id,
            })).unwrap();
            showToast('Talent deleted successfully!', 'success');
          } catch (error: any) {
            console.error('Error deleting talent:', error);
            const errorMessage = error.message || 'Failed to delete talent';
            showToast(errorMessage, 'error');
          }
        },
      }
    );
  };

  const handleEditTalent = (talent: Talent) => {
    // Reuse the dedicated EditTalent screen to avoid modal/layout issues.
    navigation.navigate('EditTalent', { talent } as any);
  };

  // All file picking & editing logic now lives in AddTalent/EditTalent screens.

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
          onPress={() => navigation.navigate('AddTalent' as never)}
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
                  onPress={() => navigation.navigate('AddTalent' as never)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addFirstButtonText}>Add Your First Talent</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Talent editing/creation now reuses AddTalent and EditTalent screens via navigation,
          so the in-place modal has been removed to avoid platform-specific modal glitches. */}
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
  text: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',

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
  subLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: -2,
    marginBottom: 10,
  },
  suggestionsContainer: {
    marginTop: 10,
  },
  suggestionButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
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

  // Existing files (Edit mode) - match Talents edit layout
  filesList: {
    gap: 8,
    marginTop: 8,
  },
  fileRow: {
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
  fileRowName: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  fileDeleteButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default MyTalentsScreen;
