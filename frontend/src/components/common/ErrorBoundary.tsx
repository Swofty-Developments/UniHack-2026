import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 40 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  message: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});
