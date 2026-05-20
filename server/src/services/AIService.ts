const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

class AIService {
  async getOptimizationSuggestions(faturaData: any, equipmentList: any[], previousMonthData?: any): Promise<string> {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY não configurada');
    }

    const prompt = this._buildPrompt(faturaData, equipmentList, previousMonthData);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Você é um Consultor Sênior em Eficiência Energética. 
                Sua missão é transformar dados técnicos em insights estratégicos para redução de custos.

                DIRETRIZES DE RESPOSTA:
                1. ESTRUTURA: Use títulos em Markdown (###), negrito para ênfase e listas técnicas.
                2. TOM DE VOZ: Profissional, analítico e resolutivo. Evite termos genéricos como "é importante". Vá direto ao ponto.
                3. PRECISÃO: Ao citar valores financeiros, use o formato R$ 0,00.
                4. FOCO EM ROI: Sempre que sugerir uma melhoria, mencione o impacto direto no custo ou na vida útil dos equipamentos.
                5. IDIOMA: Português do Brasil.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const error: any = await response.json();
        throw new Error(`Erro Groq API: ${error.error?.message || response.statusText}`);
      }

      const data: any = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Erro ao chamar Groq:', error);
      throw error;
    }
  }

  private _buildPrompt(fatura: any, equipment: any[], previousMonthData?: any): string {

    const consumption = fatura.medidaConsumoTUSDForaPonta || fatura.medida_consumo_tusd_fora_ponta || 0;
    const totalValue = fatura.valorTotalRS || fatura.valor_total_rs || 0;

    const prevConsumption = previousMonthData ? (previousMonthData.medidaConsumoTUSDForaPonta || previousMonthData.medida_consumo_tusd_fora_ponta || 0) : 0;
    const variation = prevConsumption > 0 ? ((consumption / prevConsumption) - 1) * 100 : 0;
    const variationLabel = variation >= 0 ? 'AUMENTO' : 'REDUÇÃO';

    const icms = fatura.custoICMSRS || fatura.custo_icms_rs || 0;
    const pis = fatura.custoPISPASEPRS || fatura.custo_pis_pasep_rs || 0;
    const cofins = fatura.custoCOFINSRS || fatura.custo_cofins_rs || 0;
    const taxes = icms + pis + cofins;

    const modalidade = fatura.modalidadeTarifaria || fatura.modalidade_tarifaria || 'Não informada';

    const hasEquipment = equipment && equipment.length > 0;
    let equipText = 'Nenhum equipamento listado no inventário de carga.';
    let totalKwhAudit = 0;
    let totalValueAudit = 0;

    if (hasEquipment) {
      equipText = equipment.map(e => {
        const kwhDia = (e.quantity * (e.power_w || 0) * (e.hours_per_day || 0)) / 1000;
        const kwhMes = kwhDia * 22; 
        const tariff = e.tariff || 0.513; 
        const valueEst = kwhMes * tariff;

        totalKwhAudit += kwhMes;
        totalValueAudit += valueEst;

        return `- ${e.name}: Qtd ${e.quantity}, Potência ${e.power_w}W, Uso ${e.hours_per_day}h/dia, Consumo: ${kwhMes.toFixed(2)} kWh/mês, Valor Est.: ${valueEst.toFixed(2)}`;
      }).join('\n');
    }

    const distortion = totalValueAudit > 0 && totalValue > 0
      ? ((totalValueAudit / totalValue) - 1) * 100
      : 0;

    let taskInstructions = '';
    if (hasEquipment) {
      taskInstructions = `
        1. ANÁLISE DE CONFORMIDADE: Avalie a coerência entre a fatura real e o levantamento de campo (Distorção de ${distortion.toFixed(2)}%).
        2. ANÁLISE DE VARIAÇÃO: Comente sobre o ${variationLabel} de ${Math.abs(variation).toFixed(1)}% no consumo em relação ao mês anterior.
        3. DIAGNÓSTICO DE DESVIO: Se a distorção for superior a 10%, aponte causas técnicas prováveis.
        4. OPORTUNIDADES DE OTIMIZAÇÃO: Liste 3 ações práticas baseadas nos equipamentos citados para reduzir o consumo.
        5. PARECER ECONÔMICO: Comente sobre o impacto dos tributos e adequação da modalidade tarifária.
      `;
    } else {
      taskInstructions = `
        1. ANÁLISE DE PERFIL DE CONSUMO: Como não há inventário de carga, foque na análise do consumo registrado (${consumption} kWh) e na variação de ${Math.abs(variation).toFixed(1)}% (${variationLabel}).
        2. ANÁLISE DE TARIFAÇÃO: Avalie o impacto do valor faturado (R$ ${totalValue.toLocaleString('pt-BR')}) em relação à modalidade ${modalidade}.
        3. DIAGNÓSTICO TRIBUTÁRIO: Analise o peso dos tributos (R$ ${taxes.toLocaleString('pt-BR')}) na composição do custo.
        4. RECOMENDAÇÕES ESTRATÉGICAS: Sugira a realização de um levantamento de carga para maior precisão e recomende boas práticas gerais de eficiência.
        5. PERSPECTIVA DE ECONOMIA: Com base apenas no histórico, estime o potencial de ganho com a migração ou ajuste de demanda, se aplicável.
      `;
    }

    return `
        CONTEXTO DE AUDITORIA ENERGÉTICA
        ---
        VALORES DA FATURA ATUAL:
        - Consumo Registrado: ${consumption} kWh
        - Consumo Mês Anterior: ${prevConsumption} kWh
        - Variação: ${variation.toFixed(2)}% (${variationLabel})
        - Valor Total Faturado: R$ ${totalValue.toLocaleString('pt-BR')}
        - Carga Tributária (ICMS/PIS/COFINS): R$ ${taxes.toLocaleString('pt-BR')}
        - Modalidade: ${modalidade}

        RESULTADOS DO INVENTÁRIO (CAMPO):
        ${equipText}

        MÉTRICAS DE CONTROLE:
        - Consumo Estimado via Inventário: ${totalKwhAudit.toFixed(2)} kWh/mês
        - Custo Estimado via Inventário: R$ ${totalValueAudit.toFixed(2)}
        - Desvio (Distorção): ${distortion.toFixed(2)}%

        TAREFA:
        Componha uma análise técnica dividida nos seguintes tópicos para o relatório:
        ${taskInstructions}

        Gere o texto em blocos limpos, prontos para PDF. Não adicione saudações iniciais ou finais.
        `;
  }
}

export default new AIService();
