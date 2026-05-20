
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { theme } from '../theme';

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgSoft,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    alignItems: 'center',
  },
  headerText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
    textTransform: 'uppercase',
  },
  cellText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  }
});

interface BenchmarkItem {
  indicator: string;
  unit: string;
  value: string | number;
  benchmark: string | number;
  status: 'above' | 'below' | 'equal';
  evaluation: string;
  invert?: boolean; // Se true, "above" é ruim (red)
}

interface BenchmarkTableProps {
  items: BenchmarkItem[];
}

export const BenchmarkTable: React.FC<BenchmarkTableProps> = ({ items }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={[styles.headerText, { width: '30%' }]}>Indicador</Text>
      <Text style={[styles.headerText, { width: '15%', textAlign: 'right' }]}>Unidade</Text>
      <Text style={[styles.headerText, { width: '15%', textAlign: 'right' }]}>Valor Atual</Text>
      <Text style={[styles.headerText, { width: '20%', textAlign: 'right' }]}>Benchmark</Text>
      <Text style={[styles.headerText, { width: '20%', textAlign: 'right' }]}>Avaliação</Text>
    </View>
    {items.map((item, idx) => {
      const isBad = item.status === 'above' && item.invert;
      const badgeColor = item.status === 'equal' ? theme.colors.status.good : (isBad ? theme.colors.status.critical : theme.colors.status.excellent);
      
      return (
        <View key={idx} style={styles.row}>
          <Text style={[styles.cellText, { width: '30%', fontWeight: theme.typography.weights.medium }]}>{item.indicator}</Text>
          <Text style={[styles.cellText, { width: '15%', textAlign: 'right', color: theme.colors.muted }]}>{item.unit}</Text>
          <Text style={[styles.cellText, { width: '15%', textAlign: 'right', fontWeight: theme.typography.weights.bold }]}>{item.value}</Text>
          <View style={{ width: '20%', alignItems: 'flex-end' }}>
            <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
              <Text style={styles.statusText}>{item.benchmark}</Text>
            </View>
          </View>
          <Text style={[styles.cellText, { width: '20%', textAlign: 'right', fontWeight: theme.typography.weights.bold, color: badgeColor }]}>
            {item.evaluation}
          </Text>
        </View>
      );
    })}
  </View>
);
