
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { theme } from '../theme';

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.md,
    paddingLeft: 20,
  },
  item: {
    position: 'relative',
    paddingBottom: 20,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
    paddingLeft: 20,
  },
  dot: {
    position: 'absolute',
    left: -4,
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  date: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.muted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  description: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.secondary,
    lineHeight: 1.4,
  }
});

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

interface TimelineBlockProps {
  events: TimelineEvent[];
}

export const TimelineBlock: React.FC<TimelineBlockProps> = ({ events }) => (
  <View style={styles.container}>
    {events.map((event, idx) => (
      <View key={idx} style={[styles.item, idx === events.length - 1 ? { borderLeftWidth: 0 } : {}]}>
        <View style={styles.dot} />
        <Text style={styles.date}>{event.date}</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.description}>{event.description}</Text>
      </View>
    ))}
  </View>
);
