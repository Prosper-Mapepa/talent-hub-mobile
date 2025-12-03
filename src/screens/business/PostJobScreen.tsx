import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PostJobScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Post Job</Text>
      <Text style={styles.subtitle}>Create a new job posting</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default PostJobScreen; 