import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { fetchJobs } from '../../store/slices/jobsSlice';
import { Ionicons } from '@expo/vector-icons';
import { Application, UserRole, ApplicationStatus } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { showToast } from '../../components/ui/toast';
import { COLORS } from '../../theme/colors';

const ApplicationsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAppSelector(state => state.auth);
  const { jobs, isLoading, error } = useAppSelector(state => state.jobs);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  useEffect(() => {
    dispatch(fetchJobs({}));
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchJobs({}));
    setRefreshing(false);
  };

  // Get all applications for the current student
  const getMyApplications = () => {
    if (!user?.studentId) return [];
    
    const seen = new Set();
    return jobs
      .flatMap(job => (job.applications || []).map(app => ({ ...app, job })))
      .filter(app => app.student && app.student.id === user.studentId)
      .filter(app => {
        if (seen.has(app.id)) return false;
        seen.add(app.id);
        return true;
      })
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  };

  const allApplications = getMyApplications();

  // Filter applications based on active tab
  const applications = useMemo(() => {
    if (activeTab === 'ALL') {
      return allApplications;
    }
    return allApplications.filter(app => app.status === activeTab);
  }, [allApplications, activeTab]);

  // Get counts for each status
  const statusCounts = useMemo(() => {
    return {
      ALL: allApplications.length,
      PENDING: allApplications.filter(app => app.status === ApplicationStatus.PENDING).length,
      REVIEWING: allApplications.filter(app => app.status === ApplicationStatus.REVIEWING).length,
      INTERVIEWING: allApplications.filter(app => app.status === ApplicationStatus.INTERVIEWING).length,
      ACCEPTED: allApplications.filter(app => app.status === ApplicationStatus.ACCEPTED).length,
      REJECTED: allApplications.filter(app => app.status === ApplicationStatus.REJECTED).length,
    };
  }, [allApplications]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#F59E0B';
      case 'REVIEWING': return '#3B82F6';
      case 'INTERVIEWING': return '#8B5CF6';
      case 'ACCEPTED': return '#10B981';
      case 'REJECTED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending Review';
      case 'REVIEWING': return 'Under Review';
      case 'INTERVIEWING': return 'Interviewing';
      case 'ACCEPTED': return 'Accepted';
      case 'REJECTED': return 'Rejected';
      default: return status.replace('_', ' ');
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      // Try to use createdAt as fallback
      return null;
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return null;
    }
  };

  const renderApplicationCard = ({ item: application }: { item: Application & { job: any } }) => (
    <TouchableOpacity
      style={styles.applicationCard}
      onPress={() => {
        const appliedDate = formatDate(application.appliedAt) || formatDate((application as any).createdAt) || 'Date not available';
        const details = [
          `Job: ${application.job.title}`,
          `Company: ${application.job.business?.businessName || 'N/A'}`,
          `Status: ${getStatusText(application.status)}`,
          `Applied: ${appliedDate}`,
          application.coverLetter ? `\nCover Letter: ${application.coverLetter}` : ''
        ].filter(Boolean).join('\n');
        
        showToast(details, 'info');
      }}
    >
      <View style={styles.applicationHeader}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{application.job.title}</Text>
          <Text style={styles.companyName}>{application.job.business?.businessName}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(application.status) + '20' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(application.status) }
          ]}>
            {getStatusText(application.status)}
          </Text>
        </View>
      </View>

      <View style={styles.applicationMeta}>
        {(formatDate(application.appliedAt) || formatDate((application as any).createdAt)) && (
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={16} color={COLORS.maroon} />
            <Text style={styles.metaText}>
              Applied {formatDate(application.appliedAt) || formatDate((application as any).createdAt)}
            </Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <Ionicons name="location" size={16} color={COLORS.maroon} />
          <Text style={styles.metaText}>{application.job.location}</Text>
        </View>
        {application.job.salary && (
          <View style={styles.metaItem}>
            <Ionicons name="cash" size={16} color={COLORS.maroon} />
            <Text style={styles.metaText}>{application.job.salary}</Text>
          </View>
        )}
      </View>

      {application.coverLetter && (
        <View style={styles.coverLetterContainer}>
          <Text style={styles.coverLetterLabel}>Cover Letter:</Text>
          <Text style={styles.coverLetterText} numberOfLines={3}>
            {application.coverLetter}
          </Text>
        </View>
      )}

      <View style={styles.applicationFooter}>
        <View style={styles.jobTypeContainer}>
          <View style={[styles.jobTypeBadge, { backgroundColor: COLORS.maroon + '15', borderColor: COLORS.maroon + '40' }]}>
            <Text style={[styles.jobTypeText, { color: COLORS.maroon }]}>
              {application.job.type.replace('_', ' ')}
            </Text>
          </View>
          <View style={[styles.experienceBadge, { backgroundColor: COLORS.maroon + '15', borderColor: COLORS.maroon + '40' }]}>
            <Text style={[styles.experienceText, { color: COLORS.maroon }]}>
              {application.job.experienceLevel.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (user?.role !== UserRole.STUDENT) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Applications</Text>
          <Text style={styles.subtitle}>Your job applications</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color="#6B7280" />
          <Text style={styles.emptyText}>Only students can view applications</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#8F1A27', '#6A0032', '#8F1A27']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Applications</Text>
            <Text style={styles.subtitle}>Your job applications</Text>
          </View>
          <View style={styles.headerActions}>
            {/* Add any action buttons here if needed */}
          </View>
        </View>
      </LinearGradient>

      {/* Tabs Navigation */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ALL' && styles.activeTab]}
            onPress={() => setActiveTab('ALL')}
          >
            <Text style={[styles.tabText, activeTab === 'ALL' && styles.activeTabText]}>
              All ({statusCounts.ALL})
            </Text>
          </TouchableOpacity>
          
          {statusCounts.PENDING > 0 && (
            <TouchableOpacity
              style={[styles.tab, activeTab === ApplicationStatus.PENDING && styles.activeTab]}
              onPress={() => setActiveTab(ApplicationStatus.PENDING)}
            >
              <Text style={[styles.tabText, activeTab === ApplicationStatus.PENDING && styles.activeTabText]}>
                Pending ({statusCounts.PENDING})
              </Text>
            </TouchableOpacity>
          )}
          
          {statusCounts.REVIEWING > 0 && (
            <TouchableOpacity
              style={[styles.tab, activeTab === ApplicationStatus.REVIEWING && styles.activeTab]}
              onPress={() => setActiveTab(ApplicationStatus.REVIEWING)}
            >
              <Text style={[styles.tabText, activeTab === ApplicationStatus.REVIEWING && styles.activeTabText]}>
                Reviewing ({statusCounts.REVIEWING})
              </Text>
            </TouchableOpacity>
          )}
          
          {statusCounts.INTERVIEWING > 0 && (
            <TouchableOpacity
              style={[styles.tab, activeTab === ApplicationStatus.INTERVIEWING && styles.activeTab]}
              onPress={() => setActiveTab(ApplicationStatus.INTERVIEWING)}
            >
              <Text style={[styles.tabText, activeTab === ApplicationStatus.INTERVIEWING && styles.activeTabText]}>
                Interviewing ({statusCounts.INTERVIEWING})
              </Text>
            </TouchableOpacity>
          )}
          
          {statusCounts.ACCEPTED > 0 && (
            <TouchableOpacity
              style={[styles.tab, activeTab === ApplicationStatus.ACCEPTED && styles.activeTab]}
              onPress={() => setActiveTab(ApplicationStatus.ACCEPTED)}
            >
              <Text style={[styles.tabText, activeTab === ApplicationStatus.ACCEPTED && styles.activeTabText]}>
                Accepted ({statusCounts.ACCEPTED})
              </Text>
            </TouchableOpacity>
          )}
          
          {statusCounts.REJECTED > 0 && (
            <TouchableOpacity
              style={[styles.tab, activeTab === ApplicationStatus.REJECTED && styles.activeTab]}
              onPress={() => setActiveTab(ApplicationStatus.REJECTED)}
            >
              <Text style={[styles.tabText, activeTab === ApplicationStatus.REJECTED && styles.activeTabText]}>
                Rejected ({statusCounts.REJECTED})
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Applications List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0032" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : applications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color="#6B7280" />
          <Text style={styles.emptyText}>
            {activeTab === 'ALL' 
              ? 'No applications yet' 
              : `No ${getStatusText(activeTab).toLowerCase()} applications`}
          </Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'ALL' 
              ? 'Start applying to jobs to see your applications here'
              : 'Try selecting a different status tab'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          renderItem={renderApplicationCard}
          keyExtractor={(item) => item.id}
          style={styles.applicationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    fontSize: 16,
    color: '#FFFFFF',
  },
  headerActions: {
    // Add any action buttons here if needed
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 20,
    marginBottom: 20,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#8F1A27',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#fff',
  },
  applicationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  applicationCard: {
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
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobInfo: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  applicationMeta: {
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  coverLetterContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  coverLetterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  coverLetterText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  applicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  jobTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  jobTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  experienceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  experienceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default ApplicationsScreen; 