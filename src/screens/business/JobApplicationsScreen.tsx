import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../store';
import apiService from '../../services/api';
import { Application, ApplicationStatus } from '../../types';
import { showToast } from '../../components/ui/toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createConversation, sendMessage } from '../../store/slices/messagesSlice';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal } from 'react-native';

type JobApplicationsParams = {
  JobApplications: {
    jobId: string;
    jobTitle: string;
    applications: Application[];
  };
};

type JobApplicationsRouteProp = RouteProp<JobApplicationsParams, 'JobApplications'>;

const JobApplicationsScreen: React.FC = () => {
  const route = useRoute<JobApplicationsRouteProp>();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const insets = useSafeAreaInsets();
  
  const { jobId, jobTitle, applications: initialApplications } = route.params;
  const [applications, setApplications] = useState<Application[]>(initialApplications || []);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingAppStatus, setUpdatingAppStatus] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Fetch applications
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const jobs = await apiService.getBusinessJobs();
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        setApplications(job.applications || []);
      }
    } catch (e: any) {
      console.error('Failed to fetch applications:', e);
      showToast('Failed to fetch applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  // Update application status
  const updateApplicationStatus = async (applicationId: string, status: ApplicationStatus) => {
    setUpdatingAppStatus(applicationId);
    try {
      await apiService.updateApplicationStatus(applicationId, status);
      showToast(`Application ${status.toLowerCase()} successfully!`, 'success');
      // Refresh applications
      await fetchApplications();
    } catch (e: any) {
      console.error('Failed to update application status:', e);
      showToast('Failed to update application status', 'error');
    } finally {
      setUpdatingAppStatus(null);
    }
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

  // Handle view profile
  const handleViewProfile = (student: any) => {
    if (student?.id) {
      navigation.navigate('StudentProfile', { studentId: student.id });
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

    const recipientUserId = student?.user?.id || student?.userId;
    if (!recipientUserId) {
      showToast('Unable to find student user information.', 'error');
      return;
    }

    if (user.id === recipientUserId) {
      showToast('You cannot send messages to yourself.', 'warning');
      return;
    }

    setSelectedStudent(student);
    setMessageText('');
    setShowMessageModal(true);
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

    try {
      setIsSendingMessage(true);
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('You are not authenticated. Please log in again.');
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
            navigation.navigate('MainTabs', { screen: 'Messages' });
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
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Render application item
  const renderApplication = ({ item }: { item: Application }) => {
    const student = item.student;
    const studentName = student?.firstName && student?.lastName
      ? `${student.firstName} ${student.lastName}`
      : student?.user?.email || 'Unknown Student';
    const studentEmail = student?.user?.email || '';

    return (
      <View style={styles.applicationCard}>
        <View style={styles.applicationHeader}>
          <View style={styles.applicationInfo}>
            <View style={styles.applicationAvatar}>
              <Text style={styles.applicationAvatarText}>
                {studentName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.applicationDetails}>
              <Text style={styles.applicationName}>{studentName}</Text>
              <Text style={styles.applicationEmail}>{studentEmail}</Text>
              <Text style={styles.applicationDate}>Applied {formatDate(item.appliedAt)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
        {item.coverLetter && (
          <View style={styles.coverLetterContainer}>
            <Text style={styles.coverLetterLabel}>Cover Letter:</Text>
            <Text style={styles.coverLetterText}>{item.coverLetter}</Text>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.applicationActions}>
          <TouchableOpacity
            style={[styles.actionButtonSmall, styles.viewProfileButton]}
            onPress={() => handleViewProfile(student)}
          >
            <Ionicons name="person" size={16} color="#8F1A27" />
            <Text style={styles.actionButtonTextSmall}>View Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButtonSmall, 
              styles.acceptButton,
              item.status === ApplicationStatus.ACCEPTED && styles.statusButtonActive
            ]}
            onPress={() => updateApplicationStatus(item.id, ApplicationStatus.ACCEPTED)}
            disabled={updatingAppStatus === item.id || item.status === ApplicationStatus.ACCEPTED}
          >
            {updatingAppStatus === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={[styles.actionButtonTextSmall, { color: '#fff' }]}>
                  {item.status === ApplicationStatus.ACCEPTED ? 'Accepted' : 'Accept'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButtonSmall, 
              styles.rejectButton,
              item.status === ApplicationStatus.REJECTED && styles.statusButtonActive
            ]}
            onPress={() => updateApplicationStatus(item.id, ApplicationStatus.REJECTED)}
            disabled={updatingAppStatus === item.id || item.status === ApplicationStatus.REJECTED}
          >
            {updatingAppStatus === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="close-circle" size={16} color="#fff" />
                <Text style={[styles.actionButtonTextSmall, { color: '#fff' }]}>
                  {item.status === ApplicationStatus.REJECTED ? 'Rejected' : 'Reject'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
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
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Applications</Text>
            <Text style={styles.subtitle}>Job: {jobTitle}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Applications List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8F1A27" />
        </View>
      ) : applications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No applications yet</Text>
          <Text style={styles.emptySubtext}>
            Applications will appear here when students apply
          </Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          renderItem={renderApplication}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.applicationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

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
    // paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
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
  applicationsList: {
    padding: 16,
  },
  applicationCard: {
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8F1A27',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  applicationAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  applicationDetails: {
    flex: 1,
  },
  applicationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  applicationEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  applicationDate: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
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
  acceptButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  statusButtonActive: {
    opacity: 0.7,
  },
  actionButtonTextSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8F1A27',
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
});

export default JobApplicationsScreen;

