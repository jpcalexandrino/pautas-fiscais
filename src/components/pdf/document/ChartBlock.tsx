
import React from 'react';
import { View, Text, StyleSheet, Svg, Path, Rect, Circle } from '@react-pdf/renderer';
import { theme } from '../theme';
import { generateLineChart, generateDonutChart, generateBarChart } from '../../../utils/pdf/pdfCharts';

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.slate[600],
    textTransform: 'uppercase',
    marginBottom: theme.spacing.md,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.muted,
  }
});

interface ChartBlockProps {
  title: string;
  type: 'line' | 'donut' | 'bar';
  data: number[] | { value: number; color: string }[];
  labels: string[];
  width?: number;
  height?: number;
}

export const ChartBlock: React.FC<ChartBlockProps> = ({ title, type, data, labels, width = 450, height = 150 }) => {
  return (
    <View style={styles.container} wrap={false}>
      <Text style={styles.title}>{title}</Text>
      
      {type === 'line' && (
        <LineChart data={data as number[]} labels={labels} width={width} height={height} />
      )}
      
      {type === 'donut' && (
        <DonutChart data={data as { value: number; color: string }[]} labels={labels} size={height} />
      )}

      {type === 'bar' && (
        <BarChart data={data as number[]} labels={labels} width={width} height={height} />
      )}
    </View>
  );
};


interface ChartSubProps {
  data: number[];
  labels: string[];
  width: number;
  height: number;
}

const LineChart = ({ data, labels, width, height }: ChartSubProps) => {
  const chart = generateLineChart(data, labels, width, height);
  return (
    <Svg width={width.toString()} height={height.toString()}>
      {/* Grid Lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(p => (
        <Path 
          key={p} 
          d={`M 20 ${height - 20 - (height - 40) * p} L ${width - 20} ${height - 20 - (height - 40) * p}`} 
          stroke={theme.colors.borderLight} 
          strokeWidth="1" 
        />
      ))}
      <Path d={chart.pathData} stroke={theme.colors.primary} strokeWidth="2" fill="none" />
      {chart.points.map((p, i) => (
        <React.Fragment key={i}>
          <Circle cx={p.x.toString()} cy={p.y.toString()} r="3" fill={theme.colors.white} stroke={theme.colors.primary} strokeWidth="1.5" />
          <Text 
            x={p.x.toString()} 
            y={(p.y - 10).toString()} 
            style={{ fontSize: 7, color: theme.colors.primary, textAnchor: 'middle', fontWeight: 'bold' }}
          >
            {Math.round(data[i]).toLocaleString('pt-BR')}
          </Text>
        </React.Fragment>
      ))}

      {/* Labels */}
      {labels.map((l, i) => (
        <Text key={i} x={chart.points[i].x.toString()} y={(height - 5).toString()} style={{ fontSize: 6, color: theme.colors.muted, textAnchor: 'middle' }}>{l}</Text>
      ))}
    </Svg>
  );
};

const BarChart = ({ data, labels, width, height }: ChartSubProps) => {
  const chart = generateBarChart(data, labels, width, height);
  return (
    <Svg width={width.toString()} height={height.toString()}>
      {chart.bars.map((b, i) => (
        <React.Fragment key={i}>
          <Rect x={b.x.toString()} y={b.y.toString()} width={b.width.toString()} height={b.height.toString()} fill={theme.colors.primary} rx="2" />
          <Text 
            x={(b.x + b.width / 2).toString()} 
            y={(b.y - 8).toString()} 
            style={{ fontSize: 7, color: theme.colors.primary, textAnchor: 'middle', fontWeight: 'bold' }}
          >
            {Math.round(data[i]).toLocaleString('pt-BR')}
          </Text>
        </React.Fragment>
      ))}

      {labels.map((l, i) => (
        <Text key={i} x={(chart.bars[i].x + chart.bars[i].width / 2).toString()} y={(height - 10).toString()} style={{ fontSize: 6, color: theme.colors.muted, textAnchor: 'middle' }}>{l}</Text>
      ))}
    </Svg>
  );
};

interface DonutChartProps {
  data: { value: number; color: string }[];
  labels: string[];
  size: number;
}

const DonutChart = ({ data, labels, size }: DonutChartProps) => {
  const chart = generateDonutChart(data, size);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
      <Svg width={size.toString()} height={size.toString()}>
        {chart.segments.map((s, i) => (
          <Path key={i} d={s.path} fill={s.color} />
        ))}
        <Circle cx={chart.center.toString()} cy={chart.center.toString()} r={chart.innerRadius.toString()} fill={theme.colors.white} />
      </Svg>
      <View style={{ gap: 6 }}>
        {data.map((d, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
            <Text style={styles.legendText}>{labels[i]}: {d.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
