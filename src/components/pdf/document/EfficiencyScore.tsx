
import React from 'react';
import { View, Text, StyleSheet, Svg, Circle } from '@react-pdf/renderer';
import { theme } from '../theme';

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.slate[950],
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: theme.typography.sizes.xs,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    marginBottom: 8,
  },
  description: {
    fontSize: theme.typography.sizes.sm,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.4,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    marginLeft: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: theme.typography.sizes.huge,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    position: 'absolute',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    textTransform: 'uppercase',
  }
});

interface EfficiencyScoreProps {
  score: number;
  label: string;
  color: string;
  description: string;
}

export const EfficiencyScore: React.FC<EfficiencyScoreProps> = ({ score, label, color, description }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const safeScore = isNaN(score) ? 0 : score;
  const progress = (safeScore / 100) * circumference;
  const dashArray = `${progress} ${circumference - progress}`;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Pontuação de Eficiência Energética</Text>
        <Text style={styles.title}>Auditoria de Performance</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={[styles.statusBadge, { backgroundColor: color }]}>
          <Text style={styles.statusText}>{label}</Text>
        </View>
      </View>

      <View style={styles.scoreCircle}>
        <Svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
          <Circle
            cx="50"
            cy="50"
            r={radius.toString()}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          <Circle
            cx="50"
            cy="50"
            r={radius.toString()}
            stroke={color}
            strokeWidth="8"
            strokeDasharray={dashArray}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
        <Text style={styles.scoreValue}>{safeScore}</Text>
      </View>
    </View>
  );
};
