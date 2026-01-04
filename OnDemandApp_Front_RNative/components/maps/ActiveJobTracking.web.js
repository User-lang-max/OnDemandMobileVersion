import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ActiveJobTracking() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Interactive Map is only available on Mobile app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  text: {
    color: '#666',
  }
});