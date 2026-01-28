import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { apiService } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types';
import { showToast } from '../../components/ui/toast';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768 || (Platform.OS === 'ios' && Platform.isPad);
const isLargeTablet = width >= 1024;

type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;
type ResetPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ResetPassword'>;

const ResetPasswordScreen: React.FC = () => {
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  
  const token = route.params?.token || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  const logoScaleAnim = useState(new Animated.Value(0.8))[0];
  const formSlideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    if (!token) {
      Alert.alert('Invalid Link', 'This reset link is invalid or has expired. Please request a new one.', [
        { text: 'OK', onPress: () => navigation.navigate('ForgotPassword') },
      ]);
      return;
    }

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
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [token, navigation, fadeAnim, slideAnim, logoScaleAnim, formSlideAnim]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else {
      // Validate password requirements
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        newErrors.password = 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)';
      }
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await apiService.resetPassword(token, password);
      showToast('Password reset successfully!', 'success');
      Alert.alert(
        'Success',
        'Your password has been reset successfully. You can now login with your new password.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password. The link may have expired. Please request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  if (!token) {
    return null;
  }

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
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView 
              contentContainerStyle={[styles.scrollContent, isTablet && styles.scrollContentTablet]}
              showsVerticalScrollIndicator={false}
            >
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
                  <Image 
                    source={require('../../../assets/ss.png')} 
                    style={styles.logo} 
                  />
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
                  Reset Your Password
                </Animated.Text>
              </Animated.View>

              {/* Form */}
              <Animated.View 
                style={[
                  styles.form,
                  isTablet && styles.formTablet,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: formSlideAnim }]
                  }
                ]}
              >
                <Text style={styles.formDescription}>
                  Enter your new password below.
                </Text>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={isTablet ? (isLargeTablet ? 28 : 26) : 20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="New Password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={isTablet ? (isLargeTablet ? 24 : 22) : 20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={isTablet ? (isLargeTablet ? 28 : 26) : 20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm New Password"
                    placeholderTextColor="#666"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                      size={isTablet ? (isLargeTablet ? 24 : 22) : 20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}

                <TouchableOpacity
                  style={[styles.resetButton, isLoading && styles.disabledButton]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#8F1A27', '#6A0032', '#8F1A27']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.resetButtonText}>Reset Password</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBackToLogin}
                >
                  <Ionicons name="arrow-back-outline" size={isTablet ? (isLargeTablet ? 28 : 26) : 20} color="#8F1A27" />
                  <Text style={styles.backButtonText}>Back to Login</Text>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
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
  scrollContentTablet: {
    paddingHorizontal: isLargeTablet ? 100 : 80,
    maxWidth: isLargeTablet ? 700 : 600,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: isTablet ? (isLargeTablet ? 40 : 50) : 60,
    marginBottom: isTablet ? (isLargeTablet ? 50 : 45) : 40,
  },
  logoContainer: {
    marginBottom: isTablet ? (isLargeTablet ? 50 : 40) : 30,
  },
  logo: {
    width: isTablet ? (isLargeTablet ? 280 : 240) : 170, 
    height: isTablet ? (isLargeTablet ? 200 : 170) : 120,
    borderRadius: 25,
  },
  title: {
    fontSize: isTablet ? (isLargeTablet ? 56 : 48) : 28,
    fontWeight: 'bold',
    color: '#FFC540',
    marginBottom: isTablet ? 12 : 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  title2: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: isTablet ? (isLargeTablet ? 22 : 20) : 14,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: isTablet ? (isLargeTablet ? 50 : 45) : 30,
    paddingHorizontal: isTablet ? (isLargeTablet ? 45 : 40) : 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  formTablet: {
    maxWidth: isLargeTablet ? 650 : 550,
    alignSelf: 'center',
    width: '100%',
  },
  formDescription: {
    fontSize: isTablet ? (isLargeTablet ? 20 : 19) : 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: isTablet ? (isLargeTablet ? 28 : 26) : 24,
    lineHeight: isTablet ? (isLargeTablet ? 28 : 26) : 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: isTablet ? (isLargeTablet ? 24 : 22) : 16,
    backgroundColor: '#f8f9fa',
    height: isTablet ? (isLargeTablet ? 70 : 64) : 52,
    marginBottom: isTablet ? (isLargeTablet ? 24 : 22) : 16,
    position: 'relative',
  },
  inputIcon: {
    marginRight: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: isTablet ? (isLargeTablet ? 20 : 19) : 16,
    color: '#333',
    height: '100%',
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: isTablet ? (isLargeTablet ? 24 : 22) : 16,
    padding: 4,
    zIndex: 1,
  },
  fieldError: {
    color: '#ff4444',
    fontSize: isTablet ? (isLargeTablet ? 14 : 13) : 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
  resetButton: {
    borderRadius: 12,
    height: isTablet ? (isLargeTablet ? 70 : 64) : 52,
    overflow: 'hidden',
    shadowColor: '#8F1A27',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: isTablet ? (isLargeTablet ? 28 : 26) : 20,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: 'white',
    fontSize: isTablet ? (isLargeTablet ? 22 : 20) : 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 16 : 12,
  },
  backButtonText: {
    color: '#8F1A27',
    fontSize: isTablet ? (isLargeTablet ? 18 : 17) : 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ResetPasswordScreen;
