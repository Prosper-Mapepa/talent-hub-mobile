import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useAppSelector } from '../../store';

const { width } = Dimensions.get('window');

interface StudentProfileScreenProps {
  route: {
    params: {
      student: {
        id: string;
        firstName: string;
        lastName: string;
        major?: string;
        graduationYear?: number;
        year?: string;
        gpa?: number;
        availability?: string;
        bio?: string;
        about?: string;
        profileViews?: number;
        resume?: string;
        profileImage?: string;
        achievements?: Array<{
          id: string;
          title: string;
          description: string;
          date: string;
          imageUrl?: string;
          certificateUrl?: string;
        }>;
        projects?: Array<{
          id: string;
          title: string;
          description: string;
          technologies?: string[];
          imageUrl?: string;
          githubUrl?: string;
          liveUrl?: string;
          createdAt: string;
        }>;
        skills?: Array<{
          id: string;
          name: string;
          proficiency: string;
          category: string;
        }>;
        talents?: Array<{
          id: string;
          title: string;
          description: string;
          category: string;
          files?: string[];
        }>;
      };
    };
  };
}

export default function StudentProfileScreen() {
  const route = useRoute<StudentProfileScreenProps['route']>();
  const navigation = useNavigation<any>();
  const { student } = route.params;
  const { user } = useAppSelector((state) => state.auth);
  
  const [refreshing, setRefreshing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    // Check if this is the current user's profile
    setIsOwnProfile(user?.studentId === student.id);
  }, [user, student]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Add refresh logic here if needed
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditStudentProfile', { student });
  };

  const handleContact = () => {
    Alert.alert(
      'Contact Student',
      `Would you like to contact ${student.firstName} ${student.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Message', onPress: () => navigation.navigate('Messages') },
      ]
    );
  };

  const handleResumeView = () => {
    if (student.resume) {
      // Navigate to resume viewer or open PDF
      Alert.alert(
        'View Resume',
        'Resume viewing functionality will be implemented here.',
        [
          { text: 'OK', style: 'default' },
        ]
      );
    }
  };

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    
    const baseUrl = process.env.API_BASE_URL || 'http://35.32.68.239:3001';
    return `${baseUrl}${filePath}`;
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'EXPERT': return '#10b981';
      case 'ADVANCED': return '#3b82f6';
      case 'INTERMEDIATE': return '#f59e0b';
      case 'BEGINNER': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderAchievement = (achievement: any) => (
    <Card key={achievement.id} style={styles.achievementCard}>
      <CardContent style={styles.achievementContent}>
        {achievement.imageUrl && (
          <Image
            source={{ uri: getFileUrl(achievement.imageUrl) }}
            style={styles.achievementImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.achievementText}>
          <Text style={styles.achievementTitle}>{achievement.title}</Text>
          <Text style={styles.achievementDescription}>{achievement.description}</Text>
          <Text style={styles.achievementDate}>{achievement.date}</Text>
        </View>
      </CardContent>
    </Card>
  );

  const renderProject = (project: any) => (
    <Card key={project.id} style={styles.projectCard}>
      <CardContent style={styles.projectContent}>
        {project.imageUrl && (
          <Image
            source={{ uri: getFileUrl(project.imageUrl) }}
            style={styles.projectImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.projectText}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <Text style={styles.projectDescription}>{project.description}</Text>
          
          {project.technologies && project.technologies.length > 0 && (
            <View style={styles.technologiesContainer}>
              <Text style={styles.technologiesLabel}>Technologies:</Text>
              <View style={styles.technologiesList}>
                {project.technologies.map((tech, index) => (
                  <Badge key={index} style={styles.technologyBadge}>
                    <Text style={styles.technologyText}>{tech}</Text>
                  </Badge>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.projectFooter}>
            <Text style={styles.projectDate}>
              {new Date(project.createdAt).toLocaleDateString()}
            </Text>
            <View style={styles.projectLinks}>
              {project.githubUrl && (
                <TouchableOpacity style={styles.projectLink}>
                  <Ionicons name="logo-github" size={16} color="#8F1A27" />
                  <Text style={styles.projectLinkText}>GitHub</Text>
                </TouchableOpacity>
              )}
              {project.liveUrl && (
                <TouchableOpacity style={styles.projectLink}>
                  <Ionicons name="link" size={16} color="#8F1A27" />
                  <Text style={styles.projectLinkText}>Live Demo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  );

  const renderSkill = (skill: any) => (
    <Card key={skill.id} style={styles.skillCard}>
      <CardContent style={styles.skillContent}>
        <View style={styles.skillHeader}>
          <Text style={styles.skillName}>{skill.name}</Text>
          <Badge style={styles.skillProficiency}>{skill.proficiency}</Badge>
        </View>
        <Text style={styles.skillCategory}>{skill.category}</Text>
      </CardContent>
    </Card>
  );

  const renderTalent = (talent: any) => (
    <Card key={talent.id} style={styles.talentCard}>
      <CardContent style={styles.talentContent}>
        {talent.files && talent.files.length > 0 && (
          <Image
            source={{ uri: getFileUrl(talent.files[0]) }}
            style={styles.talentImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.talentText}>
          <View style={styles.talentHeader}>
            <Text style={styles.talentTitle}>{talent.title}</Text>
            <Badge style={styles.talentCategory}>{talent.category}</Badge>
          </View>
          <Text style={styles.talentDescription}>{talent.description}</Text>
        </View>
      </CardContent>
    </Card>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8F1A27" translucent />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#8F1A27', '#6A0032']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Student Profile</Text>
            <Text style={styles.headerSubtitle}>
              {student.firstName} {student.lastName}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {isOwnProfile ? (
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Ionicons name="create" size={20} color="#8F1A27" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
                <Ionicons name="mail" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Card style={styles.profileCard}>
            <CardContent style={styles.profileContent}>
              <View style={styles.profileImageContainer}>
                {student.profileImage ? (
                  <Image
                    source={{ uri: getFileUrl(student.profileImage) }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="person" size={40} color="#8F1A27" />
                  </View>
                )}
              </View>
              
                             <View style={styles.profileInfo}>
                 <Text style={styles.studentName}>
                   {student.firstName} {student.lastName}
                 </Text>
                 
                 {student.major && (
                   <View style={styles.infoRow}>
                     <Ionicons name="school" size={16} color="#8F1A27" />
                     <Text style={styles.infoText}>{student.major}</Text>
                   </View>
                 )}
                 
                 {student.year && (
                   <View style={styles.infoRow}>
                     <Ionicons name="person" size={16} color="#8F1A27" />
                     <Text style={styles.infoText}>{student.year} Year Student</Text>
                   </View>
                 )}
                 
                 {student.graduationYear && (
                   <View style={styles.infoRow}>
                     <Ionicons name="calendar" size={16} color="#8F1A27" />
                     <Text style={styles.infoText}>Class of {student.graduationYear}</Text>
                   </View>
                 )}
                 
                 {student.gpa && (
                   <View style={styles.infoRow}>
                     <Ionicons name="trophy" size={16} color="#8F1A27" />
                     <Text style={styles.infoText}>GPA: {student.gpa.toFixed(2)}</Text>
                   </View>
                 )}
                 
                 {student.availability && (
                   <View style={styles.infoRow}>
                     <Ionicons name="time" size={16} color="#8F1A27" />
                     <Text style={styles.infoText}>{student.availability.replace('_', ' ')}</Text>
                   </View>
                 )}
                 
                 {student.profileViews && (
                   <View style={styles.infoRow}>
                     <Ionicons name="eye" size={16} color="#8F1A27" />
                     <Text style={styles.infoText}>{student.profileViews} profile views</Text>
                   </View>
                 )}
               </View>
            </CardContent>
          </Card>

          {(student.bio || student.about) && (
            <Card style={styles.bioCard}>
              <CardHeader>
                <CardTitle style={styles.sectionTitle}>About</CardTitle>
              </CardHeader>
              <CardContent>
                <Text style={styles.bioText}>{student.bio || student.about}</Text>
              </CardContent>
            </Card>
          )}

          {/* Resume Section */}
          {student.resume && (
            <Card style={styles.resumeCard}>
              <CardHeader>
                <CardTitle style={styles.sectionTitle}>Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <TouchableOpacity style={styles.resumeButton} onPress={handleResumeView}>
                  <Ionicons name="document-text" size={20} color="#8F1A27" />
                  <Text style={styles.resumeButtonText}>View Resume</Text>
                </TouchableOpacity>
              </CardContent>
            </Card>
          )}
        </View>

        {/* Achievements Section */}
        {student.achievements && student.achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {student.achievements.map(renderAchievement)}
            </ScrollView>
          </View>
        )}

        {/* Projects Section */}
        {student.projects && student.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {student.projects.map(renderProject)}
          </View>
        )}

        {/* Skills Section */}
        {student.skills && student.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            
            {/* Skills Summary */}
            <View style={styles.skillsSummary}>
              {(() => {
                const categories = [...new Set(student.skills.map(skill => skill.category))];
                return categories.map(category => {
                  const categorySkills = student.skills.filter(skill => skill.category === category);
                  const proficiencyCounts = {
                    EXPERT: categorySkills.filter(s => s.proficiency === 'EXPERT').length,
                    ADVANCED: categorySkills.filter(s => s.proficiency === 'ADVANCED').length,
                    INTERMEDIATE: categorySkills.filter(s => s.proficiency === 'INTERMEDIATE').length,
                    BEGINNER: categorySkills.filter(s => s.proficiency === 'BEGINNER').length,
                  };
                  
                  return (
                    <Card key={category} style={styles.skillCategoryCard}>
                      <CardHeader>
                        <CardTitle style={styles.skillCategoryTitle}>{category}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <View style={styles.proficiencyBars}>
                          {Object.entries(proficiencyCounts).map(([level, count]) => {
                            if (count === 0) return null;
                            return (
                              <View key={level} style={styles.proficiencyBar}>
                                <Text style={styles.proficiencyLabel}>{level}</Text>
                                <View style={styles.proficiencyBarContainer}>
                                  <View 
                                    style={[
                                      styles.proficiencyBarFill,
                                      { 
                                        width: `${(count / categorySkills.length) * 100}%`,
                                        backgroundColor: getProficiencyColor(level)
                                      }
                                    ]} 
                                  />
                                </View>
                                <Text style={styles.proficiencyCount}>{count}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </View>
            
            {/* Individual Skills Grid */}
            <Text style={styles.subsectionTitle}>All Skills</Text>
            <View style={styles.skillsGrid}>
              {student.skills.map(renderSkill)}
            </View>
          </View>
        )}

        {/* Talents Section */}
        {student.talents && student.talents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Talents</Text>
            {student.talents.map(renderTalent)}
          </View>
        )}

        {/* Contact Section */}
        {!isOwnProfile && (
          <View style={styles.contactSection}>
            <Button
              style={styles.contactButtonLarge}
              onPress={handleContact}
            >
              <Ionicons name="mail" size={20} color="white" />
              <Text style={styles.contactButtonText}>Contact Student</Text>
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: 35,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
  },
  contactButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 20,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  profileInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  bioCard: {
    marginBottom: 16,
  },
  bioText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  achievementCard: {
    marginRight: 16,
    width: 200,
  },
  achievementContent: {
    padding: 0,
  },
  achievementImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  achievementText: {
    padding: 16,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6b5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  achievementDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  projectCard: {
    marginBottom: 16,
  },
  projectContent: {
    padding: 0,
  },
  projectImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 12,
  },
  projectText: {
    padding: 16,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: '#6b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  projectLinks: {
    flexDirection: 'row',
    gap: 16,
  },
  projectLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  projectLinkText: {
    fontSize: 14,
    color: '#8F1A27',
    fontWeight: '600',
    marginLeft: 6,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  skillCard: {
    width: '48%',
    marginBottom: 12,
  },
  skillsSummary: {
    marginBottom: 20,
  },
  skillCategoryCard: {
    marginBottom: 16,
  },
  skillCategoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  proficiencyBars: {
    gap: 12,
  },
  proficiencyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proficiencyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    width: 80,
  },
  proficiencyBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  proficiencyBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  proficiencyCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    width: 30,
    textAlign: 'right',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  skillContent: {
    padding: 16,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  skillProficiency: {
    backgroundColor: '#FEBF17',
  },
  skillCategory: {
    fontSize: 14,
    color: '#6b5563',
    fontWeight: '500',
  },
  resumeCard: {
    marginBottom: 16,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resumeButtonText: {
    fontSize: 16,
    color: '#8F1A27',
    fontWeight: '600',
    marginLeft: 8,
  },
  technologiesContainer: {
    marginBottom: 12,
  },
  technologiesLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  technologiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  technologyBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  technologyText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  projectDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  talentCard: {
    marginBottom: 16,
  },
  talentContent: {
    padding: 0,
  },
  talentImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 12,
  },
  talentText: {
    padding: 16,
  },
  talentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  talentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  talentCategory: {
    backgroundColor: '#FEBF17',
  },
  talentDescription: {
    fontSize: 14,
    color: '#6b5563',
    lineHeight: 20,
  },
  contactSection: {
    padding: 20,
    paddingTop: 0,
  },
  contactButtonLarge: {
    backgroundColor: '#8F1A27',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});