
/**
 * Utilitários para estruturação e refinamento de Insights do PDF.
 */

export interface Insight {
  type: 'alert' | 'opportunity' | 'risk' | 'success';
  title: string;
  description: string;
  impact?: string;
  action?: string;
}

export const formatAIInsights = (rawText: string | null): Insight[] => {
  if (!rawText) return [];

  const insights: Insight[] = [];
  const lines = rawText.split('\n');

  let currentInsight: Partial<Insight> | null = null;

  // Regex para detectar cabeçalhos como "### Titulo" ou "1. Titulo" ou "**1. Titulo**" ou "TITULO:"
  const headerRegex = /^(?:###|##|\d+\.|\*\*\d+\.)\s*([^*#:]+)|^(ANÁLISE|DIAGNÓSTICO|OPORTUNIDADES|PARECER)\s+([^:*#]+):?/i;


  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const headerMatch = trimmed.match(headerRegex);

    if (headerMatch) {
      if (currentInsight && currentInsight.title) {
        currentInsight.impact = (currentInsight.type === 'opportunity' && currentInsight.title.toLowerCase().includes('otimização')) ? 'Redução de 5-12%' : undefined;
        insights.push(currentInsight as Insight);
      }

      const title = (headerMatch[1] || headerMatch[0]).replace(/[:*#]/g, '').trim();

      currentInsight = {
        title: title,
        type: title.toLowerCase().includes('risco') || title.toLowerCase().includes('desvio') ? 'risk' : 'opportunity',
        description: ''
      };
    } else {
      if (currentInsight) {
        const cleanLine = trimmed.replace(/\*\*/g, '');
        currentInsight.description += (currentInsight.description ? '\n' : '') + cleanLine;
      }
    }
  }

  if (currentInsight && currentInsight.title) {
    currentInsight.impact = (currentInsight.type === 'opportunity' && currentInsight.title.toLowerCase().includes('otimização')) ? 'Redução de 5-12%' : undefined;
    insights.push(currentInsight as Insight);
  }


  // Fallback se nada foi detectado
  if (insights.length === 0 && rawText.length > 10) {
    insights.push({
      type: 'opportunity',
      title: 'Análise Geral',
      description: rawText.replace(/\*\*/g, '')
    });
  }

  return insights;
}
