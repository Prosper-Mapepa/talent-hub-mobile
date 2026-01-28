import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types';

const { width, height } = Dimensions.get('window');

const PrivacyPolicyScreen: React.FC = () => {
  // Animation values
  const fadeAnim = React.useState(new Animated.Value(0))[0];
  const slideAnim = React.useState(new Animated.Value(20))[0];
  const logoScaleAnim = React.useState(new Animated.Value(0.8))[0];

  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'PrivacyPolicy'>>();

  useEffect(() => {
    // Smooth fade-in animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.fullScreen}>
      <StatusBar barStyle="light-content" backgroundColor="#8F1A27" translucent />
      <LinearGradient
        colors={['#8F1A27', '#6A0032', '#8F1A27']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Futuristic Background Elements */}
            <View style={styles.backgroundElements}>
              <View style={styles.geometricShape1} />
              <View style={styles.geometricShape2} />
              <View style={styles.geometricShape3} />
            </View>

            {/* Header Section */}
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back-outline" size={24} color="#FFC540" />
              </TouchableOpacity>
              
              <Animated.Text 
                style={[
                  styles.title,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                CMU <Text style={styles.title2}>TALENT</Text>HUB
              </Animated.Text>
              
              <Animated.Text 
                style={[
                  styles.subtitle,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                PRIVACY POLICY
              </Animated.Text>
            </Animated.View>

            {/* Content */}
            <Animated.View 
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Text style={styles.lastUpdated}>Last Updated: January 14, 2026</Text>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. Introduction</Text>
                <Text style={styles.sectionText}>
                  CMUTalentHub is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and mobile application.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Information We Collect</Text>
                <Text style={styles.sectionText}>
                  We collect information that you provide directly to us, including:
                </Text>
                <Text style={styles.bulletPoint}>• Personal information (name, email address)</Text>
                <Text style={styles.bulletPoint}>• Academic information (university affiliation, major, graduation year)</Text>
                <Text style={styles.bulletPoint}>• Profile information (skills, projects, work experience, portfolio content)</Text>
                <Text style={styles.bulletPoint}>• Business information (company details, job postings, contact information)</Text>
                <Text style={styles.bulletPoint}>• Account credentials and authentication data</Text>
                <Text style={styles.bulletPoint}>• Messages and communications sent through our platform</Text>
                <Text style={styles.bulletPoint}>• Application and job-related information</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
                <Text style={styles.sectionText}>
                  We use the information we collect to:
                </Text>
                <Text style={styles.bulletPoint}>• Provide, maintain, and improve our services</Text>
                <Text style={styles.bulletPoint}>• Connect students with job opportunities and businesses</Text>
                <Text style={styles.bulletPoint}>• Enable communication between users</Text>
                <Text style={styles.bulletPoint}>• Verify user identities and ensure platform security</Text>
                <Text style={styles.bulletPoint}>• Send you important updates, notifications, and administrative messages</Text>
                <Text style={styles.bulletPoint}>• Personalize your experience and provide relevant content</Text>
                <Text style={styles.bulletPoint}>• Monitor and analyze usage patterns to improve our platform</Text>
                <Text style={styles.bulletPoint}>• Comply with legal obligations and enforce our terms of service</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>4. Information Sharing and Disclosure</Text>
                <Text style={styles.sectionText}>
                  We may share your information in the following circumstances:
                </Text>
                <Text style={styles.bulletPoint}>• With other users: Your profile information is visible to other users on the platform as intended by your privacy settings</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>5. Data Security</Text>
                <Text style={styles.sectionText}>
                  We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>6. Your Rights and Choices</Text>
                <Text style={styles.sectionText}>
                  You have the right to:
                </Text>
                <Text style={styles.bulletPoint}>• Access and review your personal information</Text>
                <Text style={styles.bulletPoint}>• Update or correct your information through your account settings</Text>
                <Text style={styles.bulletPoint}>• Delete your account and associated data</Text>
                <Text style={styles.bulletPoint}>• Opt-out of certain communications and data processing</Text>
                <Text style={styles.bulletPoint}>• Request a copy of your data</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>9. Changes to This Privacy Policy</Text>
                <Text style={styles.sectionText}>
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>10. Contact Us</Text>
                <Text style={styles.sectionText}>
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
                </Text>
                <Text style={styles.contactInfo}>Email: mapepapro@gmail.com</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
    zIndex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 10,
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFC540',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: '#FFC540',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    letterSpacing: 2,
  },
  title2: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8F1A27',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginLeft: 16,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  contactInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    marginTop: 4,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  geometricShape1: {
    position: 'absolute',
    top: 100,
    right: -50,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 197, 64, 0.1)',
    borderRadius: 20,
    transform: [{ rotate: '45deg' }],
  },
  geometricShape2: {
    position: 'absolute',
    bottom: 200,
    left: -30,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(143, 26, 39, 0.1)',
    borderRadius: 40,
  },
  geometricShape3: {
    position: 'absolute',
    top: 300,
    left: 50,
    width: 60,
    height: 60,
    backgroundColor: 'rgba(106, 0, 50, 0.1)',
    borderRadius: 30,
    transform: [{ rotate: '30deg' }],
  },
});

export default PrivacyPolicyScreen; 