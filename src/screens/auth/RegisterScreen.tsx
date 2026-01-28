import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { registerStudent, registerBusiness } from '../../store/slices/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../../types';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types';
import apiService from '../../services/api';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768 || (Platform.OS === 'ios' && Platform.isPad);
const isLargeTablet = width >= 1024;

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
  const [activeTab, setActiveTab] = useState<'student' | 'faculty' | 'business'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showMajorPicker, setShowMajorPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showBusinessTypePicker, setShowBusinessTypePicker] = useState(false);

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

  // EULA acceptance during registration:
  // 1. User checks checkbox (agreedToTerms = true)
  // 2. User can read full EULA by clicking Terms link
  // 3. After registration, user is authenticated and EulaGuard will check/accept EULA
  // For now, we just track the checkbox state for validation

  const [studentData, setStudentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    major: '',
    year: '',
    department: '',
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
    if (activeTab === 'student') {
      if (!studentData.major) newErrors.major = 'Major is required';
      if (!studentData.year) newErrors.year = 'Year is required';
    }
    if (activeTab === 'faculty' && !studentData.department.trim()) {
      newErrors.department = 'Department is required';
    }
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
      const selectedRole = activeTab === 'faculty' ? UserRole.FACULTY : UserRole.STUDENT;
      const payload: any = {
        ...registrationData,
        role: selectedRole,
      };
      // Backend requires major/year; for faculty we silently send generic defaults
      if (activeTab === 'faculty') {
        payload.major = payload.major || 'COMPUTER_SCIENCE';
        payload.year = payload.year || 'GRADUATE';
      }
      const result = await dispatch(registerStudent(payload)).unwrap();
      console.log('Student registration result:', result);
    } catch (err: any) {
      console.log('Student registration error:', err);
      // Extract and format error message
      const errorMessage = typeof err === 'string' 
        ? err 
        : err?.response?.data?.message || err?.message || 'Registration failed';
      const formattedError = Array.isArray(errorMessage)
        ? errorMessage[0] || errorMessage.join(', ')
        : errorMessage;
      
      // Display error using Alert
      Alert.alert(
        'Please check your information',
        formattedError,
        [{ text: 'OK' }]
      );
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
      // Include agreedToTerms in registration
      const result = await dispatch(registerBusiness({
        ...businessData,
        firstName: 'Business',
        lastName: 'Account',
        role: UserRole.BUSINESS,
        agreedToTerms: agreedToTerms,
      })).unwrap();
      console.log('Business registration result:', result);
      
      // After successful registration, user will be authenticated
      // EulaGuard will automatically check and show EULA if needed
    } catch (err: any) {
      console.log('Business registration error:', err);
      // Extract and format error message
      const errorMessage = typeof err === 'string' 
        ? err 
        : err?.response?.data?.message || err?.message || 'Registration failed';
      const formattedError = Array.isArray(errorMessage)
        ? errorMessage[0] || errorMessage.join(', ')
        : errorMessage;
      
      // Display error using Alert
      Alert.alert(
        'Please check your information',
        formattedError,
        [{ text: 'OK' }]
      );
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
              contentContainerStyle={[styles.scrollContent, isTablet && styles.scrollContentTablet]}
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
                
                {/* <Animated.Text 
                  style={[
                    styles.subtitle,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }]
                    }
                  ]}
                >
                  Join the CMU TalentHub community
                </Animated.Text> */}
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
                  style={[styles.tab, activeTab === 'faculty' && styles.activeTab]}
                  onPress={() => setActiveTab('faculty')}
                >
                  <Text style={[styles.tabText, activeTab === 'faculty' && styles.activeTabText]}>FACULTY</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'business' && styles.activeTab]}
                  onPress={() => setActiveTab('business')}
                >
                  <Text style={[styles.tabText, activeTab === 'business' && styles.activeTabText]}>BUSINESS</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Error Message - Removed per user request */}

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
                {activeTab !== 'business' ? (
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
                  <>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Business Name"
                        placeholderTextColor="#666"
                        value={businessData.businessName}
                        onChangeText={text => handleBusinessChange('businessName', text)}
                      />
                    </View>
                    {errors.businessName && <Text style={styles.fieldError}>{errors.businessName}</Text>}

                    <TouchableOpacity 
                      style={styles.selectContainer}
                      onPress={() => setShowBusinessTypePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.selectText, !businessData.businessType && styles.selectPlaceholder]}>
                        {businessData.businessType ? businessTypes.find(bt => bt.value === businessData.businessType)?.label : 'Select Business Type'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
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

                    {/* Business Type Picker Modal */}
                    <Modal
                      visible={showBusinessTypePicker}
                      transparent={true}
                      animationType="slide"
                      onRequestClose={() => setShowBusinessTypePicker(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                          <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Business Type</Text>
                            <TouchableOpacity onPress={() => setShowBusinessTypePicker(false)}>
                              <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                          </View>
                          <Picker
                            selectedValue={businessData.businessType}
                            onValueChange={(value: string) => {
                              handleBusinessChange('businessType', value);
                              setShowBusinessTypePicker(false);
                            }}
                            style={styles.modalPicker}
                          >
                            <Picker.Item label="Select Business Type" value="" />
                            {businessTypes.map(option => (
                              <Picker.Item key={option.value} label={option.label} value={option.value} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                    </Modal>
                  </>
                )}
                <View style={styles.inputContainer}>
                  {/* <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} /> */}
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#666"
                    value={activeTab === 'business' ? businessData.email : studentData.email}
                    onChangeText={text =>
                      activeTab === 'business'
                        ? handleBusinessChange('email', text)
                        : handleStudentChange('email', text)
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
                {activeTab === 'business' ? (
                  <>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#666"
                        value={businessData.password}
                        onChangeText={text => handleBusinessChange('password', text)}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={isTablet ? (isLargeTablet ? 24 : 22) : 20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor="#666"
                        value={businessData.confirmPassword}
                        onChangeText={text => handleBusinessChange('confirmPassword', text)}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity
                        style={styles.passwordToggle}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={isTablet ? (isLargeTablet ? 24 : 22) : 20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}
                  </>
                ) : (
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
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={isTablet ? (isLargeTablet ? 24 : 22) : 20} color="#666" />
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
                        <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={isTablet ? (isLargeTablet ? 24 : 22) : 20} color="#666" />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}
                    {activeTab === 'faculty' ? (
                      <>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            placeholder="Department"
                            placeholderTextColor="#666"
                            value={studentData.department}
                            onChangeText={text => handleStudentChange('department', text)}
                          />
                        </View>
                        {errors.department && <Text style={styles.fieldError}>{errors.department}</Text>}
                      </>
                    ) : (
                      <>
                        <TouchableOpacity 
                          style={styles.selectContainer}
                          onPress={() => setShowMajorPicker(true)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.selectText, !studentData.major && styles.selectPlaceholder]}>
                            {studentData.major ? majors.find(m => m.value === studentData.major)?.label : 'Select Major'}
                          </Text>
                          <Ionicons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>
                        {errors.major && <Text style={styles.fieldError}>{errors.major}</Text>}
                        <TouchableOpacity 
                          style={styles.selectContainer}
                          onPress={() => setShowYearPicker(true)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.selectText, !studentData.year && styles.selectPlaceholder]}>
                            {studentData.year ? years.find(y => y.value === studentData.year)?.label : 'Select Year'}
                          </Text>
                          <Ionicons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>
                        {errors.year && <Text style={styles.fieldError}>{errors.year}</Text>}
                        
                        {/* Major Picker Modal */}
                        <Modal
                          visible={showMajorPicker}
                          transparent={true}
                          animationType="slide"
                          onRequestClose={() => setShowMajorPicker(false)}
                        >
                          <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                              <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Major</Text>
                                <TouchableOpacity onPress={() => setShowMajorPicker(false)}>
                                  <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                              </View>
                              <Picker
                                selectedValue={studentData.major}
                                onValueChange={(value: string) => {
                                  handleStudentChange('major', value);
                                  setShowMajorPicker(false);
                                }}
                                style={styles.modalPicker}
                              >
                                <Picker.Item label="Select Major" value="" />
                                {majors.map(option => (
                                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                                ))}
                              </Picker>
                            </View>
                          </View>
                        </Modal>

                        {/* Year Picker Modal */}
                        <Modal
                          visible={showYearPicker}
                          transparent={true}
                          animationType="slide"
                          onRequestClose={() => setShowYearPicker(false)}
                        >
                          <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                              <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Year</Text>
                                <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                                  <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                              </View>
                              <Picker
                                selectedValue={studentData.year}
                                onValueChange={(value: string) => {
                                  handleStudentChange('year', value);
                                  setShowYearPicker(false);
                                }}
                                style={styles.modalPicker}
                              >
                                <Picker.Item label="Select Year" value="" />
                                {years.map(option => (
                                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                                ))}
                              </Picker>
                            </View>
                          </View>
                        </Modal>
                      </>
                    )}
                  </>
                )}
                <View style={styles.termsRow}>
                  <TouchableOpacity 
                    onPress={() => setAgreedToTerms(!agreedToTerms)} 
                    style={styles.checkbox}
                  >
                    <Ionicons name={agreedToTerms ? 'checkbox' : 'square-outline'} size={20} color="#8F1A27" />
                  </TouchableOpacity>
                  <View style={styles.termsTextContainer}>
                    <Text style={styles.termsText}>I agree to the </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Eula')}>
                      <Text style={styles.termsConditionsLink}>Terms of Service</Text>
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
                  onPress={activeTab === 'business' ? handleBusinessRegister : handleStudentRegister}
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
                      <Text style={styles.registerButtonText}>
                        {activeTab === 'business'
                          ? 'Create Business Account'
                          : activeTab === 'faculty'
                            ? 'Create Faculty Account'
                            : 'Create Student Account'}
                      </Text>
                    )}
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
  scrollContentTablet: {
    paddingHorizontal: isLargeTablet ? 100 : 80,
    maxWidth: isLargeTablet ? 700 : 600,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: isTablet ? (isLargeTablet ? 40 : 30) : 5,
    marginBottom: isTablet ? (isLargeTablet ? 50 : 40) : 20,
    zIndex: 1,
  },
  logoContainer: {
    position: 'relative',
  },
  logo: {
    width: isTablet ? (isLargeTablet ? 280 : 240) : 160, 
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
  title: {
    fontSize: isTablet ? (isLargeTablet ? 56 : 48) : 28,
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
  subtitle: {
    fontSize: isTablet ? (isLargeTablet ? 22 : 20) : 14,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 3,
    marginBottom: isTablet ? (isLargeTablet ? 30 : 25) : 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 197, 64, 0.3)',
    maxWidth: '100%',
    alignSelf: 'center',
  },
  tab: {
    flex: 1,
    paddingVertical: isTablet ? (isLargeTablet ? 16 : 14) : 10,
    paddingHorizontal: isTablet ? (isLargeTablet ? 20 : 18) : 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFC540',
  },
  tabText: {
    fontSize: isTablet ? (isLargeTablet ? 18 : 16) : 12,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
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
    fontSize: isTablet ? (isLargeTablet ? 16 : 15) : 14,
    marginLeft: 8,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: isTablet ? (isLargeTablet ? 40 : 32) : 16,
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
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  halfInput: {
    flex: 0.48,
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
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: isTablet ? (isLargeTablet ? 20 : 18) : 14,
    backgroundColor: '#F9FAFB',
    height: isTablet ? (isLargeTablet ? 60 : 56) : 46,
    marginBottom: isTablet ? (isLargeTablet ? 18 : 16) : 12,
    justifyContent: 'space-between',
  },
  selectText: {
    flex: 1,
    fontSize: isTablet ? (isLargeTablet ? 20 : 19) : 16,
    color: '#333',
  },
  selectPlaceholder: {
    color: '#666',
  },
  picker: {
    flex: 1,
    color: '#333',
    fontSize: isTablet ? (isLargeTablet ? 20 : 19) : 16,
    height: isTablet ? (isLargeTablet ? 70 : 64) : 52,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: isTablet ? (isLargeTablet ? 22 : 20) : 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalPicker: {
    height: 200,
  },
  fieldError: {
    color: '#ff4444',
    fontSize: isTablet ? (isLargeTablet ? 14 : 13) : 12,
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
    fontSize: isTablet ? (isLargeTablet ? 16 : 15) : 14,
    color: '#666',
  },
  privacyPolicyLink: {
    fontSize: isTablet ? (isLargeTablet ? 16 : 15) : 14,
    color: '#8F1A27',
    // fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  termsConditionsLink: {
    fontSize: isTablet ? (isLargeTablet ? 16 : 15) : 14,
    color: '#8F1A27',
    // fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  registerButton: {
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
    fontSize: isTablet ? (isLargeTablet ? 22 : 20) : 16,
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