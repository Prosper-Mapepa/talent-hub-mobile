import * as React from "react"
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from "react-native"

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

function Button({
  variant = 'default',
  size = 'default',
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        styles[size],
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
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  default: {
    backgroundColor: '#8F1A27',
  },
  destructive: {
    backgroundColor: '#dc2626',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8F1A27',
  },
  secondary: {
    backgroundColor: '#f3f4f6',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
  },
  defaultText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  destructiveText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  outlineText: {
    color: '#8F1A27',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  ghostText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  linkText: {
    color: '#8F1A27',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  default: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lg: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  icon: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
})

export { Button }
