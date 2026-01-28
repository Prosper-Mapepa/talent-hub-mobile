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
import { fetchStudentProfile, addSkill, updateSkill, deleteSkill } from '../../store/slices/studentsSlice';
import { Ionicons } from '@expo/vector-icons';
import { Skill } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';

const SkillsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAppSelector(state => state.auth);
  const { profile: student, isLoading } = useAppSelector(state => state.students);
  
  // Modal states
  const [showSkillModal, setShowSkillModal] = useState(false);
  
  // Edit states
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  
  // Form states
  const [skillForm, setSkillForm] = useState({
    name: '',
    proficiency: 'BEGINNER',
    category: '',
  });

  const skillProficiencies = [
    'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'
  ];

  useEffect(() => {
    if (user?.role === 'student') {
      dispatch(fetchStudentProfile());
    }
  }, [dispatch, user?.role]);

  const handleSaveSkill = async () => {
    if (!skillForm.name.trim()) {
      showToast('Skill name cannot be empty.', 'error');
      return;
    }

    try {
      if (editingSkill) {
        // Backend only supports updating proficiency, not other fields
        await dispatch(updateSkill({
          id: editingSkill.id,
          name: editingSkill.name, // Keep original name
          proficiency: skillForm.proficiency,
          category: editingSkill.category || '', // Keep original category
        })).unwrap();
        showToast('Skill proficiency updated successfully!', 'success');
      } else {
        await dispatch(addSkill({
          name: skillForm.name,
          proficiency: skillForm.proficiency,
          category: skillForm.category,
        })).unwrap();
        showToast('Skill added successfully!', 'success');
      }
      setShowSkillModal(false);
      setEditingSkill(null);
      setSkillForm({ name: '', proficiency: 'BEGINNER', category: '' });
    } catch (error: any) {
      showToast(error.message || 'Failed to save skill', 'error');
    }
  };

  const handleDeleteSkill = (skill: Skill) => {
    showToast(
      'Are you sure you want to delete this skill?',
      'warning',
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await dispatch(deleteSkill(skill.id)).unwrap();
            showToast('Skill deleted successfully!', 'success');
          } catch (error: any) {
            showToast(error.message || 'Failed to delete skill', 'error');
          }
        },
      }
    );
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setSkillForm({
      name: skill.name,
      proficiency: skill.proficiency,
      category: skill.category || '',
    });
    setShowSkillModal(true);
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
          <Text style={styles.text}> Manage your skills </Text>
          <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowSkillModal(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          {/* <Text style={styles.addButtonText}>Add Skill</Text>  */}
        </TouchableOpacity>
        </View>
       
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsContainer}>
          {student?.skills && student.skills.length > 0 ? (
            student.skills.map((skill, index) => (
              <View key={index} style={styles.skillCard}>
                <View style={styles.skillCardHeader}>
                  <View style={styles.skillCardTitle}>
                    <Text style={styles.skillName} numberOfLines={2}>{skill.name}</Text>
                    {skill.category && (
                      <Text style={styles.skillCategory}>{skill.category}</Text>
                    )}
                  </View>
                  <View style={styles.skillActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditSkill(skill)}
                    >
                      <Ionicons name="create" size={16} color="#6A0032" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteSkill(skill)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.skillProficiency}>
                  <Text style={styles.proficiencyLabel}>Proficiency:</Text>
                  <View style={styles.proficiencyBadge}>
                    <Text style={styles.proficiencyText}>{skill.proficiency}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="code-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No skills added yet</Text>
              <Text style={styles.emptySubtext}>Add your technical and soft skills</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Skill Modal */}
      <Modal
        visible={showSkillModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowSkillModal(false)}
      >
        <SafeAreaView style={styles.modalContent}>
          <StatusBar barStyle="dark-content" />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSkill ? 'Edit Skill' : 'Add New Skill'}
              </Text>
              <TouchableOpacity onPress={() => setShowSkillModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={skillForm.name}
                  onChangeText={(text) => setSkillForm({ ...skillForm, name: text })}
                  placeholder="Enter skill name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Proficiency</Text>
                <View style={styles.proficiencyPicker}>
                  {skillProficiencies.map((proficiency) => (
                    <TouchableOpacity
                      key={proficiency}
                      style={[
                        styles.proficiencyButton,
                        skillForm.proficiency === proficiency && styles.selectedProficiencyButton,
                      ]}
                      onPress={() => setSkillForm({ ...skillForm, proficiency: proficiency })}
                    >
                      <Text
                        style={[
                          styles.proficiencyButtonText,
                          skillForm.proficiency === proficiency && styles.selectedProficiencyButtonText,
                        ]}
                      >
                        {proficiency}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={skillForm.category}
                  onChangeText={(text) => setSkillForm({ ...skillForm, category: text })}
                  placeholder="Enter skill category"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSkillModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveSkill}
              >
                <Text style={styles.saveButtonText}>Save Skill</Text>
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
  addButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
    paddingBottom: 25,
    // backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  addButtonContainerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
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
    gap: 0,
    // marginBottom: 50,
    marginTop: 10,
  },
  skillCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 100,
  },
  skillCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  skillCardTitle: {
    flex: 1,
    marginRight: 16,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  skillActions: {
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
  proficiencyBadge: {
    backgroundColor: '#FEBF17',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  proficiencyText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
  skillCategory: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  skillProficiency: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  proficiencyLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginRight: 8,
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
  proficiencyPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  proficiencyButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 5,
    marginVertical: 5,
  },
  selectedProficiencyButton: {
    backgroundColor: '#6A0032',
    borderColor: '#6A0032',
  },
  proficiencyButtonText: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedProficiencyButtonText: {
    color: '#FFFFFF',
  },
});

export default SkillsScreen;
