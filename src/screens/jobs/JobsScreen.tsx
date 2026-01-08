import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { fetchJobs, applyForJob } from '../../store/slices/jobsSlice';
import { Ionicons } from '@expo/vector-icons';
import { Job, UserRole } from '../../types';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const JobsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAppSelector(state => state.auth);
  const { jobs, isLoading, error } = useAppSelector(state => state.jobs);
  console.log('jobs', jobs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    dispatch(fetchJobs({}));
  }, [dispatch]);

  // Refresh jobs when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('JobsScreen: Screen focused, refreshing jobs...');
      dispatch(fetchJobs({}));
    }, [dispatch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchJobs({ refresh: true }));
    setRefreshing(false);
  };

  const handleApplyForJob = (jobId: string) => {
    if (!user || user.role !== UserRole.STUDENT) {
      Alert.alert('Error', 'Only students can apply for jobs');
      return;
    }

    if (!user.studentId) {
      Alert.alert('Error', 'Student profile not found. Please complete your student registration.');
      return;
    }

    setApplyingJobId(jobId);
    dispatch(applyForJob({ 
      jobId, 
      applicationData: {
        coverLetter: '',
        resume: ''
      }
    }))
      .unwrap()
      .then(() => {
        Alert.alert(
          'Application Submitted! 🎉',
          'Your application has been successfully submitted. The employer will review your profile and contact you if you\'re selected for an interview.',
          [{ text: 'OK', style: 'default' }]
        );
      })
      .catch((err) => {
        Alert.alert('Error', typeof err === 'string' ? err : 'Failed to apply for job');
      })
      .finally(() => setApplyingJobId(null));
  };

  const hasAppliedToJob = (job: Job) => {
    if (!user?.studentId || !job.applications) return false;
    return job.applications.some(app => app.student?.id === user.studentId);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.business?.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedJobType === 'all' || job.type === selectedJobType;
    const matchesExperience = selectedExperience === 'all' || job.experienceLevel === selectedExperience;
    const matchesLocation = selectedLocation === 'all' || 
                           (job.location && job.location.toLowerCase().includes(selectedLocation.toLowerCase()));
    
    return matchesSearch && matchesType && matchesExperience && matchesLocation;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedJobType('all');
    setSelectedExperience('all');
    setSelectedLocation('all');
  };

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'FULL_TIME': return '#10B981';
      case 'PART_TIME': return '#3B82F6';
      case 'INTERNSHIP': return '#8B5CF6';
      case 'CONTRACT': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'ENTRY_LEVEL': return '#10B981';
      case 'INTERMEDIATE': return '#F59E0B';
      case 'SENIOR': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const renderJobCard = ({ item: job }: { item: Job }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => {
        setSelectedJob(job);
        setShowJobModal(true);
      }}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <View style={styles.companyContainer}>
            <Ionicons name="business" size={14} color="#6B7280" />
            <Text style={styles.companyName}>{job.business?.businessName}</Text>
          </View>
        </View>
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { backgroundColor: getJobTypeColor(job.type) + '15' }]}>
            <Text style={[styles.badgeText, { color: getJobTypeColor(job.type) }]}>
              {job.type.replace('_', ' ')}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: getExperienceColor(job.experienceLevel) + '15' }]}>
            <Text style={[styles.badgeText, { color: getExperienceColor(job.experienceLevel) }]}>
              {job.experienceLevel.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.jobDescription} numberOfLines={3}>
        {job.description}
      </Text>

      <View style={styles.jobFooter}>
        <View style={styles.jobMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text style={styles.metaText}>{job.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={16} color="#6B7280" />
            <Text style={styles.metaText}>{formatDate(job.createdAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people" size={16} color="#6B7280" />
            <Text style={styles.metaText}>{job.applications?.length || 0} applicants</Text>
          </View>
        </View>

        {user?.role === UserRole.STUDENT && (
          <TouchableOpacity
            style={[
              styles.applyButton,
              hasAppliedToJob(job) && styles.appliedButton
            ]}
            onPress={() => handleApplyForJob(job.id)}
            disabled={applyingJobId === job.id || hasAppliedToJob(job)}
          >
            {applyingJobId === job.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.applyButtonText}>
                {hasAppliedToJob(job) ? 'Applied' : 'Apply'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Job Type</Text>
              {['all', 'FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterOption,
                    selectedJobType === type && styles.selectedFilterOption
                  ]}
                  onPress={() => setSelectedJobType(type)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedJobType === type && styles.selectedFilterOptionText
                  ]}>
                    {type === 'all' ? 'All Types' : type.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Experience Level</Text>
              {['all', 'ENTRY_LEVEL', 'INTERMEDIATE', 'SENIOR'].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.filterOption,
                    selectedExperience === level && styles.selectedFilterOption
                  ]}
                  onPress={() => setSelectedExperience(level)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedExperience === level && styles.selectedFilterOptionText
                  ]}>
                    {level === 'all' ? 'All Levels' : level.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Location</Text>
              {['all', 'remote', 'new york', 'san francisco', 'chicago', 'boston'].map(location => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.filterOption,
                    selectedLocation === location && styles.selectedFilterOption
                  ]}
                  onPress={() => setSelectedLocation(location)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedLocation === location && styles.selectedFilterOptionText
                  ]}>
                    {location === 'all' ? 'All Locations' : location}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilters(false)}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderJobModal = () => (
    <Modal
      visible={showJobModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowJobModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Job Details</Text>
            <TouchableOpacity onPress={() => setShowJobModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {selectedJob && (
            <ScrollView style={styles.jobModalContent}>
              <Text style={styles.jobModalTitle}>{selectedJob.title}</Text>
              <Text style={styles.jobModalCompany}>{selectedJob.business?.businessName}</Text>
              
              <View style={styles.jobModalBadges}>
                <View style={[styles.badge, { backgroundColor: getJobTypeColor(selectedJob.type) + '20' }]}>
                  <Text style={[styles.badgeText, { color: getJobTypeColor(selectedJob.type) }]}>
                    {selectedJob.type.replace('_', ' ')}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getExperienceColor(selectedJob.experienceLevel) + '20' }]}>
                  <Text style={[styles.badgeText, { color: getExperienceColor(selectedJob.experienceLevel) }]}>
                    {selectedJob.experienceLevel.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.jobModalMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>{selectedJob.location}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>{formatDate(selectedJob.createdAt)}</Text>
                </View>
                {selectedJob.salary && (
                  <View style={styles.metaItem}>
                    <Ionicons name="cash" size={16} color="#6B7280" />
                    <Text style={styles.metaText}>{selectedJob.salary}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.jobModalDescription}>{selectedJob.description}</Text>

              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <View style={styles.jobModalSection}>
                  <Text style={styles.sectionTitle}>Requirements</Text>
                  {selectedJob.requirements.map((req, index) => (
                    <Text key={index} style={styles.listItem}>• {req}</Text>
                  ))}
                </View>
              )}

              {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                <View style={styles.jobModalSection}>
                  <Text style={styles.sectionTitle}>Responsibilities</Text>
                  {selectedJob.responsibilities.map((resp, index) => (
                    <Text key={index} style={styles.listItem}>• {resp}</Text>
                  ))}
                </View>
              )}

              {user?.role === UserRole.STUDENT && (
                <TouchableOpacity
                  style={[
                    styles.applyButton,
                    hasAppliedToJob(selectedJob) && styles.appliedButton
                  ]}
                  onPress={() => {
                    handleApplyForJob(selectedJob.id);
                    setShowJobModal(false);
                  }}
                  disabled={applyingJobId === selectedJob.id || hasAppliedToJob(selectedJob)}
                >
                  {applyingJobId === selectedJob.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.applyButtonText}>
                      {hasAppliedToJob(selectedJob) ? 'Applied' : 'Apply Now'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

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
            <Text style={styles.title}>Jobs</Text>
            <Text style={styles.subtitle}>Find opportunities that match your skills</Text>
          </View>
          <View style={styles.headerActions}>
            {user?.role === UserRole.BUSINESS && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.navigate('PostJob' as never)}
              >
                <Ionicons name="add" size={20} color="#6A0032" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
          <Ionicons name="filter" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="briefcase" size={20} color="#6A0032" />
          <Text style={styles.statNumber}>{filteredJobs.length}</Text>
          <Text style={styles.statLabel}>Jobs Found</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={20} color="#6A0032" />
          <Text style={styles.statNumber}>
            {filteredJobs.filter(job => new Date(job.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
          </Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="location" size={20} color="#6A0032" />
          <Text style={styles.statNumber}>
            {new Set(filteredJobs.map(job => job.location)).size}
          </Text>
          <Text style={styles.statLabel}>Locations</Text>
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {isLoading ? 'Loading jobs...' : `${filteredJobs.length} job${filteredJobs.length !== 1 ? 's' : ''} found`}
        </Text>
      </View>

      {/* Job Listings */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A0032" />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={64} color="#6B7280" />
          <Text style={styles.emptyText}>No jobs found</Text>
          <Text style={styles.emptySubtext}>
            {searchTerm || selectedJobType !== 'all' || selectedExperience !== 'all' || selectedLocation !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Check back later for new opportunities'
            }
          </Text>
          {(searchTerm || selectedJobType !== 'all' || selectedExperience !== 'all' || selectedLocation !== 'all') && (
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={renderJobCard}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          style={styles.jobList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderFilters()}
      {renderJobModal()}
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
    marginBottom: 20,
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    backgroundColor: '#6A0032',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6A0032',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  jobList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  companyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  badgeContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  jobDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobMeta: {
    flex: 1,
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
  applyButton: {
    backgroundColor: '#6A0032',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#6A0032',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  appliedButton: {
    backgroundColor: '#10B981',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
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
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6A0032',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  clearFiltersButton: {
    backgroundColor: '#6A0032',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 20,
  },
  clearFiltersButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  filterContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  selectedFilterOption: {
    backgroundColor: '#8F1A27',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#4B5563',
  },
  selectedFilterOptionText: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  jobModalContent: {
    padding: 20,
  },
  jobModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  jobModalCompany: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  jobModalBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  jobModalMeta: {
    marginBottom: 20,
  },
  jobModalDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 20,
  },
  jobModalSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  listItem: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    // paddingHorizontal: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8F1A27',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '600',
  },
});

export default JobsScreen; 