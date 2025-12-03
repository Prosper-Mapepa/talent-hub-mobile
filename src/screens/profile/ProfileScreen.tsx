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
  Switch,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { fetchStudentProfile, updateStudentProfile } from '../../store/slices/studentsSlice';
import { fetchBusinessProfile, updateBusinessProfile } from '../../store/slices/businessesSlice';
import { fetchStudentTalents } from '../../store/slices/talentsSlice';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAppSelector(state => state.auth);
  const { profile: student, isLoading: studentLoading } = useAppSelector(state => state.students);
  const { profile: business, isLoading: businessLoading } = useAppSelector(state => state.businesses);
  const { talents, isLoading: talentsLoading } = useAppSelector(state => state.talents);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    major: '',
    year: '',
    bio: '',
    businessName: '',
    businessType: '',
    location: '',
    description: '',
  });

  useEffect(() => {
    if (user?.role === UserRole.STUDENT) {
      dispatch(fetchStudentProfile());
      if (user?.studentId) {
        dispatch(fetchStudentTalents(user.studentId));
      }
    } else if (user?.role === UserRole.BUSINESS) {
      dispatch(fetchBusinessProfile());
    }
  }, [dispatch, user?.role, user?.studentId]);

  useEffect(() => {
    if (student) {
      setEditForm({
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.user?.email || user?.email || '',
        major: student.major || '',
        year: student.year || student.graduationYear?.toString() || '',
        bio: student.bio || '',
        businessName: '',
        businessType: '',
        location: '',
        description: '',
      });
    } else if (business) {
      setEditForm({
        firstName: '',
        lastName: '',
        email: user?.email || '',
        major: '',
        year: '',
        bio: '',
        businessName: business.businessName || '',
        businessType: business.businessType || '',
        location: business.location || '',
        description: business.description || '',
      });
    }
  }, [student, business, user]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) },
      ]
    );
  };

  const handleSaveProfile = async () => {
    try {
      if (user?.role === UserRole.STUDENT) {
        await dispatch(updateStudentProfile({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          major: editForm.major as any,
          graduationYear: parseInt(editForm.year) || 0,
          bio: editForm.bio,
        })).unwrap();
        Alert.alert('Success', 'Profile updated successfully!');
      } else if (user?.role === UserRole.BUSINESS) {
        await dispatch(updateBusinessProfile({
          businessName: editForm.businessName,
          businessType: editForm.businessType as any,
          location: editForm.location,
          description: editForm.description,
        })).unwrap();
        Alert.alert('Success', 'Profile updated successfully!');
      }
      setShowEditModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };



  const isLoading = studentLoading || businessLoading || talentsLoading;

  const renderStudentProfile = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Welcome Section */}
      {/* <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
                {student?.firstName && student?.lastName
                  ? `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`
                  : user?.email?.charAt(0) || '?'
                }
            </Text>
          </View>
            <View style={styles.welcomeInfo}>
              <Text style={styles.welcomeTitle}>Welcome back!</Text>
              <Text style={styles.welcomeName}>
              {student?.firstName && student?.lastName
                ? `${student.firstName} ${student.lastName}`
                  : 'Student'
              }
            </Text>
              <Text style={styles.welcomeSubtitle}>Manage your portfolio and showcase your talents</Text>
            </View>
          </View>
        </View>
      </View> */}

      {/* Quick Stats */}
      {/* <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
        <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="star" size={20} color="#6A0032" />
            </View>
          <Text style={styles.statNumber}>{talents?.length || 0}</Text>
          <Text style={styles.statLabel}>Talents</Text>
        </View>
        <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="code" size={20} color="#6A0032" />
            </View>
          <Text style={styles.statNumber}>{student?.skills?.length || 0}</Text>
          <Text style={styles.statLabel}>Skills</Text>
        </View>
        <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="folder" size={20} color="#6A0032" />
            </View>
          <Text style={styles.statNumber}>{student?.projects?.length || 0}</Text>
          <Text style={styles.statLabel}>Projects</Text>
        </View>
        <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="trophy" size={20} color="#6A0032" />
            </View>
          <Text style={styles.statNumber}>{student?.achievements?.length || 0}</Text>
          <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>
      </View> */}

      {/* Bio Section */}
      {student?.bio && (
        <View style={styles.bioSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#6A0032" />
            <Text style={styles.sectionTitle}>About Me</Text>
          </View>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{student.bio}</Text>
          </View>
        </View>
      )}

      {/* Portfolio Navigation */}
      <View style={styles.portfolioSection}>
          <View style={styles.sectionHeader}>
          <Ionicons name="briefcase" size={20} color="#6A0032" />
          <Text style={styles.sectionTitle}>Portfolio</Text>
          <Text style={styles.sectionSubtitle}>Manage your professional showcase</Text>
            </View> 
        
        {/* Navigation Cards */}
        <View style={styles.navigationCards}>
          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('MyTalents')}>
            <View style={styles.navCardContent}>
              <View style={styles.navCardIconContainer}>
                <Ionicons name="star" size={24} color="#6A0032" />
          </View>
              <View style={styles.navCardText}>
                <Text style={styles.navCardTitle}>My Talents</Text>
                <Text style={styles.navCardSubtitle}>{talents?.length || 0} talents • Showcase your skills</Text>
                      </View>
                    </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                      </TouchableOpacity>

          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('Skills')}>
            <View style={styles.navCardContent}>
              <View style={styles.navCardIconContainer}>
                <Ionicons name="code" size={24} color="#6A0032" />
            </View>
              <View style={styles.navCardText}>
                <Text style={styles.navCardTitle}>Skills</Text>
                <Text style={styles.navCardSubtitle}>{student?.skills?.length || 0} skills • Technical expertise</Text>
          </View>
                      </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                      </TouchableOpacity>

          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('Projects')}>
            <View style={styles.navCardContent}>
              <View style={styles.navCardIconContainer}>
                <Ionicons name="folder" size={24} color="#6A0032" />
            </View>
              <View style={styles.navCardText}>
                <Text style={styles.navCardTitle}>Projects</Text>
                <Text style={styles.navCardSubtitle}>{student?.projects?.length || 0} projects • Your work portfolio</Text>
          </View>
                    </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                      </TouchableOpacity>

          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('Achievements')}>
            <View style={styles.navCardContent}>
              <View style={styles.navCardIconContainer}>
                <Ionicons name="trophy" size={24} color="#6A0032" />
            </View>
              <View style={styles.navCardText}>
                <Text style={styles.navCardTitle}>Achievements</Text>
                <Text style={styles.navCardSubtitle}>{student?.achievements?.length || 0} achievements • Awards & recognition</Text>
          </View>
                    </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                      </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderBusinessProfile = () => (
    <ScrollView style={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {business?.businessName?.charAt(0) || user?.email?.charAt(0) || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{business?.businessName || 'Business'}</Text>
        <Text style={styles.role}>Business</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="business" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Business Name:</Text>
            <Text style={styles.infoValue}>{business?.businessName || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Business Type:</Text>
            <Text style={styles.infoValue}>{business?.businessType || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{business?.location || 'Not set'}</Text>
          </View>
        </View>
      </View>

      {business?.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.infoCard}>
            <Text style={styles.bioText}>{business.description}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Postings</Text>
        <View style={styles.infoCard}>
          {business?.jobs && business.jobs.length > 0 ? (
            business.jobs.map((job, index) => (
              <View key={index} style={styles.jobItem}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobType}>{job.type.replace('_', ' ')}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No job postings yet</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEditModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {user?.role === UserRole.STUDENT ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.firstName}
                    onChangeText={(text) => setEditForm({ ...editForm, firstName: text })}
                    placeholder="Enter first name"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.lastName}
                    onChangeText={(text) => setEditForm({ ...editForm, lastName: text })}
                    placeholder="Enter last name"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Major</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.major}
                    onChangeText={(text) => setEditForm({ ...editForm, major: text })}
                    placeholder="Enter major"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Year</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.year}
                    onChangeText={(text) => setEditForm({ ...editForm, year: text })}
                    placeholder="Enter year"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bio</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editForm.bio}
                    onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
                    placeholder="Enter bio"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Business Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.businessName}
                    onChangeText={(text) => setEditForm({ ...editForm, businessName: text })}
                    placeholder="Enter business name"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Business Type</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.businessType}
                    onChangeText={(text) => setEditForm({ ...editForm, businessType: text })}
                    placeholder="Enter business type"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.location}
                    onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                    placeholder="Enter location"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editForm.description}
                    onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                    placeholder="Enter description"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );





  

  

  return (
    <View style={styles.container}>
      {/* Header with Action Icons */}
      <LinearGradient
        colors={['#8F1A27', '#6A0032', '#8F1A27']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>
              {user?.role === UserRole.STUDENT && student?.firstName && student?.lastName
                ? `${student.firstName} ${student.lastName}`
                : user?.role === UserRole.BUSINESS && business?.businessName
                ? business.businessName
                : 'Profile'
              }
            </Text>
            <Text style={styles.subtitle}>Manage your account</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="create" size={20} color="#6A0032" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Profile Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0032" />
        </View>
      ) : user?.role === UserRole.STUDENT ? (
        renderStudentProfile()
      ) : user?.role === UserRole.BUSINESS ? (
        renderBusinessProfile()
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#6B7280" />
          <Text style={styles.emptyText}>Profile not available</Text>
        </View>
      )}

      {renderEditModal()}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  
  profileInfo: {
    marginLeft: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#6B7280',
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 12,
  },
  
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#6A0032',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  cardsContainer: {
    gap: 6,
    // marginTop: 10,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  bioText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  skillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  skillLevel: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  projectItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  jobItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  jobType: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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

  // Welcome Section
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#6A0032',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Stats Section
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Bio Section
  bioSection: {
    marginBottom: 24,
  },
  bioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  // Portfolio Section
  portfolioSection: {
    marginBottom: 24,
  },
  portfolioTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navigationCards: {
    gap: 6,
    marginTop: 15,
  },
  navCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  navCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  navCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navCardText: {
    flex: 1,
  },
  navCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  navCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
});

export default ProfileScreen; 