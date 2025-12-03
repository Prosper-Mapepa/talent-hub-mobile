import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { applyForJob } from '../store/slices/jobsSlice';
import { Job, JobType, ExperienceLevel } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface JobCardProps {
  job: Job;
  onPress?: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onPress }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [applying, setApplying] = React.useState(false);

  const hasAppliedToJob = () => {
    if (!user?.studentId || !job.applications) return false;
    return job.applications.some((app: any) => app.student?.id === user.studentId);
  };

  const handleApply = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to apply for jobs');
      return;
    }

    if (user.role !== 'student') {
      Alert.alert('Error', 'Only students can apply for jobs');
      return;
    }

    if (hasAppliedToJob()) {
      Alert.alert('Already Applied', 'You have already applied for this job');
      return;
    }

    setApplying(true);
    try {
      await dispatch(applyForJob({
        jobId: job.id,
        applicationData: {}
      })).unwrap();
      Alert.alert('Success', 'Application submitted successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to apply for job');
    } finally {
      setApplying(false);
    }
  };

  const getJobTypeColor = (type: JobType) => {
    switch (type) {
      case JobType.FULL_TIME:
        return '#4CAF50';
      case JobType.PART_TIME:
        return '#2196F3';
      case JobType.INTERNSHIP:
        return '#9C27B0';
      case JobType.CONTRACT:
        return '#FF9800';
      default:
        return '#666';
    }
  };

  const getExperienceColor = (level: ExperienceLevel) => {
    switch (level) {
      case ExperienceLevel.ENTRY_LEVEL:
        return '#4CAF50';
      case ExperienceLevel.INTERMEDIATE:
        return '#FF9800';
      case ExperienceLevel.SENIOR:
        return '#F44336';
      default:
        return '#666';
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

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={styles.company} numberOfLines={1}>
            {job.business?.businessName}
          </Text>
        </View>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: getJobTypeColor(job.type) + '20' }]}>
            <Text style={[styles.badgeText, { color: getJobTypeColor(job.type) }]}>
              {job.type.replace('_', ' ')}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: getExperienceColor(job.experienceLevel) + '20' }]}>
            <Text style={[styles.badgeText, { color: getExperienceColor(job.experienceLevel) }]}>
              {job.experienceLevel.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {job.description}
      </Text>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {job.location || 'Remote'}
          </Text>
        </View>
        
        {job.salary && (
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{job.salary}</Text>
          </View>
        )}
        
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {job.createdAt ? formatDate(job.createdAt) : 'N/A'}
          </Text>
        </View>
      </View>

      {user?.role === 'student' && (
        <View style={styles.applyContainer}>
          <TouchableOpacity
            style={[
              styles.applyButton,
              hasAppliedToJob() && styles.appliedButton,
              applying && styles.disabledButton,
            ]}
            onPress={handleApply}
            disabled={applying || hasAppliedToJob()}
          >
            {applying ? (
              <>
                <Ionicons name="hourglass-outline" size={16} color="white" />
                <Text style={styles.applyButtonText}>Applying...</Text>
              </>
            ) : hasAppliedToJob() ? (
              <>
                <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                <Text style={styles.applyButtonText}>Applied</Text>
              </>
            ) : (
              <>
                <Ionicons name="send-outline" size={16} color="white" />
                <Text style={styles.applyButtonText}>Apply</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  company: {
    fontSize: 14,
    color: '#666',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  applyContainer: {
    alignItems: 'flex-end',
  },
  applyButton: {
    backgroundColor: '#6A0032',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  appliedButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    opacity: 0.6,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default JobCard; 