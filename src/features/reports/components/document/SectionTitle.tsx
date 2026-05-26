
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { theme } from '../../theme';

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accent: {
    width: 3,
    height: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.muted,
    fontWeight: theme.typography.weights.medium,
    marginLeft: 11,
    marginTop: -4,
    marginBottom: 10,
  }
});

interface SectionTitleProps {
  children: string;
  subtitle?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children, subtitle }) => (
  <View>
    <View style={styles.container}>
      <View style={styles.accent} />
      <Text style={styles.title}>{children}</Text>
    </View>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);
