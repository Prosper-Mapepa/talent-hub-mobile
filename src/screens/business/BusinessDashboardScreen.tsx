import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../store';
import apiService from '../../services/api';
import { Job, Application, JobType, ExperienceLevel, ApplicationStatus } from '../../types';
import { showToast } from '../../components/ui/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createConversation, sendMessage } from '../../store/slices/messagesSlice';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import AsyncStorage from '@react-native-async-storage/async-storage';

const JOB_TYPES: { label: string; value: JobType }[] = [
  { label: 'Full Time', value: JobType.FULL_TIME },
  { label: 'Part Time', value: JobType.PART_TIME },
  { label: 'Internship', value: JobType.INTERNSHIP },
  { label: 'Contract', value: JobType.CONTRACT },
];

const EXPERIENCE_LEVELS: { label: string; value: ExperienceLevel }[] = [
  { label: 'Entry Level', value: ExperienceLevel.ENTRY_LEVEL },
  { label: 'Intermediate', value: ExperienceLevel.INTERMEDIATE },
  { label: 'Senior', value: ExperienceLevel.SENIOR },
];

const BusinessDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    type: JobType.FULL_TIME,
    experienceLevel: ExperienceLevel.ENTRY_LEVEL,
    location: '',
    salary: '',
    requirements: [] as string[],
    responsibilities: [] as string[],
    benefits: [] as string[],
  });
  const [requirementInput, setRequirementInput] = useState('');
  const [responsibilityInput, setResponsibilityInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [updatingAppStatus, setUpdatingAppStatus] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Fetch jobs
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const fetchedJobs = await apiService.getBusinessJobs();
      setJobs(fetchedJobs);
    } catch (e: any) {
      console.error('Failed to fetch jobs:', e);
      showToast('Failed to fetch jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Calculate statistics
  const stats = {
    total: jobs.length,
    pending: jobs.reduce((acc, job) => acc + (job.applications?.filter(app => app.status === ApplicationStatus.PENDING).length || 0), 0),
    accepted: jobs.reduce((acc, job) => acc + (job.applications?.filter(app => app.status === ApplicationStatus.ACCEPTED).length || 0), 0),
    rejected: jobs.reduce((acc, job) => acc + (job.applications?.filter(app => app.status === ApplicationStatus.REJECTED).length || 0), 0),
  };

  // Open add/edit job modal
  const openJobModal = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setJobForm({
        title: job.title,
        description: job.description,
        type: job.type,
        experienceLevel: job.experienceLevel,
        location: job.location || '',
        salary: job.salary || '',
        requirements: Array.isArray(job.requirements) ? job.requirements : [],
        responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
        benefits: Array.isArray(job.benefits) ? job.benefits : [],
      });
    } else {
      setEditingJob(null);
      setJobForm({
        title: '',
        description: '',
        type: JobType.FULL_TIME,
        experienceLevel: ExperienceLevel.ENTRY_LEVEL,
        location: '',
        salary: '',
        requirements: [],
        responsibilities: [],
        benefits: [],
      });
    }
    setRequirementInput('');
    setResponsibilityInput('');
    setBenefitInput('');
    setShowJobModal(true);
  };

  // Add requirement
  const addRequirement = () => {
    if (requirementInput.trim()) {
      setJobForm(f => ({ ...f, requirements: [...f.requirements, requirementInput.trim()] }));
      setRequirementInput('');
    }
  };

  // Remove requirement
  const removeRequirement = (index: number) => {
    setJobForm(f => ({ ...f, requirements: f.requirements.filter((_, i) => i !== index) }));
  };

  // Add responsibility
  const addResponsibility = () => {
    if (responsibilityInput.trim()) {
      setJobForm(f => ({ ...f, responsibilities: [...f.responsibilities, responsibilityInput.trim()] }));
      setResponsibilityInput('');
    }
  };

  // Remove responsibility
  const removeResponsibility = (index: number) => {
    setJobForm(f => ({ ...f, responsibilities: f.responsibilities.filter((_, i) => i !== index) }));
  };

  // Add benefit
  const addBenefit = () => {
    if (benefitInput.trim()) {
      setJobForm(f => ({ ...f, benefits: [...f.benefits, benefitInput.trim()] }));
      setBenefitInput('');
    }
  };

  // Remove benefit
  const removeBenefit = (index: number) => {
    setJobForm(f => ({ ...f, benefits: f.benefits.filter((_, i) => i !== index) }));
  };

  // Save job (add or update)
  const saveJob = async () => {
    if (!jobForm.title.trim()) {
      showToast('Please enter a job title', 'error');
      return;
    }
    if (!jobForm.description.trim()) {
      showToast('Please enter a job description', 'error');
      return;
    }
    if (!jobForm.location.trim()) {
      showToast('Please enter a location', 'error');
      return;
    }

    // Check if user has businessId
    if (!user?.businessId && !editingJob) {
      showToast('Business profile not found. Please complete your business profile first.', 'error');
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        title: jobForm.title.trim(),
        description: jobForm.description.trim(),
        type: jobForm.type,
        experienceLevel: jobForm.experienceLevel,
        location: jobForm.location.trim(),
        salary: jobForm.salary.trim() || undefined,
        requirements: jobForm.requirements.length > 0 ? jobForm.requirements : undefined,
        responsibilities: jobForm.responsibilities.length > 0 ? jobForm.responsibilities : undefined,
        benefits: jobForm.benefits.length > 0 ? jobForm.benefits : undefined,
      };

      // Add businessId only when creating (not updating)
      if (!editingJob && user?.businessId) {
        data.businessId = user.businessId;
      }

      if (editingJob) {
        await apiService.updateJob(editingJob.id, data);
        showToast('Job updated successfully!', 'success');
      } else {
        await apiService.createJob(data);
        showToast('Job created successfully!', 'success');
      }
      setShowJobModal(false);
      fetchJobs();
    } catch (e: any) {
      console.error('Failed to save job:', e);
      const errorMessage = e?.response?.data?.message || 
                          e?.response?.data?.errors ? 
                          JSON.stringify(e.response.data.errors) : 
                          'Failed to save job';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete job
  const deleteJob = (jobId: string) => {
    showToast(
      'Are you sure you want to delete this job?',
      'warning',
      {
        text: 'Delete',
        onPress: async () => {
        setLoading(true);
        try {
          await apiService.deleteJob(jobId);
            showToast('Job deleted successfully!', 'success');
          fetchJobs();
          } catch (e: any) {
            console.error('Failed to delete job:', e);
            showToast('Failed to delete job', 'error');
        } finally {
          setLoading(false);
        }
        },
      }
    );
  };

  // View applications
  const viewApplications = (job: Job) => {
    navigation.navigate('JobApplications', {
      jobId: job.id,
      jobTitle: job.title,
      applications: job.applications || [],
    });
  };


  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Invalid Date';
    }
  };

  // Get status color
  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.ACCEPTED:
        return '#10b981';
      case ApplicationStatus.REJECTED:
        return '#ef4444';
      case ApplicationStatus.PENDING:
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  // Render job item
  const renderJob = ({ item }: { item: Job }) => {
    const applicationCount = item.applications?.length || 0;
    const pendingCount = item.applications?.filter(app => app.status === ApplicationStatus.PENDING).length || 0;

    return (
      <View style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <View style={styles.jobHeaderLeft}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            <View style={styles.jobMeta}>
              <View style={styles.jobMetaItem}>
                <Ionicons name="briefcase-outline" size={14} color="#6b7280" />
                <Text style={styles.jobMetaText}>{item.type.replace('_', ' ')}</Text>
              </View>
              <View style={styles.jobMetaItem}>
                <Ionicons name="star-outline" size={14} color="#6b7280" />
                <Text style={styles.jobMetaText}>{item.experienceLevel.replace('_', ' ')}</Text>
              </View>
              <View style={styles.jobMetaItem}>
                <Ionicons name="location-outline" size={14} color="#6b7280" />
                <Text style={styles.jobMetaText}>{item.location}</Text>
              </View>
            </View>
          </View>
          {applicationCount > 0 && (
            <View style={styles.applicationBadge}>
              <Text style={styles.applicationBadgeText}>{applicationCount}</Text>
              {pendingCount > 0 && (
                <View style={styles.pendingIndicator} />
              )}
            </View>
          )}
        </View>
        <Text style={styles.jobDescription} numberOfLines={2}>{item.description}</Text>
        {item.salary && (
          <View style={styles.salaryContainer}>
            <Ionicons name="cash-outline" size={16} color="#6b7280" />
            <Text style={styles.salaryText}>{item.salary}</Text>
          </View>
        )}
        <View style={styles.jobActions}>
          <TouchableOpacity
            onPress={() => openJobModal(item)}
            activeOpacity={0.8}
            style={styles.actionButtonWrapper}
          >
            <LinearGradient
              colors={['#8F1A27', '#6A0032', '#8F1A27']}
              style={[styles.actionButton, styles.editButton]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </LinearGradient>
        </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.applicationsButton]}
            onPress={() => viewApplications(item)}
          >
            <Ionicons name="people-outline" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>
              Apps {applicationCount > 0 && `(${applicationCount})`}
            </Text>
        </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteJob(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  };

  // Handle view profile
  const handleViewProfile = (student: any) => {
    // Close applications modal first
    setShowAppsModal(false);
    
    if (student?.id) {
      // Use requestAnimationFrame to ensure modal closes before navigation
      requestAnimationFrame(() => {
        navigation.navigate('StudentProfile', { studentId: student.id });
      });
    } else {
      showToast('Student profile not available', 'error');
    }
  };

  // Handle message student
  const handleMessageStudent = (student: any) => {
    if (!user?.id) {
      showToast('Please log in to send messages.', 'info');
      return;
    }

    // Get the user ID from student object
    const recipientUserId = student?.user?.id || student?.userId;
    if (!recipientUserId) {
      showToast('Unable to find student user information.', 'error');
      return;
    }

    // Check if trying to message yourself
    if (user.id === recipientUserId) {
      showToast('You cannot send messages to yourself.', 'warning');
      return;
    }

    // Set student and open message modal directly
    setSelectedStudent(student);
    setMessageText('');
    setShowMessageModal(true);
    
    // Close applications modal after opening message modal
    setShowAppsModal(false);
  };

  // Send message to student
  const sendMessageToStudent = async () => {
    if (!messageText.trim()) {
      showToast('Please enter a message.', 'warning');
      return;
    }

    if (!user?.id) {
      showToast('You must be logged in to send messages.', 'error');
      return;
    }

    const recipientUserId = selectedStudent?.user?.id || selectedStudent?.userId;
    if (!recipientUserId) {
      showToast('Unable to find recipient user information.', 'error');
      return;
    }

    if (user.id === recipientUserId) {
      showToast('You cannot send messages to yourself.', 'warning');
      return;
    }

    try {
      setIsSendingMessage(true);
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('You are not authenticated. Please log in again.');
      }

      if (!user.id || user.id === 'undefined' || !user.id.trim()) {
        throw new Error('Invalid sender ID. Please log out and log back in.');
      }

      if (!recipientUserId || recipientUserId === 'undefined' || !recipientUserId.trim()) {
        throw new Error('Invalid recipient ID. Please try again.');
      }

      let conversation;
      try {
        const conversationResult = await dispatch(createConversation([
          user.id.trim(),
          recipientUserId.trim()
        ])).unwrap();
        
        conversation = conversationResult;
        
        if (!conversation || !conversation.id) {
          throw new Error('Failed to create conversation. Please try again.');
        }
      } catch (convError: any) {
        console.error('Error creating conversation:', convError);
        if (convError?.response?.status === 409 || convError?.message?.includes('already exists')) {
          throw new Error('A conversation already exists. Please check your Messages tab.');
        }
        throw new Error(convError?.message || 'Failed to create conversation. Please try again.');
      }

      await dispatch(sendMessage({
        conversationId: conversation.id,
        messageData: {
          content: messageText.trim()
        }
      })).unwrap();

      showToast(
        'Message sent successfully!',
        'success',
        {
          text: 'Go to Messages',
          onPress: () => {
            try {
              navigation.navigate('MainTabs', { screen: 'Messages' });
            } catch (navError) {
              console.log('Navigation error:', navError);
            }
          }
        }
      );
      setMessageText('');
      setShowMessageModal(false);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      let errorMessage = 'Failed to send message.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'You are not authenticated. Please log out and log back in.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You are not authorized to send messages.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Recipient not found.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid request. Please check your message.';
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };


  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#8F1A27', '#6A0032', '#8F1A27']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
      <Text style={styles.title}>Business Dashboard</Text>
      <Text style={styles.subtitle}>Manage your jobs and applications</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="briefcase" size={24} color={COLORS.maroon} />
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Jobs</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color="#f59e0b" />
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          <Text style={styles.statNumber}>{stats.accepted}</Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
      </View>

      {/* Add Job Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          onPress={() => openJobModal()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8F1A27', '#6A0032', '#8F1A27']}
            style={styles.addButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Job</Text>
          </LinearGradient>
      </TouchableOpacity>
      </View>

      {/* Jobs List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.maroon} />
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No jobs posted yet</Text>
          <Text style={styles.emptySubtext}>Create your first job posting to get started</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderJob}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.jobsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Job Modal */}
      <Modal
        visible={showJobModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowJobModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
              <Text style={styles.modalTitle}>
                {editingJob ? 'Edit Job' : 'Add Job'}
              </Text>
                  <TouchableOpacity
                onPress={() => setShowJobModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Job Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter job title"
                  value={jobForm.title}
                  onChangeText={text => setJobForm(f => ({ ...f, title: text }))}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter job description"
                  value={jobForm.description}
                  onChangeText={text => setJobForm(f => ({ ...f, description: text }))}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Job Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Job Type *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
                  {JOB_TYPES.map(type => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.optionButton,
                        jobForm.type === type.value && styles.optionButtonActive
                      ]}
                      onPress={() => setJobForm(f => ({ ...f, type: type.value }))}
                    >
                      <Text style={[
                        styles.optionText,
                        jobForm.type === type.value && styles.optionTextActive
                      ]}>
                        {type.label}
                      </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              </View>

              {/* Experience Level */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Experience Level *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
                  {EXPERIENCE_LEVELS.map(level => (
                  <TouchableOpacity
                      key={level.value}
                      style={[
                        styles.optionButton,
                        jobForm.experienceLevel === level.value && styles.optionButtonActive
                      ]}
                      onPress={() => setJobForm(f => ({ ...f, experienceLevel: level.value }))}
                    >
                      <Text style={[
                        styles.optionText,
                        jobForm.experienceLevel === level.value && styles.optionTextActive
                      ]}>
                        {level.label}
                      </Text>
                  </TouchableOpacity>
                ))}
                </ScrollView>
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Remote, New York, NY"
                  value={jobForm.location}
                  onChangeText={text => setJobForm(f => ({ ...f, location: text }))}
                />
              </View>

              {/* Salary */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Salary (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., $50,000/year or $25/hour"
                  value={jobForm.salary}
                  onChangeText={text => setJobForm(f => ({ ...f, salary: text }))}
                />
              </View>

              {/* Requirements */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Requirements</Text>
                <View style={styles.listInputContainer}>
                  <TextInput
                    style={styles.listInput}
                    placeholder="Add a requirement"
                    value={requirementInput}
                    onChangeText={setRequirementInput}
                    onSubmitEditing={addRequirement}
                  />
                <TouchableOpacity
                    style={styles.addListItemButton}
                    onPress={addRequirement}
                  >
                    <Ionicons name="add-circle" size={24} color={COLORS.maroon} />
                </TouchableOpacity>
                </View>
                {jobForm.requirements.length > 0 && (
                  <View style={styles.listItems}>
                    {jobForm.requirements.map((req, index) => (
                      <View key={index} style={styles.listItem}>
                        <Text style={styles.listItemText}>{req}</Text>
                <TouchableOpacity
                          onPress={() => removeRequirement(index)}
                          style={styles.removeListItemButton}
                        >
                          <Ionicons name="close-circle" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Responsibilities */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Responsibilities</Text>
                <View style={styles.listInputContainer}>
              <TextInput
                    style={styles.listInput}
                    placeholder="Add a responsibility"
                    value={responsibilityInput}
                    onChangeText={setResponsibilityInput}
                    onSubmitEditing={addResponsibility}
                  />
                  <TouchableOpacity
                    style={styles.addListItemButton}
                    onPress={addResponsibility}
                  >
                    <Ionicons name="add-circle" size={24} color={COLORS.maroon} />
                  </TouchableOpacity>
                </View>
                {jobForm.responsibilities.length > 0 && (
                  <View style={styles.listItems}>
                    {jobForm.responsibilities.map((resp, index) => (
                      <View key={index} style={styles.listItem}>
                        <Text style={styles.listItemText}>{resp}</Text>
                        <TouchableOpacity
                          onPress={() => removeResponsibility(index)}
                          style={styles.removeListItemButton}
                        >
                          <Ionicons name="close-circle" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Benefits */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Benefits</Text>
                <View style={styles.listInputContainer}>
                <TextInput
                    style={styles.listInput}
                    placeholder="Add a benefit"
                    value={benefitInput}
                    onChangeText={setBenefitInput}
                    onSubmitEditing={addBenefit}
                  />
                  <TouchableOpacity
                    style={styles.addListItemButton}
                    onPress={addBenefit}
                  >
                    <Ionicons name="add-circle" size={24} color={COLORS.maroon} />
                  </TouchableOpacity>
                </View>
                {jobForm.benefits.length > 0 && (
                  <View style={styles.listItems}>
                    {jobForm.benefits.map((benefit, index) => (
                      <View key={index} style={styles.listItem}>
                        <Text style={styles.listItemText}>{benefit}</Text>
                  <TouchableOpacity
                          onPress={() => removeBenefit(index)}
                          style={styles.removeListItemButton}
                        >
                          <Ionicons name="close-circle" size={18} color="#ef4444" />
                  </TouchableOpacity>
                      </View>
                ))}
              </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowJobModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              <TouchableOpacity
                onPress={saveJob}
                disabled={loading}
                activeOpacity={0.8}
                style={styles.modalButtonWrapper}
              >
                <LinearGradient
                  colors={['#8F1A27', '#6A0032', '#8F1A27']}
                  style={[styles.modalButton, styles.saveButton]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingJob ? 'Update' : 'Create'}
                    </Text>
                  )}
                </LinearGradient>
                </TouchableOpacity>
              </View>
          </View>
        </View>
      </Modal>

      {/* Message Modal */}
      <Modal
        visible={showMessageModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowMessageModal(false);
          setSelectedStudent(null);
          setMessageText('');
        }}
      >
        {selectedStudent && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
                <View>
                  <Text style={styles.modalTitle}>Send Direct Message</Text>
                  <Text style={styles.modalSubtitle}>
                    Send a message to {selectedStudent?.firstName || ''} {selectedStudent?.lastName || ''}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setShowMessageModal(false);
                    setSelectedStudent(null);
                    setMessageText('');
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.messageModalBody}>
                <Input
                  placeholder="Type your message..."
                  value={messageText}
                  onChangeText={setMessageText}
                  style={styles.modalInput}
                  multiline
                  numberOfLines={4}
                />

                <View style={styles.messageModalActions}>
                  <Button
                    variant="outline"
                    onPress={() => {
                      setShowMessageModal(false);
                      setSelectedStudent(null);
                      setMessageText('');
                    }}
                    style={styles.modalButton}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </Button>
                  <Button
                    onPress={sendMessageToStudent}
                    style={[styles.modalButton, styles.sendButton]}
                    disabled={isSendingMessage}
                  >
                    {isSendingMessage ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.sendButtonText}>Send Message</Text>
                    )}
                  </Button>
                </View>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 10,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#6A0032',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  jobsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobHeaderLeft: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 10,
  },
  jobMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobMetaText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  applicationBadge: {
    backgroundColor: COLORS.maroon,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: 'center',
    position: 'relative',
  },
  applicationBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  pendingIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
    borderWidth: 2,
    borderColor: '#fff',
  },
  jobDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  salaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  salaryText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  jobActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  editButton: {
    // Gradient applied via LinearGradient component
  },
  applicationsButton: {
    backgroundColor: 'orange',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 0,
    width: '100%',
    height: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#1f2937',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  optionsContainer: {
    marginTop: 4,
  },
  optionButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionButtonActive: {
    backgroundColor: COLORS.maroon,
    borderColor: COLORS.maroon,
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  listInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addListItemButton: {
    padding: 4,
  },
  listItems: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  removeListItemButton: {
    padding: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  modalButtonWrapper: {
    flex: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    // Gradient applied via LinearGradient component
    shadowColor: '#6A0032',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  applicationsList: {
    padding: 20,
    paddingBottom: 40,
  },
  applicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  applicationInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  applicationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.maroon,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  applicationAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  applicationDetails: {
    flex: 1,
  },
  applicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  applicationEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  applicationDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  coverLetterContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
  },
  coverLetterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  coverLetterText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  applicationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButtonSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  viewProfileButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#8F1A27',
  },
  messageButton: {
    backgroundColor: '#8F1A27',
  },
  actionButtonTextSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8F1A27',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  statusButtonActive: {
    opacity: 0.7,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageModalBody: {
    flex: 1,
    padding: 20,
  },
  messageModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalInput: {
    marginBottom: 0,
    minHeight: 120,
  },
  modalButton: {
    flex: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#8F1A27',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyApplicationsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyApplicationsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyApplicationsSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default BusinessDashboardScreen; 
