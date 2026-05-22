const SYNAPSE_API_URL = process.env.SYNAPSE_API_URL;
const SYNAPSE_API_KEY = process.env.SYNAPSE_API_KEY;
const SYNAPSE_SLUG = process.env.SYNAPSE_SLUG;

class AIService {
  async getOptimizationSuggestions(faturaData: any, equipmentList: any[], previousMonthData?: any): Promise<string> {
    if (!SYNAPSE_API_URL || !SYNAPSE_API_KEY) {
      throw new Error('SYNAPSE_API_URL ou SYNAPSE_API_KEY não configuradas');
    }

    const payload = this._buildPayload(faturaData, equipmentList, previousMonthData);

    try {
      const response = await fetch(`${SYNAPSE_API_URL}/${SYNAPSE_SLUG}`, {
        method: 'POST',
        headers: {
          'x-api-key': SYNAPSE_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error: any = await response.json().catch(() => ({}));
        throw new Error(`Erro Synapse API: ${error.message || response.statusText}`);
      }

      const data: any = await response.json();

      if (!data.success) {
        throw new Error(`Synapse retornou erro: ${data.message || 'resposta inválida'}`);
      }

      return data.data;
    } catch (error) {
      console.error('Erro ao chamar Synapse:', error);
      throw error;
    }
  }

  /**
   * Monta o payload com os dados calculados para enviar ao gateway.
   * O prompt template está configurado no gateway e interpola as chaves {{variavel}}.
   */
  private _buildPayload(fatura: any, equipment: any[], previousMonthData?: any): Record<string, any> {

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

    return {
      consumo_registrado: consumption,
      consumo_mes_anterior: prevConsumption,
      variacao_percentual: parseFloat(variation.toFixed(2)),
      variacao_label: variationLabel,
      valor_total_faturado: totalValue,
      carga_tributaria: taxes,
      icms,
      pis,
      cofins,
      modalidade,
      has_equipment: hasEquipment,
      equipamentos_texto: equipText,
      consumo_estimado_inventario: parseFloat(totalKwhAudit.toFixed(2)),
      custo_estimado_inventario: parseFloat(totalValueAudit.toFixed(2)),
      distorcao_percentual: parseFloat(distortion.toFixed(2))
    };
  }
}

export default new AIService();
