import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation';
import { initializeAuth } from './src/store/slices/authSlice';
import { StatusBar } from 'expo-status-bar';
import { ToastManager } from './src/components/ui/toast';
import { Linking } from 'react-native';
import * as Updates from 'expo-updates';

export default function App() {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Initialize authentication state on app start
    store.dispatch(initializeAuth());

    // Check for OTA updates
    async function onFetchUpdateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          // Reload the app with the new update
          await Updates.reloadAsync();
        }
      } catch (error) {
        // Silent fail - app will continue with cached version
        console.log(`Error checking for updates: ${error}`);
      }
    }

    // Only check for updates in production builds (not development)
    if (__DEV__ === false && Updates.isEnabled) {
      onFetchUpdateAsync();
    }

    // Handle deep links when app is opened from a link
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    try {
      // Parse URL - could be https://cmutalenthub.netlify.app/reset-password?token=xxx
      // or cmutalenthub://reset-password?token=xxx
      let token: string | null = null;
      
      // Try URL parsing first
      try {
        const urlObj = new URL(url);
        token = urlObj.searchParams.get('token');
      } catch {
        // Fallback to regex if URL parsing fails (e.g., custom scheme)
        const tokenMatch = url.match(/[?&]token=([^&]+)/);
        if (tokenMatch) {
          token = decodeURIComponent(tokenMatch[1]);
        }
      }
      
      // Check if it's a reset password link
      if ((url.includes('/reset-password') || url.includes('reset-password')) && token) {
        // Navigate to reset password screen with token
        setTimeout(() => {
          if (navigationRef.current?.isReady?.()) {
            navigationRef.current.navigate('Auth', {
              screen: 'ResetPassword',
              params: { token },
            });
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  };

  return (
    <Provider store={store}>
      <StatusBar style="light" />
      <AppNavigator ref={navigationRef} />
      <ToastManager />
    </Provider>
  );
}
