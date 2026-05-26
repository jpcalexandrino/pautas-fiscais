
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { theme } from '../../theme';

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.bgSoft,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.md,
    flex: 1,
  },
  label: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.secondary,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  value: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
  },
});

interface KPIBoxProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  color?: string;
}

export const KPIBox: React.FC<KPIBoxProps> = ({ label, value, trend, trendLabel, color }) => {
  const isPositive = trend && trend > 0;
  const trendColor = isPositive ? theme.colors.status.critical : theme.colors.status.excellent; // No caso de energia, aumento é ruim (red)

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, color ? { color } : {}]}>{value}</Text>
      {trend !== undefined && (
        <View style={styles.trendContainer}>
          <Text style={[styles.trendText, { color: trendColor }]}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </Text>
          <Text style={[styles.trendText, { color: theme.colors.muted, marginLeft: 4, fontWeight: theme.typography.weights.regular }]}>
            {trendLabel || 'vs mês ant.'}
          </Text>
        </View>
      )}
    </View>
  );
};
