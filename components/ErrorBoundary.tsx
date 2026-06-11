import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SOL_THEME } from '../constants/theme';

interface State { hasError: boolean; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.glyph}>⊚</Text>
        <Text style={styles.title}>Sol stumbled</Text>
        <Text style={styles.body}>
          Something in the signal broke. Your threads are safe — tap to return.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => this.setState({ hasError: false })}
        >
          <Text style={styles.buttonText}>Return to Sol</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SOL_THEME.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  glyph: {
    fontSize: 48,
    marginBottom: 24,
    opacity: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: SOL_THEME.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: SOL_THEME.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  button: {
    borderWidth: 1,
    borderColor: SOL_THEME.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  buttonText: {
    color: SOL_THEME.primary,
    fontSize: 15,
    fontWeight: '500',
  },
});
