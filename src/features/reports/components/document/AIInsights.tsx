

import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { theme } from '../../theme';
import { InsightCard } from './InsightCard';

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.md,
    gap: 12,
  }
});

interface InsightItem {
  type: 'opportunity' | 'risk' | 'alert' | 'success';
  title: string;
  description: string;
  impact?: string;
}

interface AIInsightsProps {
  insights: InsightItem[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ insights }) => {
  return (
    <View style={styles.container}>
      {insights.map((insight, idx) => (
        <InsightCard 
          key={idx}
          type={insight.type}
          title={insight.title}
          description={insight.description}
          impact={insight.impact}
        />
      ))}
    </View>
  );
};

