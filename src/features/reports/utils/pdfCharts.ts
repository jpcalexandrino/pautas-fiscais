import { theme } from '../theme';

/**
 * Utilitários para geração de gráficos SVG nativos no React-PDF.
 * Focado em performance e nitidez.
 */

export const generateLineChart = (data: number[], labels: string[], width: number = 500, height: number = 150) => {
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const max = Math.max(...data) * 1.2 || 1;
  const min = 0;

  const points = data.map((val, i) => {
    const x = data.length > 1 ? padding + (i / (data.length - 1)) * chartWidth : padding + chartWidth / 2;
    const y = height - (padding + ((val - min) / (max - min)) * chartHeight);
    return { x, y };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return {
    points,
    pathData,
    max,
    min,
    width,
    height
  };
};

export const generateDonutChart = (data: { value: number; color: string }[], size: number = 100) => {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = size / 2;
  const innerRadius = radius * 0.6;
  const center = radius;

  let currentAngle = -Math.PI / 2;

  const segments = data.map(d => {
    const angle = (d.value / total) * Math.PI * 2;
    const x1 = center + radius * Math.cos(currentAngle);
    const y1 = center + radius * Math.sin(currentAngle);

    currentAngle += angle;

    const x2 = center + radius * Math.cos(currentAngle);
    const y2 = center + radius * Math.sin(currentAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${center} ${center} Z`;

    return {
      path,
      color: d.color,
      percent: (d.value / total) * 100
    };
  });

  return {
    segments,
    radius,
    innerRadius,
    center
  };
};

export const generateBarChart = (data: number[], labels: string[], width: number = 500, height: number = 150) => {
  const padding = 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const max = Math.max(...data) * 1.1 || 1;
  const barWidth = data.length > 0 ? (chartWidth / data.length) * 0.7 : 0;
  const gap = data.length > 0 ? (chartWidth / data.length) * 0.3 : 0;

  const bars = data.map((val, i) => {
    const h = (val / max) * chartHeight;
    const x = padding + i * (barWidth + gap);
    const y = height - padding - h;
    return { x, y, width: barWidth, height: h, value: val, label: labels[i] };
  });

  return {
    bars,
    max,
    width,
    height,
    padding
  };
};
