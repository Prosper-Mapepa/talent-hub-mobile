import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/api';

interface ReportBlockModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  contentId?: string;
  contentType?: 'MESSAGE' | 'PROFILE' | 'PROJECT' | 'ACHIEVEMENT' | 'JOB' | 'USER';
  userName?: string;
  onBlockSuccess?: () => void;
  onReportSuccess?: () => void;
}

const ReportBlockModal: React.FC<ReportBlockModalProps> = ({
  visible,
  onClose,
  userId,
  contentId,
  contentType = 'USER',
  userName,
  onBlockSuccess,
  onReportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'block'>('report');
  const [reportReason, setReportReason] = useState<
    'INAPPROPRIATE_CONTENT' | 'HARASSMENT' | 'SPAM' | 'FAKE_PROFILE' | 'INAPPROPRIATE_BEHAVIOR' | 'OTHER'
  >('INAPPROPRIATE_CONTENT');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reportReasons = [
    { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content' },
    { value: 'HARASSMENT', label: 'Harassment' },
    { value: 'SPAM', label: 'Spam' },
    { value: 'FAKE_PROFILE', label: 'Fake Profile' },
    { value: 'INAPPROPRIATE_BEHAVIOR', label: 'Inappropriate Behavior' },
    { value: 'OTHER', label: 'Other' },
  ];

  const handleReport = async () => {
    if (!userId && !contentId) {
      Alert.alert('Error', 'Cannot report: missing user or content ID');
      return;
    }

    try {
      setLoading(true);
      await apiService.reportContent({
        type: contentType,
        reportedUserId: userId,
        contentId: contentId,
        reason: reportReason,
        description: description.trim() || undefined,
      });
      Alert.alert('Success', 'Report submitted successfully. We will review it within 24 hours.');
      setDescription('');
      if (onReportSuccess) {
        onReportSuccess();
      }
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!userId) {
      Alert.alert('Error', 'Cannot block: missing user ID');
      return;
    }

    Alert.alert(
      'Block User',
      `Are you sure you want to block ${userName || 'this user'}? You won't be able to see their content or receive messages from them.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await apiService.blockUser(userId);
              Alert.alert('Success', 'User blocked successfully. Their content has been removed from your feed.');
              if (onBlockSuccess) {
                onBlockSuccess();
              }
              onClose();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to block user');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {activeTab === 'report' ? 'Report' : 'Block'} {userName || 'User'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'report' && styles.activeTab]}
              onPress={() => setActiveTab('report')}
            >
              <Text style={[styles.tabText, activeTab === 'report' && styles.activeTabText]}>
                Report
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'block' && styles.activeTab]}
              onPress={() => setActiveTab('block')}
            >
              <Text style={[styles.tabText, activeTab === 'block' && styles.activeTabText]}>
                Block
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'report' ? (
              <View>
                <Text style={styles.label}>Reason for reporting:</Text>
                {reportReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.reasonOption,
                      reportReason === reason.value && styles.selectedReason,
                    ]}
                    onPress={() => setReportReason(reason.value as any)}
                  >
                    <Ionicons
                      name={reportReason === reason.value ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={reportReason === reason.value ? '#8F1A27' : '#666'}
                    />
                    <Text
                      style={[
                        styles.reasonText,
                        reportReason === reason.value && styles.selectedReasonText,
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                <Text style={[styles.label, { marginTop: 20 }]}>Additional details (optional):</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Provide more information about the issue..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.disabledButton]}
                  onPress={handleReport}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#8F1A27', '#6A0032', '#8F1A27']}
                    style={styles.submitButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Submit Report</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.blockWarning}>
                  <Ionicons name="warning" size={32} color="#FFC540" />
                  <Text style={styles.blockWarningTitle}>Block User</Text>
                  <Text style={styles.blockWarningText}>
                    Blocking this user will:
                  </Text>
                  <Text style={styles.blockWarningItem}>
                    • Remove their content from your feed instantly
                  </Text>
                  <Text style={styles.blockWarningItem}>
                    • Prevent them from messaging you
                  </Text>
                  <Text style={styles.blockWarningItem}>
                    • Hide your profile from them
                  </Text>
                  <Text style={styles.blockWarningItem}>
                    • Notify the developer for review
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.blockButton, loading && styles.disabledButton]}
                  onPress={handleBlock}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="ban" size={20} color="#fff" />
                      <Text style={styles.blockButtonText}>Block User</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#8F1A27',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  selectedReason: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#8F1A27',
  },
  reasonText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  selectedReasonText: {
    color: '#8F1A27',
    fontWeight: '600',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
    minHeight: 100,
    marginTop: 8,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  blockWarning: {
    backgroundColor: '#fff9e6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  blockWarningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  blockWarningText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  blockWarningItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'left',
    width: '100%',
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  blockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReportBlockModal;
