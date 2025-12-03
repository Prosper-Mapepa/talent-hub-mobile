import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { useAppSelector } from '../../store';
import apiService from '../../services/api';
import { Job, Application } from '../../types';

const CATEGORIES = [
  'Design',
  'Development',
  'Writing & Translation',
  'Marketing',
  'Business',
  'Other',
];
const SKILLS = [
  'UI/UX Design',
  'Graphic Design',
  'Web Development',
  'Mobile Development',
  'Content Writing',
  'Data Analysis',
];
const TIMELINES = [
  'less-than-week',
  '1-2-weeks',
  '2-4-weeks',
  '1-3-months',
  '3-plus-months',
];
const VISIBILITIES = [
  'public',
  'invite',
];

const BusinessDashboardScreen: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    category: '',
    description: '',
    skills: [] as string[],
    budgetType: 'fixed',
    budgetMin: '',
    budgetMax: '',
    timeline: '',
    visibility: 'public',
  });
  const [showAppsModal, setShowAppsModal] = useState(false);
  const [selectedJobApps, setSelectedJobApps] = useState<Application[]>([]);
  const [appsJobTitle, setAppsJobTitle] = useState('');

  // Fetch jobs
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const jobs = await apiService.getBusinessJobs();
      setJobs(jobs);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchJobs(); }, []);

  // Open add/edit job modal
  const openJobModal = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setJobForm({
        title: job.title,
        category: '', // Not on Job, leave blank
        description: job.description,
        skills: [], // Not on Job, leave empty
        budgetType: 'fixed', // Not on Job, default
        budgetMin: '', // Not on Job, default
        budgetMax: '', // Not on Job, default
        timeline: '', // Not on Job, default
        visibility: 'public', // Not on Job, default
      });
    } else {
      setEditingJob(null);
      setJobForm({ title: '', category: '', description: '', skills: [], budgetType: 'fixed', budgetMin: '', budgetMax: '', timeline: '', visibility: 'public' });
    }
    setShowJobModal(true);
  };

  // Save job (add or update)
  const saveJob = async () => {
    const data = {
      // Web fields (for display only, not used by backend)
      category: jobForm.category,
      skills: jobForm.skills,
      budgetType: jobForm.budgetType,
      budgetMin: jobForm.budgetMin ? Number(jobForm.budgetMin) : undefined,
      budgetMax: jobForm.budgetType === 'range' && jobForm.budgetMax ? Number(jobForm.budgetMax) : undefined,
      timeline: jobForm.timeline,
      visibility: jobForm.visibility,
      // Backend-required fields
      title: jobForm.title,
      description: jobForm.description,
      type: 'FULL_TIME' as any,
      experienceLevel: 'ENTRY_LEVEL' as any,
      location: 'Remote',
      salary: jobForm.budgetMin ? String(jobForm.budgetMin) : '',
      requirements: jobForm.skills || [],
      responsibilities: [],
      benefits: [],
    };
    setLoading(true);
    try {
      if (editingJob) {
        await apiService.updateJob(editingJob.id, data);
      } else {
        await apiService.createJob(data);
      }
      setShowJobModal(false);
      fetchJobs();
    } catch (e) {
      Alert.alert('Error', 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  // Delete job
  const deleteJob = (jobId: string) => {
    Alert.alert('Delete Job', 'Are you sure you want to delete this job?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setLoading(true);
        try {
          await apiService.deleteJob(jobId);
          fetchJobs();
        } catch (e) {
          Alert.alert('Error', 'Failed to delete job');
        } finally {
          setLoading(false);
        }
      }}
    ]);
  };

  // View applications
  const viewApplications = (job: Job) => {
    setSelectedJobApps(job.applications || []);
    setAppsJobTitle(job.title);
    setShowAppsModal(true);
  };

  // Render job item
  const renderJob = ({ item }: { item: Job }) => (
    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.title}</Text>
      <Text style={{ color: '#6B7280', marginBottom: 4 }}>{item.type?.replace('_', ' ')} | {item.experienceLevel?.replace('_', ' ')}</Text>
      <Text style={{ color: '#6B7280', marginBottom: 4 }}>{item.location}</Text>
      <Text numberOfLines={2} style={{ color: '#4B5563', marginBottom: 8 }}>{item.description}</Text>
      <Text style={{ color: '#6B7280', marginBottom: 4 }}>{item.salary ? `Salary: $${item.salary}` : ''}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity style={{ backgroundColor: '#6A0032', borderRadius: 8, padding: 8, flex: 1, alignItems: 'center' }} onPress={() => openJobModal(item)}>
          <Text style={{ color: '#fff' }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ backgroundColor: '#EF4444', borderRadius: 8, padding: 8, flex: 1, alignItems: 'center' }} onPress={() => deleteJob(item.id)}>
          <Text style={{ color: '#fff' }}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ backgroundColor: '#3B82F6', borderRadius: 8, padding: 8, flex: 1, alignItems: 'center' }} onPress={() => viewApplications(item)}>
          <Text style={{ color: '#fff' }}>Applications</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render application item
  const renderApp = ({ item }: { item: Application }) => (
    <View style={{ backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12, marginBottom: 10 }}>
      <Text style={{ fontWeight: 'bold' }}>{item.student?.user?.firstName} {item.student?.user?.lastName}</Text>
      <Text style={{ color: '#6B7280' }}>{item.student?.user?.email}</Text>
      <Text style={{ color: '#4B5563', marginTop: 4 }}>{item.coverLetter}</Text>
      <Text style={{ color: '#6B7280', marginTop: 4 }}>Status: {item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Business Dashboard</Text>
      <Text style={styles.subtitle}>Manage your jobs and applications</Text>
      <TouchableOpacity style={{ backgroundColor: '#10B981', borderRadius: 8, padding: 12, alignItems: 'center', marginVertical: 16 }} onPress={() => openJobModal()}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add Job</Text>
      </TouchableOpacity>
      {loading ? <ActivityIndicator size="large" color="#6A0032" /> : (
        <FlatList
          data={jobs}
          renderItem={renderJob}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
      {/* Job Modal */}
      <Modal visible={showJobModal} animationType="slide" transparent onRequestClose={() => setShowJobModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%' }}>
            <ScrollView>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>{editingJob ? 'Edit Job' : 'Add Job'}</Text>
              <TextInput style={modalInput} placeholder="Title" value={jobForm.title} onChangeText={t => setJobForm(f => ({ ...f, title: t }))} />
              {/* Category Picker */}
              <Text style={{ marginTop: 8, marginBottom: 4 }}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={{
                      backgroundColor: jobForm.category === cat ? '#6A0032' : '#E5E7EB',
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      marginRight: 8,
                    }}
                    onPress={() => setJobForm(f => ({ ...f, category: cat }))}
                  >
                    <Text style={{ color: jobForm.category === cat ? '#fff' : '#333' }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput style={modalInput} placeholder="Description" value={jobForm.description} onChangeText={t => setJobForm(f => ({ ...f, description: t }))} multiline />
              {/* Skills checkboxes */}
              <Text style={{ marginTop: 8, marginBottom: 4 }}>Skills</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                {SKILLS.map(skill => (
                  <TouchableOpacity
                    key={skill}
                    style={{
                      backgroundColor: jobForm.skills.includes(skill) ? '#6A0032' : '#E5E7EB',
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                    onPress={() => setJobForm(f => ({
                      ...f,
                      skills: f.skills.includes(skill)
                        ? f.skills.filter(s => s !== skill)
                        : [...f.skills, skill],
                    }))}
                  >
                    <Text style={{ color: jobForm.skills.includes(skill) ? '#fff' : '#333' }}>{skill}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Budget Type Picker */}
              <Text style={{ marginTop: 8, marginBottom: 4 }}>Budget Type</Text>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: jobForm.budgetType === 'fixed' ? '#6A0032' : '#E5E7EB',
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    marginRight: 8,
                  }}
                  onPress={() => setJobForm(f => ({ ...f, budgetType: 'fixed' }))}
                >
                  <Text style={{ color: jobForm.budgetType === 'fixed' ? '#fff' : '#333' }}>Fixed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: jobForm.budgetType === 'range' ? '#6A0032' : '#E5E7EB',
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                  }}
                  onPress={() => setJobForm(f => ({ ...f, budgetType: 'range' }))}
                >
                  <Text style={{ color: jobForm.budgetType === 'range' ? '#fff' : '#333' }}>Range</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={modalInput}
                placeholder={jobForm.budgetType === 'fixed' ? 'Fixed Price ($)' : 'Minimum ($)'}
                value={jobForm.budgetMin}
                onChangeText={t => setJobForm(f => ({ ...f, budgetMin: t }))}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
              />
              {jobForm.budgetType === 'range' && (
                <TextInput
                  style={modalInput}
                  placeholder="Maximum ($)"
                  value={jobForm.budgetMax}
                  onChangeText={t => setJobForm(f => ({ ...f, budgetMax: t }))}
                  keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                />
              )}
              {/* Timeline Picker */}
              <Text style={{ marginTop: 8, marginBottom: 4 }}>Timeline</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {TIMELINES.map(tl => (
                  <TouchableOpacity
                    key={tl}
                    style={{
                      backgroundColor: jobForm.timeline === tl ? '#6A0032' : '#E5E7EB',
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      marginRight: 8,
                    }}
                    onPress={() => setJobForm(f => ({ ...f, timeline: tl }))}
                  >
                    <Text style={{ color: jobForm.timeline === tl ? '#fff' : '#333' }}>{tl.replace(/-/g, ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {/* Visibility Picker */}
              <Text style={{ marginTop: 8, marginBottom: 4 }}>Visibility</Text>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                {VISIBILITIES.map(vis => (
                  <TouchableOpacity
                    key={vis}
                    style={{
                      backgroundColor: jobForm.visibility === vis ? '#6A0032' : '#E5E7EB',
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      marginRight: 8,
                    }}
                    onPress={() => setJobForm(f => ({ ...f, visibility: vis }))}
                  >
                    <Text style={{ color: jobForm.visibility === vis ? '#fff' : '#333' }}>{vis === 'public' ? 'Public' : 'Invite Only'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#6A0032', borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={saveJob}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{editingJob ? 'Update' : 'Add'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#E5E7EB', borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={() => setShowJobModal(false)}>
                  <Text style={{ color: '#6B7280', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Applications Modal */}
      <Modal visible={showAppsModal} animationType="slide" transparent onRequestClose={() => setShowAppsModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', maxHeight: '80%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Applications for {appsJobTitle}</Text>
            <FlatList
              data={selectedJobApps}
              renderItem={renderApp}
              keyExtractor={item => item.id}
              ListEmptyComponent={<Text style={{ color: '#6B7280', textAlign: 'center' }}>No applications yet.</Text>}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
            <TouchableOpacity style={{ backgroundColor: '#E5E7EB', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 16 }} onPress={() => setShowAppsModal(false)}>
              <Text style={{ color: '#6B7280', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const modalInput = {
  backgroundColor: '#F3F4F6',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 16,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#E5E7EB',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
});

export default BusinessDashboardScreen; 