import * as React from "react"
import { View, Text, StyleSheet, ViewProps } from "react-native"

interface AlertProps extends ViewProps {
  variant?: 'default' | 'destructive';
  children?: React.ReactNode;
}

const Alert = React.forwardRef<View, AlertProps>(
  ({ variant = 'default', style, children, ...props }, ref) => (
    <View
      ref={ref}
      style={[
        styles.alert,
        styles[variant],
        style
      ]}
      {...props}
    >
      {children}
    </View>
  )
)
Alert.displayName = "Alert"

interface AlertTitleProps extends ViewProps {
  children?: React.ReactNode;
}

const AlertTitle = React.forwardRef<View, AlertTitleProps>(
  ({ style, children, ...props }, ref) => (
    <View ref={ref} style={[styles.alertTitle, style]} {...props}>
      {typeof children === 'string' ? (
        <Text style={styles.alertTitleText}>{children}</Text>
      ) : (
        children
      )}
    </View>
  ),
)
AlertTitle.displayName = "AlertTitle"

interface AlertDescriptionProps extends ViewProps {
  children?: React.ReactNode;
}

const AlertDescription = React.forwardRef<View, AlertDescriptionProps>(
  ({ style, children, ...props }, ref) => (
    <View ref={ref} style={[styles.alertDescription, style]} {...props}>
      {typeof children === 'string' ? (
        <Text style={styles.alertDescriptionText}>{children}</Text>
      ) : (
        children
      )}
    </View>
  ),
)
AlertDescription.displayName = "AlertDescription"

const styles = StyleSheet.create({
  alert: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  default: {
    backgroundColor: 'white',
    borderColor: '#e5e7eb',
  },
  destructive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  alertTitle: {
    marginBottom: 4,
  },
  alertTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  alertDescription: {
    marginTop: 4,
  },
  alertDescriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
})

export { Alert, AlertTitle, AlertDescription }
