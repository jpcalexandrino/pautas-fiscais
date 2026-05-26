
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { theme } from '../../theme';

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: 8,
  },
  text: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.slate[700],
    lineHeight: 1.6,
  },
  highlight: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.slate[900],
  }
});

interface ExecutiveSummaryProps {
  content: string;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ content }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Contexto Executivo</Text>
    <Text style={styles.text}>{content}</Text>
  </View>
);
