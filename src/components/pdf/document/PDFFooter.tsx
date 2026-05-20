
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { theme } from '../theme';
import { formatDate } from '../../../utils/formatters';

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: theme.spacing.pagePadding,
    left: theme.spacing.pagePadding,
    right: theme.spacing.pagePadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingTop: theme.spacing.md,
  },
  text: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.muted,
    fontWeight: theme.typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pageNumber: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.muted,
    fontWeight: theme.typography.weights.bold,
  },
});

export const PDFFooter: React.FC = () => (
  <View style={styles.footer} fixed>
    <Text style={styles.text}>EnergyMax ADM e Serviços Ltda | Resumo Preliminar • {formatDate(new Date())}</Text>
    <Text
      style={styles.pageNumber}
      render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
    />
  </View>
);
