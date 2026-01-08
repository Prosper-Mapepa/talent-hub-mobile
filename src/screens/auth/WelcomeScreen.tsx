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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Welcome'>>();
  
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
          <View style={styles.container}>
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
                    style={styles.logo} 
                  />
                </View>
              </Animated.View>
              
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
                CONNECT • SHOWCASE • EVOLVE
              </Animated.Text>
            </Animated.View>

            {/* Futuristic Feature Cards */}
            <Animated.View 
              style={[
                styles.featuresContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: cardScaleAnim }]
                }
              ]}
            >
              <View style={styles.featuresGrid}>
                <View style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name="star" size={32} color="#FFC540" />
                    <View style={styles.iconGlow} />
                  </View>
                  <Text style={styles.featureTitle}>SHOWCASE</Text>
                  <Text style={styles.featureSubtitle}>Your Talents</Text>
                </View>

                <View style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name="briefcase" size={32} color="#FFC540" />
                    <View style={styles.iconGlow} />
                  </View>
                  <Text style={styles.featureTitle}>DISCOVER</Text>
                  <Text style={styles.featureSubtitle}>Opportunities</Text>
                </View>

                <View style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name="people" size={32} color="#FFC540" />
                    <View style={styles.iconGlow} />
                  </View>
                  <Text style={styles.featureTitle}>NETWORK</Text>
                  <Text style={styles.featureSubtitle}>& Connect</Text>
                </View>

                <View style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name="trending-up" size={32} color="#FFC540" />
                    <View style={styles.iconGlow} />
                  </View>
                  <Text style={styles.featureTitle}>EVOLVE</Text>
                  <Text style={styles.featureSubtitle}>Together</Text>
                </View>
              </View>
            </Animated.View>

            {/* Futuristic Action Buttons */}
            <Animated.View 
              style={[
                styles.buttonContainer,
                {
                  transform: [{ translateY: buttonSlideAnim }]
                }
              ]}
            >
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={handleSignIn}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#FFC540', '#FFD700', '#FFC540']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="log-in-outline" size={24} color="#8F1A27" />
                    <Text style={styles.signInButtonText}>SIGN IN</Text>
                  </LinearGradient>
                  <View style={styles.buttonGlow} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={handleJoin}
                  activeOpacity={0.9}
                >
                  <View style={styles.joinButtonContent}>
                    <Ionicons name="person-add-outline" size={24} color="#FFC540" />
                    <Text style={styles.joinButtonText}>JOIN US</Text>
                  </View>
                  <View style={styles.joinButtonBorder} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Futuristic Footer */}
            <Animated.View 
              style={[
                styles.footer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Text style={styles.footerText}>
                EMPOWERING CMU STUDENTS TO SHINE ⚡
              </Text>
            </Animated.View>
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
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
    marginTop: 80,
    // marginBottom: 50,
    zIndex: 1,
  },
  logoContainer: {
    position: 'relative',
    // marginBottom: 10,
  },
  logo: {
    width: 170, 
    height: 120,
    borderRadius: 25,
    zIndex: 2,
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
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFC540',
    marginBottom: 8,
    marginTop: 30,
    textAlign: 'center',
    textShadowColor: '#FFC540',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
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
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 197, 64, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 197, 64, 0.3)',
    position: 'relative',
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 197, 64, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 197, 64, 0.5)',
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 197, 64, 0.2)',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFC540',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 1,
  },
  featureSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    marginBottom: 50,
    zIndex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  signInButton: {
    borderRadius: 25,
    height: 55,
    flex: 0.48,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#FFC540',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 197, 64, 0.3)',
    zIndex: -1,
  },
  signInButtonText: {
    color: '#8F1A27',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
    letterSpacing: 1,
  },
  joinButton: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    height: 55,
    flex: 0.48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#FFC540',
    shadowColor: '#FFC540',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 20,
  },
  joinButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinButtonBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 197, 64, 0.1)',
    zIndex: -1,
  },
  joinButtonText: {
    color: '#FFC540',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 60,
    zIndex: 1,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 1,
    fontWeight: '600',
  },
});

export default WelcomeScreen; 