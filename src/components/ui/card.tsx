import * as React from "react"
import { View, Text, StyleSheet, ViewProps } from "react-native"

interface CardProps extends ViewProps {}

function Card({ style, ...props }: CardProps) {
  return (
    <View
      style={[styles.card, style]}
      {...props}
    />
  )
}

function CardHeader({ style, ...props }: ViewProps) {
  return (
    <View
      style={[styles.cardHeader, style]}
      {...props}
    />
  )
}

function CardTitle({ style, children, ...props }: ViewProps & { children?: React.ReactNode }) {
  return (
    <View
      style={[styles.cardTitle, style]}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text style={styles.cardTitleText}>{children}</Text>
      ) : (
        children
      )}
    </View>
  )
}

function CardDescription({ style, children, ...props }: ViewProps & { children?: React.ReactNode }) {
  return (
    <View
      style={[styles.cardDescription, style]}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text style={styles.cardDescriptionText}>{children}</Text>
      ) : (
        children
      )}
    </View>
  )
}

function CardAction({ style, ...props }: ViewProps) {
  return (
    <View
      style={[styles.cardAction, style]}
      {...props}
    />
  )
}

function CardContent({ style, ...props }: ViewProps) {
  return (
    <View
      style={[styles.cardContent, style]}
      {...props}
    />
  )
}

function CardFooter({ style, ...props }: ViewProps) {
  return (
    <View
      style={[styles.cardFooter, style]}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardDescription: {
    marginTop: 4,
  },
  cardDescriptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardAction: {
    alignSelf: 'flex-end',
  },
  cardContent: {
    flex: 1,
  },
  cardFooter: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
