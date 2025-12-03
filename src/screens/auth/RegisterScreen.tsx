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
import { AppDispatch, useAppSelector } from '../../store';
import { registerStudent, registerBusiness } from '../../store/slices/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../../types';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types';

const { width, height } = Dimensions.get('window');

const majors = [
  { value: 'COMPUTER_SCIENCE', label: 'Computer Science' },
  { value: 'BUSINESS_ADMINISTRATION', label: 'Business Administration' },
  { value: 'ELECTRICAL_ENGINEERING', label: 'Electrical Engineering' },
  { value: 'MECHANICAL_ENGINEERING', label: 'Mechanical Engineering' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'FINANCE', label: 'Finance' },
];
const years = [
  { value: 'FRESHMAN', label: 'Freshman' },
  { value: 'SOPHOMORE', label: 'Sophomore' },
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'GRADUATE', label: 'Graduate' },
];
const businessTypes = [
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'CONSULTING', label: 'Consulting' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'RETAIL', label: 'Retail' },
];

const RegisterScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'business'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  const logoScaleAnim = useState(new Animated.Value(0.8))[0];
  const formSlideAnim = useState(new Animated.Value(30))[0];

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
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const [studentData, setStudentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    major: '',
    year: '',
  });
  const [businessData, setBusinessData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessType: '',
    location: '',
  });

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useAppSelector(state => state.auth);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Register'>>();

  // Validation logic
  const validateStudentForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!studentData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!studentData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!studentData.email) newErrors.email = 'Email is required';
    if (!studentData.password) newErrors.password = 'Password is required';
    if (studentData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (studentData.password !== studentData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!studentData.major) newErrors.major = 'Major is required';
    if (!studentData.year) newErrors.year = 'Year is required';
    if (!agreedToTerms) newErrors.terms = 'You must agree to the terms and conditions';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateBusinessForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!businessData.businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!businessData.email) newErrors.email = 'Email is required';
    if (!businessData.password) newErrors.password = 'Password is required';
    if (businessData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (businessData.password !== businessData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!businessData.businessType) newErrors.businessType = 'Business type is required';
    if (!businessData.location) newErrors.location = 'Location is required';
    if (newErrors.businessName) {
      console.log('Business form errors:', { businessName: 'Business name is required' });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submission logic
  const handleStudentRegister = async () => {
    console.log('Student form data:', studentData);
    if (!validateStudentForm()) {
      console.log('Student form errors:', errors);
      return;
    }
    const { confirmPassword, ...registrationData } = studentData;
    try {
      const result = await dispatch(registerStudent({ ...registrationData, role: UserRole.STUDENT })).unwrap();
      console.log('Student registration result:', result);
    } catch (err: any) {
      console.log('Student registration error:', err);
      if (err.response) {
        console.log('Error response data:', err.response.data);
        console.log('Error response status:', err.response.status);
        console.log('Error response headers:', err.response.headers);
      } else if (err.request) {
        console.log('No response received:', err.request);
      } else {
        console.log('Error message:', err.message);
      }
    }
  };
  const handleBusinessRegister = async () => {
    console.log('Business form data:', businessData);
    if (!validateBusinessForm()) {
      console.log('Business form errors:', errors);
      return;
    }
    const { confirmPassword, ...registrationData } = businessData;
    try {
      const result = await dispatch(registerBusiness({
        ...businessData,
        firstName: 'Business',
        lastName: 'Account',
        role: UserRole.BUSINESS,
      })).unwrap();
      console.log('Business registration result:', result);
    } catch (err: any) {
      console.log('Business registration error:', err);
      if (err.response) {
        console.log('Error response data:', err.response.data);
        console.log('Error response status:', err.response.status);
        console.log('Error response headers:', err.response.headers);
      } else if (err.request) {
        console.log('No response received:', err.request);
      } else {
        console.log('Error message:', err.message);
      }
    }
  };

  // Field change handlers
  const handleStudentChange = (key: string, value: string) => {
    setStudentData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };
  const handleBusinessChange = (key: string, value: string) => {
    setBusinessData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
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
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
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
                <Animated.View 
                  style={[
                    styles.logoContainer,
                    {
                      transform: [{ scale: logoScaleAnim }]
                    }
                  ]}
                >
                  <View style={styles.logoGlow} />
                  <Image 
                    source={require('../../../assets/k.png')} 
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
                  Join the CMU TalentHub community
                </Animated.Text>
              </Animated.View>

              {/* Tab Container */}
              <Animated.View 
                style={[
                  styles.tabContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'student' && styles.activeTab]}
                  onPress={() => setActiveTab('student')}
                >
                  <Text style={[styles.tabText, activeTab === 'student' && styles.activeTabText]}>STUDENT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'business' && styles.activeTab]}
                  onPress={() => setActiveTab('business')}
                >
                  <Text style={[styles.tabText, activeTab === 'business' && styles.activeTabText]}>BUSINESS</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Error Message */}
              {error && (
                <Animated.View 
                  style={[
                    styles.errorContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }]
                    }
                  ]}
                >
                  <Ionicons name="alert-circle-outline" size={16} color="#ff4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              {/* Form */}
              <Animated.View 
                style={[
                  styles.form,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: formSlideAnim }]
                  }
                ]}
              >
                {activeTab === 'student' ? (
                  <View style={styles.nameRow}>
                    <View style={[styles.inputContainer, styles.halfInput]}>
                      <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        placeholderTextColor="#666"
                        value={studentData.firstName}
                        onChangeText={text => handleStudentChange('firstName', text)}
                      />
                      {errors.firstName && <Text style={styles.fieldError}>{errors.firstName}</Text>}
                    </View>
                    <View style={[styles.inputContainer, styles.halfInput]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        placeholderTextColor="#666"
                        value={studentData.lastName}
                        onChangeText={text => handleStudentChange('lastName', text)}
                      />
                      {errors.lastName && <Text style={styles.fieldError}>{errors.lastName}</Text>}
                    </View>
                  </View>
                ) : (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Business Name"
                      placeholderTextColor="#666"
                      value={businessData.businessName}
                      onChangeText={text => handleBusinessChange('businessName', text)}
                    />
                    {errors.businessName && <Text style={styles.fieldError}>{errors.businessName}</Text>}
                  </View>
                )}
                <View style={styles.inputContainer}>
                  {/* <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} /> */}
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#666"
                    value={activeTab === 'student' ? studentData.email : businessData.email}
                    onChangeText={text => activeTab === 'student' ? handleStudentChange('email', text) : handleBusinessChange('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
                {activeTab === 'student' ? (
                  <>
                    <View style={styles.inputContainer}>
                      {/* <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} /> */}
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#666"
                        value={studentData.password}
                        onChangeText={text => handleStudentChange('password', text)}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
                    <View style={styles.inputContainer}>
                      {/* <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} /> */}
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor="#666"
                        value={studentData.confirmPassword}
                        onChangeText={text => handleStudentChange('confirmPassword', text)}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}
                    <View style={styles.inputContainer}>
                      <Picker
                        selectedValue={studentData.major}
                        onValueChange={(value: string) => handleStudentChange('major', value)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Major" value="" />
                        {majors.map(option => (
                          <Picker.Item key={option.value} label={option.label} value={option.value} />
                        ))}
                      </Picker>
                    </View>
                    {errors.major && <Text style={styles.fieldError}>{errors.major}</Text>}
                    <View style={styles.inputContainer}>
                      <Picker
                        selectedValue={studentData.year}
                        onValueChange={(value: string) => handleStudentChange('year', value)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Year" value="" />
                        {years.map(option => (
                          <Picker.Item key={option.value} label={option.label} value={option.value} />
                        ))}
                      </Picker>
                    </View>
                    {errors.year && <Text style={styles.fieldError}>{errors.year}</Text>}
                  </>
                ) : (
                  <>
                    <View style={styles.inputContainer}>
                      {/* <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} /> */}
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#666"
                        value={businessData.password}
                        onChangeText={text => handleBusinessChange('password', text)}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
                    <View style={styles.inputContainer}>
                      {/* <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} /> */}
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor="#666"
                        value={businessData.confirmPassword}
                        onChangeText={text => handleBusinessChange('confirmPassword', text)}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}
                    <View style={styles.inputContainer}>
                      <Picker
                        selectedValue={businessData.businessType}
                        onValueChange={(value: string) => handleBusinessChange('businessType', value)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Business Type" value="" />
                        {businessTypes.map(option => (
                          <Picker.Item key={option.value} label={option.label} value={option.value} />
                        ))}
                      </Picker>
                    </View>
                    {errors.businessType && <Text style={styles.fieldError}>{errors.businessType}</Text>}
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Location"
                        placeholderTextColor="#666"
                        value={businessData.location}
                        onChangeText={text => handleBusinessChange('location', text)}
                      />
                    </View>
                    {errors.location && <Text style={styles.fieldError}>{errors.location}</Text>}
                  </>
                )}
                <View style={styles.termsRow}>
                  <TouchableOpacity onPress={() => setAgreedToTerms(!agreedToTerms)} style={styles.checkbox}>
                    <Ionicons name={agreedToTerms ? 'checkbox' : 'square-outline'} size={20} color="#8F1A27" />
                  </TouchableOpacity>
                  <View style={styles.termsTextContainer}>
                    <Text style={styles.termsText}>I agree to the </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('TermsConditions')}>
                      <Text style={styles.termsConditionsLink}>Terms and Conditions</Text>
                    </TouchableOpacity>
                    <Text style={styles.termsText}> and </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                      <Text style={styles.privacyPolicyLink}>Privacy Policy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {errors.terms && <Text style={styles.fieldError}>{errors.terms}</Text>}
                <TouchableOpacity
                  style={[styles.registerButton, isLoading && styles.disabledButton]}
                  onPress={activeTab === 'student' ? handleStudentRegister : handleBusinessRegister}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#8F1A27', '#6A0032', '#8F1A27']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>{activeTab === 'student' ? 'Create Student Account' : 'Create Business Account'}</Text>}
                  </LinearGradient>
                </TouchableOpacity>
                
                {/* Sign In Link */}
                <View style={styles.signInContainer}>
                  <Text style={styles.signInText}>Have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.signInLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
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
  header: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    zIndex: 1,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute',
    top: -9,
    left: -9,
    right: -9,
    bottom: -9,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 197, 64, 0.2)',
    zIndex: 1,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 197, 64, 0.3)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFC540',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  activeTabText: {
    color: '#8F1A27',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginLeft: 8,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginBottom: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    height: 52,
    marginBottom: 16,
  },
  halfInput: {
    flex: 0.48,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  passwordToggle: {
    padding: 8,
  },
  picker: {
    flex: 1,
    color: '#666',
    // height: '100%',
  },
  fieldError: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    // marginLeft: 10,
  },
  checkbox: {
    marginRight: 10,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
  },
  privacyPolicyLink: {
    fontSize: 14,
    color: '#8F1A27',
    // fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  termsConditionsLink: {
    fontSize: 14,
    color: '#8F1A27',
    // fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  registerButton: {
    borderRadius: 12,
    height: 52,
    overflow: 'hidden',
    shadowColor: '#8F1A27',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
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
  termsText2: {
    color: '#8F1A27',
    textDecorationLine: 'underline',
    
    // fontWeight: 'bold',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signInText: {
    fontSize: 14,
    color: '#666',
  },
  signInLink: {
    fontSize: 14,
    color: '#8F1A27',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen; 