
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { theme } from '../theme';

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.bgSoft,
    borderRadius: theme.radius.md,
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  title: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    marginBottom: 4,
  },
  description: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.slate[700],
    lineHeight: 1.5,
  },
  impactTag: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  impactLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
  }
});

interface InsightCardProps {
  type: 'opportunity' | 'risk' | 'alert' | 'success';
  title: string;
  description: string;
  impact?: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({ type, title, description, impact }) => {
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'risk': return { color: theme.colors.status.critical, borderColor: theme.colors.status.critical };
      case 'alert': return { color: theme.colors.status.attention, borderColor: theme.colors.status.attention };
      case 'success': return { color: theme.colors.status.excellent, borderColor: theme.colors.status.excellent };
      default: return { color: theme.colors.primary, borderColor: theme.colors.primary };
    }
  };

  const typeStyle = getTypeStyles(type);

  return (
    <View style={[styles.card, { borderLeftColor: typeStyle.borderColor }]}>
      <Text style={[styles.title, { color: typeStyle.color }]}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {impact && (
        <View style={styles.impactTag}>
          <Text style={[styles.impactLabel, { color: theme.colors.muted }]}>Impacto Estimado:</Text>
          <Text style={[styles.impactLabel, { color: typeStyle.color }]}>{impact}</Text>
        </View>
      )}
    </View>
  );
};
