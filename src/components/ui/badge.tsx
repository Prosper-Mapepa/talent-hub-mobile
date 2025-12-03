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
  return (
    <View
      style={[
        styles.badge,
        styles[variant],
        style
      ]}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text style={[
          styles.text,
          styles[`${variant}Text`]
        ]}>
          {children}
        </Text>
      ) : (
        children
      )}
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
