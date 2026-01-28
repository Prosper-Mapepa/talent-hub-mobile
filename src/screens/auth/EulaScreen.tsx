import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/api';

const { width, height } = Dimensions.get('window');

interface EulaScreenProps {
  onAccept?: (version: number) => void;
  onReject?: () => void;
}

const EulaScreen: React.FC<EulaScreenProps> = ({ onAccept, onReject }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Eula'>>();
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const [eula, setEula] = useState<{ version: number; content: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    loadEula();
    checkAuthToken();
  }, []);

  const checkAuthToken = async () => {
    // Check if user has auth token (either from Redux or AsyncStorage)
    const tokenFromStorage = await AsyncStorage.getItem('authToken');
    const hasAuth = !!(token || tokenFromStorage || isAuthenticated);
    setHasToken(hasAuth);
  };

  const loadEula = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCurrentEula();
      setEula(response);
    } catch (error: any) {
      console.error('Error loading EULA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!eula || accepting || accepted) return;

    // Check if user is authenticated before accepting EULA
    const tokenFromStorage = await AsyncStorage.getItem('authToken');
    const hasAuth = !!(token || tokenFromStorage || isAuthenticated);
    
    // If onAccept callback is provided (from EulaGuard), trust that parent has checked auth
    // If no callback, we're in registration flow - only allow acceptance if authenticated
    if (!hasAuth && !onAccept) {
      Alert.alert(
        'View Only',
        'You can read the Terms of Service. To accept the terms, please complete registration first. The terms will be automatically accepted after you register.',
        [{ text: 'OK' }]
      );
      return;
    }

    // If authenticated or onAccept callback provided, proceed with acceptance
    if (!hasAuth) {
      Alert.alert(
        'Authentication Required',
        'You must be logged in to accept the Terms of Service. Please complete registration or log in first.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setAccepting(true);
      await apiService.acceptEula(eula.version);
      setAccepted(true);
      if (onAccept) {
        onAccept(eula.version);
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error accepting EULA:', error);
      
      // Provide more specific error message for 401
      if (error.response?.status === 401) {
        Alert.alert(
          'Authentication Error',
          'You are not authenticated. Please log in and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to accept terms. Please try again.');
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = () => {
    Alert.alert(
      'Terms Required',
      'You must accept the Terms of Service to use CMU TalentHub.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            if (onReject) {
              onReject();
            } else {
              navigation.goBack();
            }
          },
        },
        {
          text: 'Read Again',
          onPress: () => {},
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#8F1A27', '#6A0032']}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFC540" />
              <Text style={styles.loadingText}>Loading Terms of Service...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (!eula) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#8F1A27', '#6A0032']}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#FFC540" />
              <Text style={styles.errorText}>Failed to load Terms of Service</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadEula}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8F1A27', '#6A0032']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (onReject) {
                  onReject();
                } else {
                  navigation.goBack();
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Terms of Service</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.content}>
              <Text style={styles.eulaText}>{eula.content}</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {!hasToken && !onAccept ? (
              // During registration flow (viewing only) - show close button instead
              <TouchableOpacity
                style={[styles.acceptButton, styles.viewOnlyButton]}
                onPress={() => navigation.goBack()}
              >
                <LinearGradient
                  colors={['#8F1A27', '#6A0032', '#8F1A27']}
                  style={styles.acceptButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.acceptButtonText}>Close</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              // Authenticated flow - show accept/decline buttons
              <>
                <TouchableOpacity
                  style={[styles.rejectButton, (accepting || accepted) && styles.disabledButton]}
                  onPress={handleReject}
                  disabled={accepting || accepted}
                >
                  <Text style={styles.rejectButtonText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.acceptButton, (accepting || accepted) && styles.disabledButton]}
                  onPress={handleAccept}
                  disabled={accepting || accepted}
                >
                  <LinearGradient
                    colors={['#8F1A27', '#6A0032', '#8F1A27']}
                    style={styles.acceptButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {accepting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.acceptButtonText}>
                        {accepted ? 'Accepted' : 'Accept & Continue'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  eulaText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 2,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  viewOnlyButton: {
    flex: 1,
    marginHorizontal: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFC540',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#8F1A27',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EulaScreen;
