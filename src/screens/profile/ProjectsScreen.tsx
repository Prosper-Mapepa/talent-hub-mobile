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
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { fetchStudentProfile, addProject, updateProject, deleteProject } from '../../store/slices/studentsSlice';
import { Ionicons } from '@expo/vector-icons';
import { Project } from '../../types';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

const ProjectsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAppSelector(state => state.auth);
  const { profile: student, isLoading } = useAppSelector(state => state.students);
  
  // Modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  
  // Edit states
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Form states
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    technologies: '',
    githubUrl: '',
    liveUrl: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'student') {
      dispatch(fetchStudentProfile());
    }
  }, [dispatch, user?.role]);

  const handleSaveProject = async () => {
    if (!projectForm.title.trim()) {
      Alert.alert('Error', 'Project title cannot be empty.');
      return;
    }

    try {
      const technologies = projectForm.technologies.split(',').map(tech => tech.trim()).filter(tech => tech);
      
      if (editingProject) {
        await dispatch(updateProject({
          id: editingProject.id,
          title: projectForm.title,
          description: projectForm.description,
          technologies,
          githubUrl: projectForm.githubUrl || undefined,
          liveUrl: projectForm.liveUrl || undefined,
        })).unwrap();
        Alert.alert('Success', 'Project updated successfully!');
      } else {
        await dispatch(addProject({
          projectData: {
            title: projectForm.title,
            description: projectForm.description,
            technologies,
            githubUrl: projectForm.githubUrl || undefined,
            liveUrl: projectForm.liveUrl || undefined,
          },
          files: selectedFiles
        })).unwrap();
        Alert.alert('Success', 'Project added successfully!');
      }
      setShowProjectModal(false);
      setEditingProject(null);
      setProjectForm({ title: '', description: '', technologies: '', githubUrl: '', liveUrl: '' });
      setSelectedFiles([]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save project');
    }
  };

  const handleDeleteProject = (project: Project) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteProject(project.id)).unwrap();
              Alert.alert('Success', 'Project deleted successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      technologies: Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies || '',
      githubUrl: project.githubUrl || '',
      liveUrl: project.liveUrl || '',
    });
    setSelectedFiles([]);
    setShowProjectModal(true);
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
          <Text style={styles.text}> Manage your projects </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowProjectModal(true)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsContainer}>
          {student?.projects && student.projects.length > 0 ? (
            student.projects.map((project, index) => (
              <View key={index} style={styles.projectCard}>
                <View style={styles.projectCardHeader}>
                  <View style={styles.projectCardTitle}>
                    <Text style={styles.projectTitle} numberOfLines={2}>{project.title}</Text>
                    {project.technologies && project.technologies.length > 0 && (
                      <View style={styles.technologiesContainer}>
                        {project.technologies.slice(0, 3).map((tech, techIndex) => (
                          <View key={techIndex} style={styles.techTag}>
                            <Text style={styles.techText}>{tech}</Text>
                          </View>
                        ))}
                        {project.technologies.length > 3 && (
                          <Text style={styles.moreTechs}>+{project.technologies.length - 3} more</Text>
                        )}
                      </View>
                    )}
                  </View>
                  <View style={styles.projectActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditProject(project)}
                    >
                      <Ionicons name="create" size={16} color="#6A0032" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteProject(project)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.projectDescription} numberOfLines={3}>{project.description}</Text>
                {(project.githubUrl || project.liveUrl) && (
                  <View style={styles.projectLinks}>
                    {project.githubUrl && (
                      <TouchableOpacity style={styles.linkButton}>
                        <Ionicons name="logo-github" size={16} color="#6B7280" />
                        <Text style={styles.linkText}>GitHub</Text>
                      </TouchableOpacity>
                    )}
                    {project.liveUrl && (
                      <TouchableOpacity style={styles.linkButton}>
                        <Ionicons name="globe" size={16} color="#6B7280" />
                        <Text style={styles.linkText}>Live Demo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="folder-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No projects added yet</Text>
              <Text style={styles.emptySubtext}>Showcase your work and achievements</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Project Modal */}
      <Modal
        visible={showProjectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </Text>
              <TouchableOpacity onPress={() => setShowProjectModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={projectForm.title}
                  onChangeText={(text) => setProjectForm({ ...projectForm, title: text })}
                  placeholder="Enter project title"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={projectForm.description}
                  onChangeText={(text) => setProjectForm({ ...projectForm, description: text })}
                  placeholder="Enter project description"
                  multiline
                  numberOfLines={4}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Technologies (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={projectForm.technologies}
                  onChangeText={(text) => setProjectForm({ ...projectForm, technologies: text })}
                  placeholder="e.g., React Native, Node.js, MongoDB"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GitHub URL (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={projectForm.githubUrl}
                  onChangeText={(text) => setProjectForm({ ...projectForm, githubUrl: text })}
                  placeholder="Enter GitHub URL"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Live URL (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={projectForm.liveUrl}
                  onChangeText={(text) => setProjectForm({ ...projectForm, liveUrl: text })}
                  placeholder="Enter Live URL"
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
                onPress={() => setShowProjectModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProject}
              >
                <Text style={styles.saveButtonText}>Save Project</Text>
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
    gap:6,
  },
  projectCard: {
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
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectCardTitle: {
    flex: 1,
    marginRight: 16,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  projectActions: {
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
  projectDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  projectTechnologies: {
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
  projectLinks: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 4,
  },
  linkText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
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
  technologiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  techTag: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  techText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  moreTechs: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default ProjectsScreen;
