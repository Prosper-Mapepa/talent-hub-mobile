import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface TabBarIconProps {
  route: string;
  focused: boolean;
  color: string;
  size: number;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ route, focused, color, size }) => {
  let iconName: keyof typeof Ionicons.glyphMap;

  switch (route) {
    case 'Jobs':
      iconName = focused ? 'briefcase' : 'briefcase-outline';
      break;
    case 'Talents':
      iconName = focused ? 'star' : 'star-outline';
      break;
    case 'Products':
      iconName = focused ? 'apps' : 'apps-outline';
      break;
    case 'Applications':
      iconName = focused ? 'document-text' : 'document-text-outline';
      break;
    case 'Messages':
      iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
      break;
    case 'Profile':
      iconName = focused ? 'person' : 'person-outline';
      break;
    case 'Dashboard':
      iconName = focused ? 'business' : 'business-outline';
      break;
    default:
      iconName = 'help-outline';
  }

  return <Ionicons name={iconName} size={size} color={color} />;
};

export default TabBarIcon; 