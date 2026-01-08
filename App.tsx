import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation';
import { initializeAuth } from './src/store/slices/authSlice';
import { StatusBar } from 'expo-status-bar';
import { ToastManager } from './src/components/ui/toast';

export default function App() {
  useEffect(() => {
    // Initialize authentication state on app start
    store.dispatch(initializeAuth());
  }, []);

  return (
    <Provider store={store}>
      <StatusBar style="light" />
      <AppNavigator />
      <ToastManager />
    </Provider>
  );
}
