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
  FlatList,
} from 'react-native';
import { showToast } from '../../components/ui/toast';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { logout, updateUser } from '../../store/slices/authSlice';
import { apiService } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchStudentProfile, updateStudentProfile } from '../../store/slices/studentsSlice';
import { fetchBusinessProfile, updateBusinessProfile, fetchBusinessJobs } from '../../store/slices/businessesSlice';
import { fetchStudentTalents } from '../../store/slices/talentsSlice';
import { fetchFollowers, fetchFollowing } from '../../store/slices/followsSlice';
import { Ionicons } from '@expo/vector-icons';
import { UserRole, User, Student } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { user } = useAppSelector(state => state.auth);
  const { profile: student, isLoading: studentLoading } = useAppSelector(state => state.students);
  const { profile: business, jobs: businessJobs, isLoading: businessLoading } = useAppSelector(state => state.businesses);
  const { talents, isLoading: talentsLoading } = useAppSelector(state => state.talents);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Followers/Following/Who Liked state
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showWhoLikedModal, setShowWhoLikedModal] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [whoLiked, setWhoLiked] = useState<Student[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);
  const [isLoadingWhoLiked, setIsLoadingWhoLiked] = useState(false);
  
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

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user?.role === UserRole.STUDENT) {
      dispatch(fetchStudentProfile());
      if (user?.studentId) {
        dispatch(fetchStudentTalents(user.studentId));
      }
    } else if (user?.role === UserRole.BUSINESS) {
      dispatch(fetchBusinessProfile());
      dispatch(fetchBusinessJobs());
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

  // Load followers/following/who liked counts when user is loaded
  useEffect(() => {
    if (user?.id && user?.role === UserRole.STUDENT && student?.id) {
      const loadSocialStats = async () => {
        try {
          const followersResult = await dispatch(fetchFollowers(user.id)).unwrap();
          setFollowers(followersResult.followers || []);
          const followingResult = await dispatch(fetchFollowing(user.id)).unwrap();
          setFollowing(followingResult.following || []);
          // Automatically fetch who liked
          const students = await apiService.getWhoLikedTalents(student.id);
          setWhoLiked(students || []);
        } catch (error) {
          console.error('Error loading social stats:', error);
        }
      };
      loadSocialStats();
    }
  }, [user?.id, user?.role, student?.id, dispatch]);

  const handleShowFollowers = async () => {
    if (!user?.id) {
      showToast('Unable to find user information', 'error');
      return;
    }
    setIsLoadingFollowers(true);
    setShowFollowersModal(true);
    try {
      const result = await dispatch(fetchFollowers(user.id)).unwrap();
      setFollowers(result.followers || []);
    } catch (error: any) {
      console.error('Error fetching followers:', error);
      showToast('Failed to load followers', 'error');
      setShowFollowersModal(false);
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const handleShowFollowing = async () => {
    if (!user?.id) {
      showToast('Unable to find user information', 'error');
      return;
    }
    setIsLoadingFollowing(true);
    setShowFollowingModal(true);
    try {
      const result = await dispatch(fetchFollowing(user.id)).unwrap();
      setFollowing(result.following || []);
    } catch (error: any) {
      console.error('Error fetching following:', error);
      showToast('Failed to load following list', 'error');
      setShowFollowingModal(false);
    } finally {
      setIsLoadingFollowing(false);
    }
  };

  const handleShowWhoLiked = async () => {
    if (!student?.id) return;
    setIsLoadingWhoLiked(true);
    setShowWhoLikedModal(true);
    try {
      const students = await apiService.getWhoLikedTalents(student.id);
      setWhoLiked(students || []);
    } catch (error: any) {
      console.error('Error fetching who liked:', error);
      showToast('Failed to load who liked content', 'error');
    } finally {
      setIsLoadingWhoLiked(false);
    }
  };

  const handleLogout = () => {
    showToast(
      'Are you sure you want to logout?',
      'warning',
      {
        text: 'Logout',
        onPress: () => dispatch(logout()),
      }
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteAccount();
              showToast('Account deleted successfully', 'success');
              // Logout after successful deletion
              dispatch(logout());
            } catch (error: any) {
              console.error('Error deleting account:', error);
              showToast(
                error.message || 'Failed to delete account. Please try again.',
                'error'
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Update email if it changed
      if (editForm.email && editForm.email !== user?.email) {
        try {
          await apiService.updateEmail(editForm.email);
          // Update user in Redux store and AsyncStorage
          const updatedUser = { ...user, email: editForm.email };
          dispatch(updateUser(updatedUser as any));
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error: any) {
          showToast(error.message || 'Failed to update email', 'error');
          setSaving(false);
          return;
        }
      }

      // Update profile data
      if (user?.role === UserRole.STUDENT) {
        await dispatch(updateStudentProfile({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          major: editForm.major as any,
          graduationYear: parseInt(editForm.year) || 0,
          bio: editForm.bio,
        })).unwrap();
        showToast('Profile updated successfully!', 'success');
      } else if (user?.role === UserRole.BUSINESS) {
        await dispatch(updateBusinessProfile({
          businessName: editForm.businessName,
          businessType: editForm.businessType as any,
          location: editForm.location,
          description: editForm.description,
        })).unwrap();
        showToast('Profile updated successfully!', 'success');
      }
      setShowEditModal(false);
    } catch (error) {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const handleChangePassword = async () => {
    // Clear previous errors
    setPasswordErrors({});

    // Validate all fields are filled
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors({ confirmPassword: 'New passwords do not match' });
      showToast('New passwords do not match', 'error');
      return;
    }

    // Validate password length
    if (passwordForm.newPassword.length < 8) {
      setPasswordErrors({ newPassword: 'Password must be at least 8 characters' });
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    // Validate password requirements (uppercase, lowercase, number, special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      setPasswordErrors({ newPassword: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)' });
      showToast('Password must contain uppercase, lowercase, number, and special character (@$!%*?&)', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      await apiService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      showToast('Password changed successfully!', 'success');
      setPasswordErrors({});
      setShowChangePasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: any) {
      // Extract error message from response
      let errorMessage = 'Failed to change password';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Handle specific error cases
      if (errorMessage.toLowerCase().includes('current password') || 
          errorMessage.toLowerCase().includes('invalid') ||
          error.response?.status === 401) {
        setPasswordErrors({ currentPassword: 'Current password is incorrect' });
        showToast('Current password is incorrect', 'error');
      } else if (errorMessage.toLowerCase().includes('password') && errorMessage.toLowerCase().includes('match')) {
        setPasswordErrors({ confirmPassword: 'New passwords do not match' });
        showToast(errorMessage, 'error');
      } else {
        showToast(errorMessage, 'error');
        
        // If authentication failed, suggest re-login
        if (errorMessage.includes('logged in') || errorMessage.includes('Authentication failed')) {
          setTimeout(() => {
            showToast('Please log out and log back in, then try again', 'info');
          }, 2000);
        }
      }
    } finally {
      setChangingPassword(false);
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
      <View style={styles.bioSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="chatbubble-ellipses" size={20} color="#6A0032" />
          <Text style={styles.sectionTitle}>About Me</Text>
        </View>
        <TouchableOpacity 
          style={styles.bioCard}
          onPress={() => setShowEditModal(true)}
          activeOpacity={0.7}
        >
          {student?.bio ? (
            <Text style={styles.bioText}>{student.bio}</Text>
          ) : (
            <View style={styles.emptyBioContainer}>
              <Ionicons name="add-circle-outline" size={24} color="#9CA3AF" />
              <Text style={styles.emptyBioText}>Tap to add your bio</Text>
            </View>
          )}
          <View style={styles.bioEditHint}>
            <Ionicons name="create-outline" size={16} color="#8F1A27" />
            <Text style={styles.bioEditHintText}>Edit</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Followers/Following/Liked Stats */}
      {user?.role === UserRole.STUDENT && (
        <View style={styles.socialStatsSection}>
          <View style={styles.socialStatsRow}>
            <TouchableOpacity style={styles.socialStatButton} onPress={handleShowFollowers}>
              <Text style={styles.socialStatNumber}>{followers.length}</Text>
              <Text style={styles.socialStatLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialStatButton} onPress={handleShowFollowing}>
              <Text style={styles.socialStatNumber}>{following.length}</Text>
              <Text style={styles.socialStatLabel}>Following</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialStatButton} onPress={handleShowWhoLiked}>
              <Text style={styles.socialStatNumber}>{whoLiked.length}</Text>
              <Text style={styles.socialStatLabel}>Liked</Text>
            </TouchableOpacity>
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

      {/* Security Section */}
      <View style={styles.securitySection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="lock-closed" size={20} color="#6A0032" />
          <Text style={styles.sectionTitle}>Security</Text>
        </View>
        <TouchableOpacity style={styles.changePasswordButton} onPress={() => setShowChangePasswordModal(true)}>
          <View style={styles.changePasswordButtonContent}>
            <Ionicons name="key" size={20} color="#6A0032" />
            <Text style={styles.changePasswordButtonText}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerZone}>
        <View style={styles.dangerZoneHeader}>
          <Ionicons name="warning" size={20} color="#EF4444" />
          <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
        </View>
        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
          <Ionicons name="trash" size={20} color="#EF4444" />
          <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
        </TouchableOpacity>
        <Text style={styles.dangerZoneSubtext}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </Text>
      </View>
    </ScrollView>
  );

  const renderBusinessProfile = () => {
    const businessInitial = business?.businessName?.charAt(0) || user?.email?.charAt(0) || '?';
    const jobs = businessJobs || [];

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.businessProfileCard}>
          <View style={styles.businessProfileHeader}>
            <View style={styles.businessAvatar}>
              <Text style={styles.businessAvatarText}>{businessInitial}</Text>
            </View>
            <View style={styles.businessProfileInfo}>
              <Text style={styles.businessName}>{business?.businessName || 'Business'}</Text>
              <View style={styles.businessInfoChips}>
                <View style={styles.businessInfoChip}>
                  <Ionicons name="briefcase-outline" size={12} color="#6b7280" />
                  <Text style={styles.businessInfoChipText}>Business</Text>
                </View>
                {business?.businessType && (
                  <View style={styles.businessInfoChip}>
                    <Ionicons name="business-outline" size={12} color="#6b7280" />
                    <Text style={styles.businessInfoChipText} numberOfLines={1}>
                      {business.businessType.replace('_', ' ')}
                    </Text>
                  </View>
                )}
                {business?.location && (
                  <View style={styles.businessInfoChip}>
                    <Ionicons name="location-outline" size={12} color="#6b7280" />
                    <Text style={styles.businessInfoChipText} numberOfLines={1}>
                      {business.location}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.businessSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#8F1A27" />
            <Text style={styles.sectionTitle}>Description</Text>
          </View>
          <TouchableOpacity
            style={styles.businessBioCard}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.7}
          >
            {business?.description ? (
              <Text style={styles.businessBioText}>{business.description}</Text>
            ) : (
              <View style={styles.emptyBioContainer}>
                <Ionicons name="add-circle-outline" size={24} color="#9CA3AF" />
                <Text style={styles.emptyBioText}>Tap to add your business description</Text>
              </View>
            )}
            <View style={styles.bioEditHint}>
              <Ionicons name="create-outline" size={16} color="#8F1A27" />
              <Text style={styles.bioEditHintText}>Edit</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Business Information */}
        <View style={styles.businessSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color="#8F1A27" />
            <Text style={styles.sectionTitle}>Business Information</Text>
          </View>
          <View style={styles.businessInfoCard}>
            <View style={styles.businessInfoRow}>
              <View style={styles.businessInfoLeft}>
                <Ionicons name="business" size={18} color="#6b7280" />
                <Text style={styles.businessInfoLabel}>Business Name</Text>
              </View>
              <Text style={styles.businessInfoValue} numberOfLines={1}>
                {business?.businessName || 'Not set'}
              </Text>
            </View>
            <View style={styles.businessInfoDivider} />
            <View style={styles.businessInfoRow}>
              <View style={styles.businessInfoLeft}>
                <Ionicons name="mail" size={18} color="#6b7280" />
                <Text style={styles.businessInfoLabel}>Email</Text>
              </View>
              <Text style={styles.businessInfoValue} numberOfLines={1}>
                {user?.email || 'Not set'}
              </Text>
            </View>
            {business?.businessType && (
              <>
                <View style={styles.businessInfoDivider} />
                <View style={styles.businessInfoRow}>
                  <View style={styles.businessInfoLeft}>
                    <Ionicons name="briefcase" size={18} color="#6b7280" />
                    <Text style={styles.businessInfoLabel}>Business Type</Text>
                  </View>
                  <Text style={styles.businessInfoValue} numberOfLines={1}>
                    {business.businessType.replace('_', ' ')}
                  </Text>
                </View>
              </>
            )}
            {business?.location && (
              <>
                <View style={styles.businessInfoDivider} />
                <View style={styles.businessInfoRow}>
                  <View style={styles.businessInfoLeft}>
                    <Ionicons name="location" size={18} color="#6b7280" />
                    <Text style={styles.businessInfoLabel}>Location</Text>
                  </View>
                  <Text style={styles.businessInfoValue} numberOfLines={1}>
                    {business.location}
                  </Text>
                </View>
              </>
            )}
            {business?.website && (
              <>
                <View style={styles.businessInfoDivider} />
                <View style={styles.businessInfoRow}>
                  <View style={styles.businessInfoLeft}>
                    <Ionicons name="globe" size={18} color="#6b7280" />
                    <Text style={styles.businessInfoLabel}>Website</Text>
                  </View>
                  <Text style={styles.businessInfoValue} numberOfLines={1}>
                    {business.website}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Job Postings */}
        <View style={styles.businessSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase" size={20} color="#8F1A27" />
            <Text style={styles.sectionTitle}>Job Postings</Text>
            <Text style={styles.sectionSubtitle}>{jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}</Text>
          </View>
          <View style={styles.businessInfoCard}>
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  style={styles.businessJobItem}
                  onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Dashboard' })}
                >
                  <View style={styles.businessJobContent}>
                    <Text style={styles.businessJobTitle} numberOfLines={1}>{job.title}</Text>
                    <View style={styles.businessJobMeta}>
                      <View style={styles.businessJobBadge}>
                        <Text style={styles.businessJobBadgeText}>
                          {job.type.replace('_', ' ')}
                        </Text>
                      </View>
                      <View style={styles.businessJobBadge}>
                        <Text style={styles.businessJobBadgeText}>
                          {job.experienceLevel.replace('_', ' ')}
                        </Text>
                      </View>
                      {job.applications && job.applications.length > 0 && (
                        <View style={[styles.businessJobBadge, styles.applicationBadge]}>
                          <Ionicons name="people" size={12} color="#8F1A27" />
                          <Text style={[styles.businessJobBadgeText, styles.applicationBadgeText]}>
                            {job.applications.length} {job.applications.length === 1 ? 'application' : 'applications'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.businessEmptyContainer}>
                <Ionicons name="briefcase-outline" size={48} color="#d1d5db" />
                <Text style={styles.businessEmptyText}>No job postings yet</Text>
                <Text style={styles.businessEmptySubtext}>
                  Create your first job posting to attract talent
                </Text>
                <TouchableOpacity
                  style={styles.businessEmptyButton}
                  onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Dashboard' })}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.businessEmptyButtonText}>Go to Dashboard</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.securitySection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={20} color="#6A0032" />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          <TouchableOpacity style={styles.changePasswordButton} onPress={() => setShowChangePasswordModal(true)}>
            <View style={styles.changePasswordButtonContent}>
              <Ionicons name="key" size={20} color="#6A0032" />
              <Text style={styles.changePasswordButtonText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <View style={styles.dangerZoneHeader}>
            <Ionicons name="warning" size={20} color="#EF4444" />
            <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
          </View>
          <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
            <Ionicons name="trash" size={20} color="#EF4444" />
            <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
          </TouchableOpacity>
          <Text style={styles.dangerZoneSubtext}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEditModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {user?.role === UserRole.STUDENT ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.email}
                    onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
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
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.email}
                    onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
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
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.8}
              style={styles.saveButtonWrapper}
            >
              <LinearGradient
                colors={['#8F1A27', '#6A0032', '#8F1A27']}
                style={styles.saveButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderChangePasswordModal = () => (
    <Modal
      visible={showChangePasswordModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowChangePasswordModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={() => {
              setShowChangePasswordModal(false);
              setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
              setShowCurrentPassword(false);
              setShowNewPassword(false);
              setShowConfirmPassword(false);
              setPasswordErrors({});
            }}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={[styles.passwordInputContainer, passwordErrors.currentPassword && styles.inputError]}>
                <TextInput
                  style={[styles.input, styles.passwordInput, passwordErrors.currentPassword && styles.inputErrorBorder]}
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => {
                    setPasswordForm({ ...passwordForm, currentPassword: text });
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors({ ...passwordErrors, currentPassword: undefined });
                    }
                  }}
                  placeholder="Enter current password"
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showCurrentPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
              {passwordErrors.currentPassword && (
                <Text style={styles.errorText}>{passwordErrors.currentPassword}</Text>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={[styles.passwordInputContainer, passwordErrors.newPassword && styles.inputError]}>
                <TextInput
                  style={[styles.input, styles.passwordInput, passwordErrors.newPassword && styles.inputErrorBorder]}
                  value={passwordForm.newPassword}
                  onChangeText={(text) => {
                    setPasswordForm({ ...passwordForm, newPassword: text });
                    if (passwordErrors.newPassword) {
                      setPasswordErrors({ ...passwordErrors, newPassword: undefined });
                    }
                  }}
                  placeholder="Enter new password"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
              {passwordErrors.newPassword && (
                <Text style={styles.errorText}>{passwordErrors.newPassword}</Text>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={[styles.passwordInputContainer, passwordErrors.confirmPassword && styles.inputError]}>
                <TextInput
                  style={[styles.input, styles.passwordInput, passwordErrors.confirmPassword && styles.inputErrorBorder]}
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => {
                    setPasswordForm({ ...passwordForm, confirmPassword: text });
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors({ ...passwordErrors, confirmPassword: undefined });
                    }
                  }}
                  placeholder="Confirm new password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
              {passwordErrors.confirmPassword && (
                <Text style={styles.errorText}>{passwordErrors.confirmPassword}</Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowChangePasswordModal(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
              disabled={changingPassword}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={changingPassword}
              activeOpacity={0.8}
              style={styles.saveButtonWrapper}
            >
              <LinearGradient
                colors={['#8F1A27', '#6A0032', '#8F1A27']}
                style={styles.saveButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Change Password</Text>
                )}
              </LinearGradient>
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
      {renderChangePasswordModal()}

      {/* Followers Modal */}
      {showFollowersModal && (
        <Modal
          visible={showFollowersModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFollowersModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.modalTitle}>Followers</Text>
                <TouchableOpacity
                  onPress={() => setShowFollowersModal(false)}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {isLoadingFollowers ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color="#8F1A27" />
                  </View>
                ) : followers.length === 0 ? (
                  <View style={styles.modalEmptyContainer}>
                    <Ionicons name="people-outline" size={48} color="#d1d5db" />
                    <Text style={styles.modalEmptyText}>No followers yet</Text>
                  </View>
                ) : (
                  followers.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.modalListItem}
                      onPress={() => {
                        setShowFollowersModal(false);
                        if (item.studentId) {
                          navigation.navigate('StudentProfile', { studentId: item.studentId });
                        }
                      }}
                    >
                      <View style={styles.modalListAvatar}>
                        <Text style={styles.modalListAvatarText}>
                          {item.firstName?.[0]?.toUpperCase() || item.email?.[0]?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View style={styles.modalListInfo}>
                        <Text style={styles.modalListName}>
                          {item.firstName && item.lastName
                            ? `${item.firstName} ${item.lastName}`
                            : item.email || 'Unknown User'}
                        </Text>
                        <Text style={styles.modalListEmail}>{item.email}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <Modal
          visible={showFollowingModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFollowingModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.modalTitle}>Following</Text>
                <TouchableOpacity
                  onPress={() => setShowFollowingModal(false)}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {isLoadingFollowing ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color="#8F1A27" />
                  </View>
                ) : following.length === 0 ? (
                  <View style={styles.modalEmptyContainer}>
                    <Ionicons name="people-outline" size={48} color="#d1d5db" />
                    <Text style={styles.modalEmptyText}>Not following anyone yet</Text>
                  </View>
                ) : (
                  following.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.modalListItem}
                      onPress={() => {
                        setShowFollowingModal(false);
                        if (item.studentId) {
                          navigation.navigate('StudentProfile', { studentId: item.studentId });
                        }
                      }}
                    >
                      <View style={styles.modalListAvatar}>
                        <Text style={styles.modalListAvatarText}>
                          {item.firstName?.[0]?.toUpperCase() || item.email?.[0]?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View style={styles.modalListInfo}>
                        <Text style={styles.modalListName}>
                          {item.firstName && item.lastName
                            ? `${item.firstName} ${item.lastName}`
                            : item.email || 'Unknown User'}
                        </Text>
                        <Text style={styles.modalListEmail}>{item.email}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Who Liked Modal */}
      {showWhoLikedModal && (
        <Modal
          visible={showWhoLikedModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowWhoLikedModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.modalTitle}>Who Liked Content</Text>
                <TouchableOpacity
                  onPress={() => setShowWhoLikedModal(false)}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {isLoadingWhoLiked ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color="#8F1A27" />
                  </View>
                ) : whoLiked.length === 0 ? (
                  <View style={styles.modalEmptyContainer}>
                    <Ionicons name="heart-outline" size={48} color="#d1d5db" />
                    <Text style={styles.modalEmptyText}>No one has liked content yet</Text>
                  </View>
                ) : (
                  whoLiked.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.modalListItem}
                      onPress={() => {
                        setShowWhoLikedModal(false);
                        navigation.navigate('StudentProfile', { studentId: item.id });
                      }}
                    >
                      <View style={styles.modalListAvatar}>
                        <Text style={styles.modalListAvatarText}>
                          {item.firstName?.[0]?.toUpperCase() || item.user?.firstName?.[0]?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View style={styles.modalListInfo}>
                        <Text style={styles.modalListName}>
                          {item.firstName && item.lastName
                            ? `${item.firstName} ${item.lastName}`
                            : item.user?.email || 'Unknown User'}
                        </Text>
                        {item.user?.email && (
                          <Text style={styles.modalListEmail}>{item.user.email}</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
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
  passwordInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
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
    backgroundColor: '#fff',
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
  saveButtonWrapper: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6A0032',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    minHeight: 80,
  },
  emptyBioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyBioText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  bioEditHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 6,
  },
  bioEditHintText: {
    fontSize: 12,
    color: '#8F1A27',
    fontWeight: '500',
  },

  // Social Stats Section
  socialStatsSection: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  socialStatsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  socialStatButton: {
    alignItems: 'center',
    flex: 1,
  },
  socialStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6A0032',
    marginBottom: 4,
  },
  socialStatLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
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
  securitySection: {
    marginBottom: 24,
  },
  changePasswordButton: {
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
    marginTop: 12,
  },
  changePasswordButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  changePasswordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  dangerZone: {
    // marginTop: 10,
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#991B1B',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  deleteAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  dangerZoneSubtext: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 18,
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

  // Business Profile Styles
  businessProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  businessProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#8F1A27',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  businessAvatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  businessProfileInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  businessInfoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  businessInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  businessInfoChipText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
    maxWidth: 120,
  },
  businessSection: {
    marginBottom: 16,
  },
  businessBioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 80,
  },
  businessBioText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  businessInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  businessInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  businessInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  businessInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  businessInfoValue: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  businessInfoDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 4,
  },
  businessJobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  businessJobContent: {
    flex: 1,
    marginRight: 12,
  },
  businessJobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  businessJobMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  businessJobBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  businessJobBadgeText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  applicationBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  applicationBadgeText: {
    color: '#8F1A27',
  },
  businessEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  businessEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 4,
  },
  businessEmptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  businessEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A0032',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  businessEmptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Modal list styles for followers/following
  modalLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
  },
  modalListAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8F1A27',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalListAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalListInfo: {
    flex: 1,
  },
  modalListName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  modalListEmail: {
    fontSize: 13,
    color: '#6b7280',
  },
});

export default ProfileScreen; 