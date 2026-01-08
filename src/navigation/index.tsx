import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Import screens
import LoadingScreen from '../screens/LoadingScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';
import TermsConditionsScreen from '../screens/legal/TermsConditionsScreen';
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

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
  </Stack.Navigator>
);

const MainTabNavigator = () => {
  const { user } = useSelector((state: RootState) => state.auth);

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
      })}
    >
      <Tab.Screen name="Talents" component={TalentsScreen} />
      <Tab.Screen name="Jobs" component={JobsScreen} />
      {user?.role === 'student' && (
        <Tab.Screen name="Applications" component={ApplicationsScreen} />
      )}
      <Tab.Screen name="Messages" component={MessagesScreen} />
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
      options={{ title: 'Student Profile' }}
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

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    // Show loading screen
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Loading" component={LoadingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 