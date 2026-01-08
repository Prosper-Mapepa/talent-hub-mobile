import * as React from "react"
import { View, Text, StyleSheet, ViewProps } from "react-native"

interface BadgeProps extends ViewProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children?: React.ReactNode;
}

function Badge({
  variant = 'default',
  children,
  style,
  ...props
}: BadgeProps) {
  const variantStyle = styles[variant] || styles.default;
  const textStyle = styles[`${variant}Text`] || styles.defaultText;

  // Ensure children is properly handled
  const renderChildren = () => {
    if (typeof children === 'string' || typeof children === 'number') {
      return (
        <Text style={[
          styles.text,
          textStyle
        ]}>
          {String(children)}
        </Text>
      );
    }
    // If children is already a React element (like <Text>), render it as-is
    return children;
  };

  return (
    <View
      style={[
        styles.badge,
        variantStyle,
        style
      ]}
      {...props}
    >
      {renderChildren()}
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  default: {
    backgroundColor: '#f97316',
  },
  secondary: {
    backgroundColor: '#FEC016',
  },
  destructive: {
    backgroundColor: '#dc2626',
  },
  outline: {
    backgroundColor: '#16a34a',
  },
  defaultText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  secondaryText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  destructiveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  outlineText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    
  },
})

export { Badge }
