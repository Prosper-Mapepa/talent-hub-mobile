import * as React from "react"
import { TextInput, TextInputProps, StyleSheet } from "react-native"

interface InputProps extends TextInputProps {
  className?: string;
}

function Input({ className, style, ...props }: InputProps) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor="#6b7280"
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    // height: 40, 
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#374151',
  },
})

export { Input }
