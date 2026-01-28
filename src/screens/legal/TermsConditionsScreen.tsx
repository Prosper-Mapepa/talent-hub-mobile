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

const TermsConditionsScreen: React.FC = () => {
  // Animation values
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [slideAnim] = React.useState(new Animated.Value(20));
  const [logoScaleAnim] = React.useState(new Animated.Value(0.8));

  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'TermsConditions'>>();

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
                TERMS & CONDITIONS
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
                <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                <Text style={styles.sectionText}>
                  By accessing and using CMU TalentHub, you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, please 
                  do not use this service.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Description of Service</Text>
                <Text style={styles.sectionText}>
                  CMU TalentHub is a platform that connects  students with 
                  job opportunities and allows businesses to discover talented students. The service 
                  includes:
                </Text>
                <Text style={styles.bulletPoint}>• Student profile creation and management</Text>
                <Text style={styles.bulletPoint}>• Job posting and application system</Text>
                <Text style={styles.bulletPoint}>• Talent showcase and discovery</Text>
                <Text style={styles.bulletPoint}>• Messaging and communication tools</Text>
                <Text style={styles.bulletPoint}>• Business profile and job management</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. User Accounts</Text>
                <Text style={styles.sectionText}>
                  To access certain features of the service, you must create an account. You agree to:
                </Text>
                <Text style={styles.bulletPoint}>• Provide accurate and complete information</Text>
                <Text style={styles.bulletPoint}>• Maintain the security of your account credentials</Text>
                <Text style={styles.bulletPoint}>• Notify us immediately of any unauthorized use</Text>
                <Text style={styles.bulletPoint}>• Accept responsibility for all activities under your account</Text>
                {/* <Text style={styles.bulletPoint}>• Be at least 18 years old or have parental consent</Text> */}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>4. User Conduct</Text>
                <Text style={styles.sectionText}>
                  You agree not to use the service to:
                </Text>
                <Text style={styles.bulletPoint}>• Post false, misleading, or fraudulent information</Text>
                <Text style={styles.bulletPoint}>• Harass, abuse, or harm other users</Text>
                <Text style={styles.bulletPoint}>• Violate any applicable laws or regulations</Text>
                <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access to the service</Text>
                <Text style={styles.bulletPoint}>• Use the service for commercial purposes without authorization</Text>
                <Text style={styles.bulletPoint}>• Upload malicious code or content</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>5. Content and Intellectual Property</Text>
                <Text style={styles.sectionText}>
                  Users retain ownership of content they upload. By posting content, you grant us a 
                  license to display and distribute your content within the service. You represent 
                  that you have the right to share such content.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>6. Privacy and Data Protection</Text>
                <Text style={styles.sectionText}>
                  Your privacy is important to us. Our collection and use of personal information 
                  is governed by our Privacy Policy, which is incorporated into these Terms by reference.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>7. Job Applications and Hiring</Text>
                <Text style={styles.sectionText}>
                  The platform facilitates connections between students and employers, but we are not 
                  responsible for:
                </Text>
                <Text style={styles.bulletPoint}>• The hiring decisions of employers</Text>
                <Text style={styles.bulletPoint}>• The accuracy of job postings or company information</Text>
                <Text style={styles.bulletPoint}>• Employment terms or conditions</Text>
                <Text style={styles.bulletPoint}>• Background checks or verification processes</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>8. Service Availability</Text>
                <Text style={styles.sectionText}>
                  We strive to maintain service availability but cannot guarantee uninterrupted access. 
                  We may temporarily suspend the service for maintenance, updates, or other reasons 
                  without prior notice.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
                <Text style={styles.sectionText}>
                  CMU TalentHub shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages arising from your use of 
                  the service.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>10. Termination</Text>
                <Text style={styles.sectionText}>
                  We may terminate or suspend your account at any time for violations of these terms. 
                  You may also terminate your account at any time by contacting us.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
                <Text style={styles.sectionText}>
                  We reserve the right to modify these terms at any time. We will notify users of 
                  significant changes via email or through the platform. Continued use of the service 
                  constitutes acceptance of modified terms.
                </Text>
              </View>

              {/* <View style={styles.section}>
                <Text style={styles.sectionTitle}>12. Governing Law</Text>
                <Text style={styles.sectionText}>
                  These terms are governed by the laws of the Commonwealth of Pennsylvania. Any 
                  disputes shall be resolved in the courts of Allegheny County, Pennsylvania.
                </Text>
              </View> */}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>13. Contact Information</Text>
                <Text style={styles.sectionText}>
                  For questions about these Terms and Conditions, please contact us at:
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

export default TermsConditionsScreen; 