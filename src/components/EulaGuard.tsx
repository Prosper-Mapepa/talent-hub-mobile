import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import EulaScreen from '../screens/auth/EulaScreen';
import apiService from '../services/api';

interface EulaGuardProps {
  children: React.ReactNode;
}

/**
 * EulaGuard component that automatically shows EULA screen
 * if user is authenticated but hasn't accepted the current EULA
 */
const EulaGuard: React.FC<EulaGuardProps> = ({ children }) => {
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);
  const [showEula, setShowEula] = useState(false);
  const [checkingEula, setCheckingEula] = useState(true);
  const [eulaAccepted, setEulaAccepted] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && token) {
      checkEulaAcceptance();
    } else {
      setCheckingEula(false);
      setShowEula(false);
      setEulaAccepted(false);
    }
  }, [isAuthenticated, user?.id, token]);

  const checkEulaAcceptance = async () => {
    try {
      setCheckingEula(true);
      const result = await apiService.checkEulaAcceptance();
      if (!result.accepted) {
        // User hasn't accepted current EULA, show it
        setShowEula(true);
        setEulaAccepted(false);
      } else {
        // User has accepted
        setShowEula(false);
        setEulaAccepted(true);
      }
    } catch (error: any) {
      // If 401, user might not be logged in yet, or token expired
      if (error.response?.status === 401) {
        console.log('EULA check requires authentication');
        setShowEula(false);
        setEulaAccepted(false);
      } else {
        console.error('Error checking EULA acceptance:', error);
        // On error, assume EULA needs to be accepted (safer for compliance)
        setShowEula(true);
        setEulaAccepted(false);
      }
    } finally {
      setCheckingEula(false);
    }
  };

  const handleEulaAccept = async (version: number) => {
    try {
      // Double-check that user has token before accepting
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const tokenFromStorage = await AsyncStorage.getItem('authToken');
      
      if (!token && !tokenFromStorage) {
        console.error('Cannot accept EULA: No authentication token available');
        // Keep showing EULA if no token
        setShowEula(true);
        setEulaAccepted(false);
        return;
      }

      // Accept EULA - apiService.acceptEula takes version and optional ipAddress
      await apiService.acceptEula(version);
      setEulaAccepted(true);
      setShowEula(false);
      // Re-check to ensure acceptance was recorded
      await checkEulaAcceptance();
    } catch (error: any) {
      console.error('Error accepting EULA:', error);
      
      // Handle 401 specifically
      if (error.response?.status === 401) {
        console.error('401 Unauthorized: Token may be missing or invalid');
      }
      
      // Keep showing EULA if acceptance fails
      setShowEula(true);
      setEulaAccepted(false);
    }
  };

  const handleEulaReject = () => {
    // If user rejects, they can't use the app
    // Keep showing EULA until they accept
    // Optionally, you could log them out here
  };

  // Show loading while checking
  if (checkingEula && isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8F1A27" />
      </View>
    );
  }

  // Show EULA if user is authenticated but hasn't accepted
  if (showEula && isAuthenticated && !eulaAccepted) {
    return (
      <EulaScreen
        onAccept={handleEulaAccept}
        onReject={handleEulaReject}
      />
    );
  }

  // User has accepted EULA or is not authenticated
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default EulaGuard;
