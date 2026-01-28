import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
  Image,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768 || (Platform.OS === 'ios' && Platform.isPad);
const isLargeTablet = screenWidth >= 1024;
const isSmallScreen = screenWidth < 375; // iPhone SE and similar small devices

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Welcome'>>();
  const { width, height } = useWindowDimensions();
  
  // Responsive breakpoints - adjust for smaller screens
  // iPhone SE (1st/2nd gen): 320x568, iPhone 8: 375x667, iPhone 12/13 mini: 375x812
  // Apply responsive styles to all phones (not tablets) for better small screen support
  const currentIsTablet = width >= 768 || (Platform.OS === 'ios' && Platform.isPad);
  const currentIsLargeTablet = width >= 1024;
  const isSmallDevice = !currentIsTablet && width <= 414; // All phones <= 414px
  const isMediumDevice = !currentIsTablet && width > 414 && width < 768;
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  const logoScaleAnim = useState(new Animated.Value(0.8))[0];
  const buttonSlideAnim = useState(new Animated.Value(30))[0];
  const cardScaleAnim = useState(new Animated.Value(0.9))[0];

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
      Animated.timing(cardScaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(buttonSlideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  const handleJoin = () => {
    navigation.navigate('Register');
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
          <View style={styles.contentWrapper}>
            {/* Futuristic Background Elements */}
            <View style={styles.backgroundElements}>
              <View style={styles.geometricShape1} />
              <View style={styles.geometricShape2} />
              <View style={styles.geometricShape3} />
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.scrollContainer,
                currentIsTablet && styles.scrollContainerTablet,
                isSmallDevice && styles.scrollContainerSmall,
              ]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.topSection}>
                {/* Header Section */}
                <Animated.View 
                  style={[
                    styles.header,
                    isSmallDevice && styles.headerSmall,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }]
                    }
                  ]}
                >
                  <Animated.View 
                    style={[
                      styles.logoContainer,
                      {
                        transform: [{ scale: logoScaleAnim }]
                      }
                    ]}
                  >
                    <View style={styles.logoGlow} />
                    <View style={styles.logoContainer}>
                      <Image 
                        source={require('../../../assets/ss.png')} 
                        style={[
                          styles.logo,
                          isSmallDevice && styles.logoSmall
                        ]} 
                      />
                    </View>
                  </Animated.View>
                  
                  <Animated.Text 
                    style={[
                      styles.title,
                      isSmallDevice && styles.titleSmall,
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
                      isSmallDevice && styles.subtitleSmall,
                      {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                      }
                    ]}
                  >
                    CONNECT • SHOWCASE • EVOLVE
                  </Animated.Text>
                </Animated.View>

                {/* Futuristic Feature Cards */}
                <Animated.View 
                  style={[
                    styles.featuresContainer,
                    currentIsTablet && styles.featuresContainerTablet,
                    isSmallDevice && styles.featuresContainerSmall,
                    {
                      opacity: fadeAnim,
                      transform: [{ scale: cardScaleAnim }]
                    }
                  ]}
                >
                  <View style={[
                    styles.featuresGrid, 
                    currentIsTablet && styles.featuresGridTablet,
                    isSmallDevice && styles.featuresGridSmall
                  ]}>
                    <View style={[
                      styles.featureCard,
                      isSmallDevice && styles.featureCardSmall
                    ]}>
                      <View style={[
                        styles.featureIconContainer,
                        isSmallDevice && styles.featureIconContainerSmall
                      ]}>
                        <Ionicons name="star" size={isSmallDevice ? 28 : (currentIsTablet ? 42 : 34)} color="#FFC540" />
                        <View style={styles.iconGlow} />
                      </View>
                      <Text style={[styles.featureTitle, isSmallDevice && styles.featureTitleSmall]}>SHOWCASE</Text>
                      <Text style={[styles.featureSubtitle, isSmallDevice && styles.featureSubtitleSmall]}>Your Talents</Text>
                    </View>

                    <View style={[
                      styles.featureCard,
                      isSmallDevice && styles.featureCardSmall
                    ]}>
                      <View style={[
                        styles.featureIconContainer,
                        isSmallDevice && styles.featureIconContainerSmall
                      ]}>
                        <Ionicons name="briefcase" size={isSmallDevice ? 28 : (currentIsTablet ? 42 : 34)} color="#FFC540" />
                        <View style={styles.iconGlow} />
                      </View>
                      <Text style={[styles.featureTitle, isSmallDevice && styles.featureTitleSmall]}>DISCOVER</Text>
                      <Text style={[styles.featureSubtitle, isSmallDevice && styles.featureSubtitleSmall]}>Opportunities</Text>
                    </View>

                    <View style={[
                      styles.featureCard,
                      isSmallDevice && styles.featureCardSmall
                    ]}>
                      <View style={[
                        styles.featureIconContainer,
                        isSmallDevice && styles.featureIconContainerSmall
                      ]}>
                        <Ionicons name="people" size={isSmallDevice ? 28 : (currentIsTablet ? 42 : 34)} color="#FFC540" />
                        <View style={styles.iconGlow} />
                      </View>
                      <Text style={[styles.featureTitle, isSmallDevice && styles.featureTitleSmall]}>NETWORK</Text>
                      <Text style={[styles.featureSubtitle, isSmallDevice && styles.featureSubtitleSmall]}>& Connect</Text>
                    </View>

                    <View style={[
                      styles.featureCard,
                      isSmallDevice && styles.featureCardSmall
                    ]}>
                      <View style={[
                        styles.featureIconContainer,
                        isSmallDevice && styles.featureIconContainerSmall
                      ]}>
                        <Ionicons name="trending-up" size={isSmallDevice ? 28 : (currentIsTablet ? 42 : 34)} color="#FFC540" />
                        <View style={styles.iconGlow} />
                      </View>
                      <Text style={[styles.featureTitle, isSmallDevice && styles.featureTitleSmall]}>EVOLVE</Text>
                      <Text style={[styles.featureSubtitle, isSmallDevice && styles.featureSubtitleSmall]}>Together</Text>
                    </View>
                  </View>
                </Animated.View>
              </View>

              <View style={styles.bottomSection}>
                {/* Futuristic Action Buttons (inline) */}
                <Animated.View 
                  style={[
                    styles.buttonContainer,
                    isSmallDevice && styles.buttonContainerSmall,
                    {
                      transform: [{ translateY: buttonSlideAnim }]
                    }
                  ]}
                >
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[
                        styles.signInButton,
                        styles.buttonRightSpacing,
                        isSmallDevice && styles.signInButtonSmall,
                        isSmallDevice && styles.buttonRightSpacingSmall,
                      ]}
                      onPress={handleSignIn}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={['#FFC540', '#FFD700', '#FFC540']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="log-in-outline" size={isSmallDevice ? 22 : (currentIsTablet ? 26 : 24)} color="#8F1A27" />
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.signInButtonText,
                            isSmallDevice && styles.signInButtonTextSmall
                          ]}
                        >
                          SIGN IN
                        </Text>
                      </LinearGradient>
                      <View style={styles.buttonGlow} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.joinButton,
                        isSmallDevice && styles.joinButtonSmall
                      ]}
                      onPress={handleJoin}
                      activeOpacity={0.9}
                    >
                      <View style={styles.joinButtonContent}>
                        <Ionicons name="person-add-outline" size={isSmallDevice ? 22 : (currentIsTablet ? 26 : 24)} color="#FFC540" />
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.joinButtonText,
                            isSmallDevice && styles.joinButtonTextSmall
                          ]}
                        >
                          JOIN US
                        </Text>
                      </View>
                      <View style={styles.joinButtonBorder} />
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                {/* Footer pinned to bottom of layout */}
                <Animated.View 
                  style={[
                    styles.footerDock,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }]
                    }
                  ]}
                >
                  <Text style={[
                    styles.footerText,
                    isSmallDevice && styles.footerTextSmall
                  ]}>
                    EMPOWERING CMU STUDENTS TO SHINE ⚡
                  </Text>
                </Animated.View>
              </View>
            </ScrollView>
          </View>
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
  contentWrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    maxWidth: isTablet ? 800 : '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  scrollContainerTablet: {
    paddingHorizontal: isLargeTablet ? 50 : 36,
    paddingTop: isLargeTablet ? 28 : 20,
    paddingBottom: isLargeTablet ? 32 : 24,
  },
  scrollContainerSmall: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 20,
  },
  topSection: {
    width: '100%',
    flex: 1,
  },
  bottomSection: {
    width: '100%',
    paddingTop: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    maxWidth: isTablet ? 800 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  containerTablet: {
    paddingHorizontal: isLargeTablet ? 60 : 40,
    paddingVertical: isLargeTablet ? 40 : 20,
  },
  containerSmall: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 20,
    justifyContent: 'flex-start',
  },
  gradient: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
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
  header: {
    alignItems: 'center',
    marginTop: isTablet ? (isLargeTablet ? 50 : 45) : 50,
    marginBottom: isTablet ? (isLargeTablet ? 20 : 15) : 10,
    zIndex: 1,
  },
  headerSmall: {
    marginTop: 35,
    marginBottom: 8,
  },
  logoContainer: {
    position: 'relative',
  },
  logo: {
    width: isTablet ? (isLargeTablet ? 220 : 200) : 170, 
    height: isTablet ? (isLargeTablet ? 155 : 140) : 120,
    borderRadius: 25,
    zIndex: 2,
  },
  logoSmall: {
    width: 120,
    height: 85,
  },
  logoGlow: {
    position: 'absolute',
    top: -9,
    left: -9,
    right: -9,
    bottom: -9,
    // borderRadius: 100,
    // backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  title: {
    fontSize: isTablet ? (isLargeTablet ? 48 : 42) : 36,
    fontWeight: 'bold',
    color: '#FFC540',
    marginBottom: 8,
    marginTop: isTablet ? 40 : 30,
    textAlign: 'center',
    textShadowColor: '#FFC540',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  titleSmall: {
    fontSize: 28,
    marginTop: 20,
    marginBottom: 6,
    letterSpacing: 1,
  },
  title2: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: isTablet ? (isLargeTablet ? 18 : 16) : 14,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitleSmall: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
    marginTop: isTablet ? (isLargeTablet ? 50 : 40) : 35,
    marginBottom: isTablet ? (isLargeTablet ? 40 : 30) : 25,
  },
  featuresContainerTablet: {
    maxWidth: isLargeTablet ? 750 : 650,
    alignSelf: 'center',
    width: '100%',
  },
  featuresContainerSmall: {
    flex: 0,
    marginVertical: 20,
    marginTop: 25,
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    gap: 16,
  },
  featuresGridTablet: {
    paddingHorizontal: isLargeTablet ? 24 : 16,
    justifyContent: isLargeTablet ? 'space-around' : 'space-between',
    gap: isLargeTablet ? 24 : 20,
  },
  featuresGridSmall: {
    paddingHorizontal: 4,
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCard: {
    width: isTablet ? (isLargeTablet ? '47%' : '48%') : '48%',
    backgroundColor: 'rgba(255, 197, 64, 0.08)',
    borderRadius: 20,
    padding: isTablet ? (isLargeTablet ? 36 : 32) : 28,
    marginBottom: isTablet ? (isLargeTablet ? 32 : 28) : 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 197, 64, 0.25)',
    position: 'relative',
    minHeight: isTablet ? (isLargeTablet ? 200 : 180) : 160,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureCardSmall: {
    width: '48%',
    padding: 18,
    marginBottom: 16,
    borderRadius: 16,
    minHeight: 140,
  },
  featureIconContainer: {
    width: isTablet ? (isLargeTablet ? 90 : 80) : 70,
    height: isTablet ? (isLargeTablet ? 90 : 80) : 70,
    borderRadius: isTablet ? (isLargeTablet ? 45 : 40) : 35,
    backgroundColor: 'rgba(255, 197, 64, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isTablet ? 24 : 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 197, 64, 0.4)',
    position: 'relative',
  },
  featureIconContainerSmall: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginBottom: 12,
  },
  iconGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 197, 64, 0.15)',
  },
  featureTitle: {
    fontSize: isTablet ? (isLargeTablet ? 20 : 18) : 16,
    fontWeight: '800',
    color: '#FFC540',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 1.2,
  },
  featureTitleSmall: {
    fontSize: 13,
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  featureSubtitle: {
    fontSize: isTablet ? (isLargeTablet ? 16 : 15) : 13,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  featureSubtitleSmall: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  buttonContainer: {
    marginBottom: isTablet ? (isLargeTablet ? 35 : 40) : 35,
    marginTop: 20,
    zIndex: 1,
    maxWidth: isTablet ? 600 : '100%',
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: isTablet ? 10 : 0,
  },
  buttonContainerSmall: {
    marginBottom: 20,
    marginTop: 18,
    paddingHorizontal: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  buttonRightSpacing: {
    marginRight: 12,
  },
  buttonRightSpacingSmall: {
    marginRight: 10,
  },
  signInButton: {
    borderRadius: 28,
    minHeight: isTablet ? (isLargeTablet ? 65 : 60) : 56,
    height: isTablet ? (isLargeTablet ? 65 : 60) : 56,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#FFC540',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  signInButtonSmall: {
    flex: 1,
    minHeight: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 0,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  buttonGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 197, 64, 0.25)',
    zIndex: -1,
  },
  signInButtonText: {
    color: '#8F1A27',
    fontSize: isTablet ? (isLargeTablet ? 18 : 17) : 16,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 1.2,
  },
  signInButtonTextSmall: {
    fontSize: 15,
    marginLeft: 8,
    letterSpacing: 1,
    fontWeight: '800',
  },
  joinButton: {
    backgroundColor: 'rgba(255, 197, 64, 0.08)',
    borderRadius: 28,
    minHeight: isTablet ? (isLargeTablet ? 65 : 60) : 56,
    height: isTablet ? (isLargeTablet ? 65 : 60) : 56,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#FFC540',
    shadowColor: '#FFC540',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  joinButtonSmall: {
    flex: 1,
    minHeight: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 0,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  joinButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  joinButtonBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 197, 64, 0.15)',
    zIndex: -1,
  },
  joinButtonText: {
    color: '#FFC540',
    fontSize: isTablet ? (isLargeTablet ? 18 : 17) : 16,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 1.2,
  },
  joinButtonTextSmall: {
    fontSize: 15,
    marginLeft: 8,
    letterSpacing: 1,
    fontWeight: '800',
  },
  footer: {
    alignItems: 'center',
    marginBottom: isTablet ? (isLargeTablet ? 40 : 50) : 60,
    zIndex: 1,
  },
  footerSmall: {
    marginBottom: 20,
    marginTop: 5,
  },
  footerDock: {
    alignItems: 'center',
    marginTop: 12,
    paddingBottom: 6,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: isTablet ? (isLargeTablet ? 13 : 12) : 10,
    textAlign: 'center',
    letterSpacing: 1,
    fontWeight: '600',
  },
  footerTextSmall: {
    fontSize: 8,
    letterSpacing: 0.5,
    paddingHorizontal: 10,
  },
});

export default WelcomeScreen; 