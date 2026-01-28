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
  Image,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import FuturisticLogo from '../../components/FuturisticLogo';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { login, clearError } from '../../store/slices/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768 || (Platform.OS === 'ios' && Platform.isPad);
const isLargeTablet = width >= 1024;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Login'>>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useAppSelector(state => state.auth);

  // Check biometric availability and stored credentials
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const storedEmail = await SecureStore.getItemAsync('userEmail');
        const storedPassword = await SecureStore.getItemAsync('userPassword');
        
        setBiometricAvailable(hasHardware && isEnrolled);
        const hasCredentials = !!(storedEmail && storedPassword);
        setHasStoredCredentials(hasCredentials);
        
        if (hasCredentials && storedEmail) {
          setEmail(storedEmail);
        }
      } catch (error) {
        console.error('Error checking biometric availability:', error);
      }
    };
    
    checkBiometricAvailability();
  }, []);

  // Validate form
  useEffect(() => {
    setIsFormValid(email.length > 0 && password.length > 0);
  }, [email, password]);

  // Clear error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000); // Clear error after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Keep screen focused on error - prevent navigation reset
  useFocusEffect(
    React.useCallback(() => {
      // Ensure we stay on this screen if there's an error
      if (error && navigation.isFocused()) {
        // Screen is already focused, no need to navigate
        return;
      }
    }, [error, navigation])
  );

  const handleLogin = async () => {
    if (!isFormValid) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await dispatch(login({ email, password })).unwrap();
      // Store credentials securely for biometric login
      try {
        await SecureStore.setItemAsync('userEmail', email);
        await SecureStore.setItemAsync('userPassword', password);
      } catch (error) {
        console.error('Error storing credentials:', error);
      }
      // Navigation will happen automatically if login is successful
      // (via AppNavigator checking isAuthenticated)
    } catch (err) {
      // Error is handled by the slice - stay on login screen
      // Don't navigate away on error
    }
  };

  const handleBiometricLogin = async () => {
    try {
      if (!biometricAvailable) {
        Alert.alert('Biometric Unavailable', 'Biometric authentication is not available on this device.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to sign in',
        fallbackLabel: 'Use password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Retrieve stored credentials
        const storedEmail = await SecureStore.getItemAsync('userEmail');
        const storedPassword = await SecureStore.getItemAsync('userPassword');
        
        if (storedEmail && storedPassword) {
          setEmail(storedEmail);
          setPassword(storedPassword);
          try {
            await dispatch(login({ email: storedEmail, password: storedPassword })).unwrap();
          } catch (err) {
            // Error is handled by the slice
          }
        } else {
          Alert.alert('Error', 'No stored credentials found. Please sign in with your email and password.');
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Authentication Error', 'Biometric authentication failed. Please use your password.');
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <View style={styles.fullScreen}>
      <StatusBar barStyle="light-content" backgroundColor="#8F1A27" translucent />
      <LinearGradient
        colors={['#8F1A27', '#6A0032']}
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
              {/* Futuristic Background Elements */}
              <View style={styles.backgroundElements}>
                <View style={styles.geometricShape1} />
                <View style={styles.geometricShape2} />
                <View style={styles.geometricShape3} />
              </View>

              {/* Header */}
              <View style={styles.header}>
              
              <View style={styles.logoGlow} />
                <View style={styles.logoContainer}>
                  <Image 
                    source={require('../../../assets/ss.png')} 
                    style={styles.logo} 
                  />
                </View>
                <Text style={styles.title}>CMU <Text style={styles.title2}>TALENT</Text>HUB</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>
              </View>

              {/* Form */}
              <View style={[styles.form, isTablet && styles.formTablet]}>
                {/* Email Input */}
                <View style={[
                  styles.inputContainer,
                  isEmailFocused && styles.inputContainerFocused
                ]}>
                  <Ionicons
                    name="mail-outline"
                    size={isTablet ? (isLargeTablet ? 28 : 26) : 20}
                    color={isEmailFocused ? "#8F1A27" : "#999"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password Input */}
                <View style={[
                  styles.inputContainer,
                  isPasswordFocused && styles.inputContainerFocused
                ]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={isTablet ? (isLargeTablet ? 28 : 26) : 20}
                    color={isPasswordFocused ? "#8F1A27" : "#999"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    secureTextEntry={!showPassword}
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={isTablet ? (isLargeTablet ? 28 : 26) : 20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                {/* Error Message */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={16} color="#ff4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Biometric Login Button */}
                {biometricAvailable && hasStoredCredentials && (
                  <TouchableOpacity
                    style={styles.biometricButton}
                    onPress={handleBiometricLogin}
                    disabled={isLoading}
                  >
                    <Ionicons 
                      name={Platform.OS === 'ios' ? 'lock-open-outline' : 'lock-open-outline'} 
                      size={isTablet ? (isLargeTablet ? 28 : 26) : 24} 
                      color="#8F1A27" 
                    />
                    <Text style={styles.biometricButtonText}>
                      {Platform.OS === 'ios' ? 'Use Face ID' : 'Use Fingerprint'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Biometric Divider */}
                {biometricAvailable && hasStoredCredentials && (
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>
                )}

                {/* Login Button */}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    !isFormValid && styles.disabledButton
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading || !isFormValid}
                >
                  <LinearGradient
                    colors={isFormValid ? ['#8F1A27', '#6A0032'] : ['#ccc', '#ccc']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.loginButtonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Biometric Disclaimer */}
                {biometricAvailable && (
                  <View style={styles.disclaimerContainer}>
                    <Ionicons name="information-circle-outline" size={14} color="#666" />
                    <Text style={styles.disclaimerText}>
                      Your biometric data is stored only on your device and is never shared with our servers.
                    </Text>
                  </View>
                )}

                {/* Forgot Password */}
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Register Link */}
                <View style={styles.registerSection}>
                  <Text style={styles.registerText}>
                    Don't have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.registerLinkText}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    justifyContent: 'center',
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
    marginBottom: isTablet ? (isLargeTablet ? 40 : 30) : 10,
  },
  subtitle: {
    fontSize: isTablet ? (isLargeTablet ? 22 : 20) : 14,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: isTablet ? (isLargeTablet ? 50 : 45) : 30,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: isTablet ? (isLargeTablet ? 20 : 18) : 14,
    backgroundColor: '#F9FAFB',
    height: isTablet ? (isLargeTablet ? 60 : 56) : 46,
    marginBottom: isTablet ? (isLargeTablet ? 18 : 16) : 12,
  },
  inputContainerFocused: {
    borderColor: '#8F1A27',
    backgroundColor: 'white',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: isTablet ? (isLargeTablet ? 20 : 19) : 16,
    color: '#333',
    height: '100%',
  },
  passwordToggle: {
    padding: 8,
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginLeft: 8,
  },
  loginButton: {
    borderRadius: 12,
    height: isTablet ? (isLargeTablet ? 60 : 56) : 46,
    marginBottom: isTablet ? (isLargeTablet ? 24 : 22) : 18,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: isTablet ? (isLargeTablet ? 22 : 20) : 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: isTablet ? (isLargeTablet ? 28 : 26) : 20,
  },
  forgotPasswordText: {
    color: '#8F1A27',
    fontSize: isTablet ? (isLargeTablet ? 18 : 17) : 14,
    fontWeight: "600",
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8F1A27',
    borderRadius: 12,
    paddingVertical: isTablet ? (isLargeTablet ? 18 : 16) : 14,
    paddingHorizontal: isTablet ? (isLargeTablet ? 24 : 22) : 20,
    marginBottom: isTablet ? (isLargeTablet ? 20 : 18) : 16,
    backgroundColor: 'transparent',
  },
  biometricButtonText: {
    color: '#8F1A27',
    fontSize: isTablet ? (isLargeTablet ? 18 : 17) : 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isTablet ? (isLargeTablet ? 20 : 18) : 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: isTablet ? (isLargeTablet ? 16 : 15) : 14,
    color: '#999',
    fontWeight: '500',
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: isTablet ? (isLargeTablet ? 14 : 12) : 10,
    marginBottom: isTablet ? (isLargeTablet ? 20 : 18) : 16,
  },
  disclaimerText: {
    flex: 1,
    fontSize: isTablet ? (isLargeTablet ? 13 : 12) : 11,
    color: '#666',
    marginLeft: 8,
    lineHeight: isTablet ? (isLargeTablet ? 18 : 16) : 15,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: isTablet ? (isLargeTablet ? 18 : 17) : 14,
    color: '#666',
    fontWeight: '400',
  },
  registerLinkText: {
    color: '#8F1A27',
    fontWeight: 'bold',
    fontSize: isTablet ? (isLargeTablet ? 18 : 17) : 14,
  },
  title: {
    fontSize: isTablet ? (isLargeTablet ? 56 : 48) : 32,
    fontWeight: 'bold',
    color: '#FFC540',
    marginBottom: isTablet ? 12 : 8,
    textAlign: 'center',
    textShadowColor: '#FFC540',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    letterSpacing: 2,
  },
  title2: {
    color: '#ffffff',
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
  logoContainer: {
    position: 'relative',
    marginBottom: isTablet ? (isLargeTablet ? 50 : 40) : 30,
  },
  logo: {
    width: isTablet ? (isLargeTablet ? 280 : 240) : 170, 
    height: isTablet ? (isLargeTablet ? 200 : 170) : 120,
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
});

export default LoginScreen; 