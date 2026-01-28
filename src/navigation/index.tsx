import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchConversations } from '../store/slices/messagesSlice';

// Import screens
import LoadingScreen from '../screens/LoadingScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';
import TermsConditionsScreen from '../screens/legal/TermsConditionsScreen';
import EulaScreen from '../screens/auth/EulaScreen';
import JobsScreen from '../screens/jobs/JobsScreen';
import JobDetailScreen from '../screens/jobs/JobDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';
import ApplicationsScreen from '../screens/applications/ApplicationsScreen';
import BusinessDashboardScreen from '../screens/business/BusinessDashboardScreen';
import PostJobScreen from '../screens/business/PostJobScreen';
import StudentProfileScreen from '../screens/profile/StudentProfileScreen';
import BusinessProfileScreen from '../screens/profile/BusinessProfileScreen';
import TalentsScreen from '../screens/talents/TalentsScreen';
import AddTalentScreen from '../screens/talents/AddTalentScreen';
import TalentDetailScreen from '../screens/talents/TalentDetailScreen';
import EditTalentScreen from '../screens/talents/EditTalentScreen';
import ProductsScreen from '../screens/products/ProductsScreen';
import ProfileTalentsScreen from '../screens/profile/TalentsScreen';
import MyTalentsScreen from '../screens/profile/MyTalentsScreen';
import SkillsScreen from '../screens/profile/SkillsScreen';
import ProjectsScreen from '../screens/profile/ProjectsScreen';
import AchievementsScreen from '../screens/profile/AchievementsScreen';
import JobApplicationsScreen from '../screens/business/JobApplicationsScreen';

// Import components
import TabBarIcon from '../components/TabBarIcon';
import { COLORS } from '../theme/colors';
import EulaGuard from '../components/EulaGuard';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
    <Stack.Screen name="Eula" component={EulaScreen} />
  </Stack.Navigator>
);

const MainTabNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { conversations } = useSelector((state: RootState) => state.messages);

  // Fetch conversations when user is available (on login) and poll for updates
  React.useEffect(() => {
    if (!user?.id) return;

    // Initial fetch
    const fetchInitialConversations = () => {
      dispatch(fetchConversations()).catch((error: any) => {
        // Silently fail - don't show error if it's a 401 (user probably logged out)
        if (error?.response?.status !== 401) {
          console.error('Failed to fetch conversations:', error);
        }
      });
    };

    fetchInitialConversations();

    // Poll for new conversations every 30 seconds
    const intervalId = setInterval(() => {
      dispatch(fetchConversations()).catch((error: any) => {
        if (error?.response?.status !== 401) {
          console.error('Failed to poll conversations:', error);
        }
      });
    }, 30000); // Poll every 30 seconds

    // Cleanup interval on unmount or when user changes
    return () => {
      clearInterval(intervalId);
    };
  }, [dispatch, user?.id]);

  // Calculate unread message count (conversations with lastMessage not sent by current user)
  const unreadCount = React.useMemo(() => {
    if (!user?.id || !Array.isArray(conversations)) return 0;
    return conversations.filter(conv => {
      if (!conv.lastMessage) return false;
      // Count as unread if last message is not from current user
      return conv.lastMessage.senderId !== user.id && conv.lastMessage.sender?.id !== user.id;
    }).length;
  }, [conversations, user?.id]);

  return (
    <Tab.Navigator
      initialRouteName="Talents"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon route={route.name} focused={focused} color={color} size={size} />
        ),
        tabBarActiveTintColor: '#6A0032',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 10,
        },
      })}
    >
      <Tab.Screen name="Talents" component={TalentsScreen} />
      <Tab.Screen name="Jobs" component={JobsScreen} />
      {user?.role === 'student' && (
        <Tab.Screen name="Applications" component={ApplicationsScreen} />
      )}
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#dc2626',
            fontSize: 12,
            minWidth: 20,
            height: 20,
          },
        }}
      />
      {/* <Tab.Screen name="Products" component={ProductsScreen} /> */}
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {user?.role === 'business' && (
        <Tab.Screen name="Dashboard" component={BusinessDashboardScreen} />
      )}
    </Tab.Navigator>
  );
};

const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerTintColor: COLORS.maroon,
    }}
  >
    <Stack.Screen 
      name="MainTabs" 
      component={MainTabNavigator} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="JobDetail" 
      component={JobDetailScreen}
      options={{ title: 'Job Details' }}
    />
    <Stack.Screen 
      name="PostJob" 
      component={PostJobScreen}
      options={{ title: 'Post Job' }}
    />
    <Stack.Screen 
      name="StudentProfile" 
      component={StudentProfileScreen}
      options={{ title: '' }}
    />
    <Stack.Screen 
      name="BusinessProfile" 
      component={BusinessProfileScreen}
      options={{ title: 'Business Profile' }}
    />
    <Stack.Screen 
      name="JobApplications" 
      component={JobApplicationsScreen}
      options={{ title: 'Applications', headerShown: false }}
    />
    <Stack.Screen 
      name="TalentDetail" 
      component={TalentDetailScreen}
      options={{ 
        title: 'Talent Details',
      }}
    />
    <Stack.Screen 
      name="AddTalent" 
      component={AddTalentScreen}
      options={{ title: 'Add Talent' }}
    />
    <Stack.Screen 
      name="EditTalent" 
      component={EditTalentScreen}
      options={{ title: 'Edit Talent' }}
    />
    <Stack.Screen 
      name="Talents" 
      component={ProfileTalentsScreen}
      options={{ title: 'Talents' }}
    />
    <Stack.Screen 
      name="MyTalents" 
      component={MyTalentsScreen}
      options={{ title: 'My Talents' }}
    />
    <Stack.Screen 
      name="Skills" 
      component={SkillsScreen}
      options={{ title: 'Skills' }}
    />
    <Stack.Screen 
      name="Projects" 
      component={ProjectsScreen}
      options={{ title: 'Projects' }}
    />
    <Stack.Screen 
      name="Achievements" 
      component={AchievementsScreen}
      options={{ title: 'Achievements' }}
    />
  </Stack.Navigator>
);

const AppNavigator = React.forwardRef<any>((props, ref) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const navigationRef = useRef<any>(null);
  const isInitialLoad = useRef(true);

  // Expose navigation ref to parent for deep linking
  React.useImperativeHandle(ref, () => navigationRef.current, []);

  // Only show loading screen on initial app load, not during login attempts
  React.useEffect(() => {
    if (!isLoading && isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, [isLoading]);

  const shouldShowLoading = isLoading && isInitialLoad.current;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {shouldShowLoading ? (
          <Stack.Screen name="Loading" component={LoadingScreen} />
        ) : isAuthenticated ? (
          <Stack.Screen name="Main">
            {() => (
              <EulaGuard>
                <MainStack />
              </EulaGuard>
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthStack}
            options={{ 
              transitionSpec: {
                open: { animation: 'timing', config: { duration: 0 } },
                close: { animation: 'timing', config: { duration: 0 } },
              },
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
});

AppNavigator.displayName = 'AppNavigator';

export default AppNavigator; 