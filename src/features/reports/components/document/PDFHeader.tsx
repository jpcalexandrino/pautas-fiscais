
import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { theme } from '../../theme';
import { formatDate, formatMesReferencia } from '@shared/utils/formatters';
import logo from '@/assets/logoenergymax.png';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    height: 110,
    width: 'auto',
  },
  infoContainer: {
    textAlign: 'right',
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.muted,
    marginTop: 4,
  },
});

interface PDFHeaderProps {
  title: string;
  siteName?: string;
  referenceDate?: string;
}

export const PDFHeader: React.FC<PDFHeaderProps> = ({ title, siteName, referenceDate }) => (
  <View style={styles.header} fixed>
    <View style={styles.logoContainer}>
      <Image src={logo} style={styles.logo} />
    </View>
    <View style={styles.infoContainer}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        {siteName} {referenceDate ? `• ${formatMesReferencia(referenceDate)}` : ''}
      </Text>
    </View>
  </View>
);
