
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { theme } from '../theme';

const styles = StyleSheet.create({
  table: {
    width: '100%',
    marginTop: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: theme.colors.slate[900],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: theme.radius.sm,
    borderTopRightRadius: theme.radius.sm,
  },
  headerText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  zebraRow: {
    backgroundColor: theme.colors.bgSoft,
  },
  cellText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.slate[800],
  },
  cellBold: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.slate[50],
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.slate[900],
  },
});

interface Column {
  header: string;
  key: string;
  width: string;
  align?: 'left' | 'right' | 'center';
  bold?: boolean;
  render?: (val: any, item: any) => string | React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  showTotal?: boolean;
  totalLabel?: string;
  totalValue?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ columns, data, showTotal, totalLabel, totalValue }) => (
  <View style={styles.table}>
    <View style={styles.header}>
      {columns.map((col, idx) => (
        <Text key={idx} style={[styles.headerText, { width: col.width, textAlign: col.align || 'left' }]}>
          {col.header}
        </Text>
      ))}
    </View>
    {data.map((item, rowIdx) => (
      <View key={rowIdx} style={[styles.row, rowIdx % 2 !== 0 ? styles.zebraRow : {}]} wrap={false}>
        {columns.map((col, colIdx) => (
          <Text 
            key={colIdx} 
            style={[
              styles.cellText, 
              { width: col.width, textAlign: col.align || 'left' },
              col.bold ? styles.cellBold : {}
            ]}
          >
            {col.render ? col.render(item[col.key], item) : item[col.key]}
          </Text>
        ))}
      </View>
    ))}
    {showTotal && (
      <View style={styles.footer}>
        <Text style={[styles.cellBold, { flex: 1, fontSize: theme.typography.sizes.lg }]}>{totalLabel || 'TOTAL'}</Text>
        <Text style={[styles.cellBold, { textAlign: 'right', fontSize: theme.typography.sizes.xl }]}>{totalValue}</Text>
      </View>
    )}
  </View>
);
