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
              <Text style={styles.lastUpdated}>Last Updated: December 2024</Text>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                <Text style={styles.sectionText}>
                  We collect information you provide directly to us, such as when you create an account, 
                  complete your profile, apply for jobs, or contact us. This may include:
                </Text>
                <Text style={styles.bulletPoint}>• Personal information (name, email, phone number)</Text>
                <Text style={styles.bulletPoint}>• Academic information (major, graduation year, GPA)</Text>
                <Text style={styles.bulletPoint}>• Professional information (skills, projects, achievements)</Text>
                <Text style={styles.bulletPoint}>• Business information (company details, job postings)</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
                <Text style={styles.sectionText}>
                  We use the information we collect to:
                </Text>
                <Text style={styles.bulletPoint}>• Provide and maintain our services</Text>
                <Text style={styles.bulletPoint}>• Connect students with job opportunities</Text>
                <Text style={styles.bulletPoint}>• Enable businesses to find talented students</Text>
                <Text style={styles.bulletPoint}>• Send you important updates and notifications</Text>
                <Text style={styles.bulletPoint}>• Improve our platform and user experience</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. Information Sharing</Text>
                <Text style={styles.sectionText}>
                  We do not sell, trade, or rent your personal information to third parties. 
                  We may share your information in the following circumstances:
                </Text>
                <Text style={styles.bulletPoint}>• With your consent</Text>
                <Text style={styles.bulletPoint}>• To comply with legal obligations</Text>
                <Text style={styles.bulletPoint}>• To protect our rights and safety</Text>
                <Text style={styles.bulletPoint}>• With service providers who assist in our operations</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>4. Data Security</Text>
                <Text style={styles.sectionText}>
                  We implement appropriate security measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction. These measures include:
                </Text>
                <Text style={styles.bulletPoint}>• Encryption of data in transit and at rest</Text>
                <Text style={styles.bulletPoint}>• Regular security assessments</Text>
                <Text style={styles.bulletPoint}>• Access controls and authentication</Text>
                <Text style={styles.bulletPoint}>• Secure data storage practices</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>5. Your Rights</Text>
                <Text style={styles.sectionText}>
                  You have the right to:
                </Text>
                <Text style={styles.bulletPoint}>• Access your personal information</Text>
                <Text style={styles.bulletPoint}>• Update or correct your information</Text>
                <Text style={styles.bulletPoint}>• Delete your account and data</Text>
                <Text style={styles.bulletPoint}>• Opt out of certain communications</Text>
                <Text style={styles.bulletPoint}>• Request data portability</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>6. Cookies and Tracking</Text>
                <Text style={styles.sectionText}>
                  We use cookies and similar technologies to enhance your experience, 
                  analyze usage patterns, and improve our services. You can control 
                  cookie settings through your browser preferences.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>7. Third-Party Services</Text>
                <Text style={styles.sectionText}>
                  Our platform may integrate with third-party services for functionality 
                  such as file storage, analytics, and payment processing. These services 
                  have their own privacy policies, and we encourage you to review them.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
                <Text style={styles.sectionText}>
                  Our services are not intended for children under 13 years of age. 
                  We do not knowingly collect personal information from children under 13. 
                  If you believe we have collected such information, please contact us.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
                <Text style={styles.sectionText}>
                  We may update this Privacy Policy from time to time. We will notify 
                  you of any material changes by posting the new policy on our platform 
                  and updating the "Last Updated" date.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>10. Contact Us</Text>
                <Text style={styles.sectionText}>
                  If you have any questions about this Privacy Policy or our data practices, 
                  please contact us at:
                </Text>
                <Text style={styles.contactInfo}>Email: privacy@cmutalenthub.com</Text>
                <Text style={styles.contactInfo}>Phone: (412) 268-2000</Text>
                <Text style={styles.contactInfo}>Address: Carnegie Mellon University</Text>
                <Text style={styles.contactInfo}>5000 Forbes Avenue, Pittsburgh, PA 15213</Text>
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
    color: '#8F1A27',
    fontWeight: '600',
    marginBottom: 4,
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