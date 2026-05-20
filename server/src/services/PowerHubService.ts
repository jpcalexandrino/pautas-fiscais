import FaturaService from './FaturaService';

interface SyncStats {
  totalFetched: number;
  newImported: number;
  duplicatesSkipped: number;
}

class PowerHubService {
  /**
   * Helper to convert ISO Reference Date ("YYYY-MM-DD...") to Brazilian Reference Month format ("MM/YYYY")
   */
  private parseReferenceMonth(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    try {
      const datePart = dateStr.split('T')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) {
        return `${parts[1]}/${parts[0]}`; // MM/YYYY
      }
      return datePart;
    } catch {
      return '—';
    }
  }

  /**
   * Safe date formatter for SQL DATE columns (extracts YYYY-MM-DD from ISO string)
   */
  private formatDateOnly(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    try {
      return dateStr.split('T')[0];
    } catch {
      return null;
    }
  }

  /**
   * Formats address fields into a single, clean string
   */
  private formatAddress(address: any): string {
    if (!address) return '';
    const parts = [
      address.publicPlace,
      address.neighborhood,
      address.city,
      address.state
    ].filter((p): p is string => typeof p === 'string' && p.trim() !== '');
    return parts.join(', ');
  }

  private roundTariff(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(String(value).replace(',', '.').replace('%', '').trim());
    if (!Number.isFinite(num)) return 0;
    return Math.round(num * 1000) / 1000;
  }

  private parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(String(value).replace(',', '.').replace('%', '').trim());
    return Number.isFinite(num) ? num : 0;
  }

  private findBillableItemValue(items: any[], predicates: Array<(item: any) => boolean>): number {
    const item = items.find((x: any) => {
      if (!x || typeof x.name !== 'string') return false;
      return predicates.some(predicate => predicate(x));
    });
    return this.parseNumber(item?.value ?? item?.amount ?? item?.total);
  }

  private aliquotaValue(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const raw = String(value).replace(',', '.').replace('%', '').trim();
    const num = Number(raw);
    if (!Number.isFinite(num)) return 0;
    if (num >= 1) {
      return Math.round((num / 100) * 1000) / 1000;
    }
    return Math.round(num * 1000) / 1000;
  }

  /**
   * Main synchronization logic
   */
  async sync(options?: { installationId?: string; referenceMonth?: string }): Promise<SyncStats> {
    const { installationId, referenceMonth } = options || {};
    const apiKey = process.env.POWERHUB_API_KEY;
    const baseUrl = process.env.POWERHUB_API_URL;

    if (!apiKey || !baseUrl) {
      throw new Error('Configuração da API PowerHUB ausente no ambiente (.env)');
    }

    let skip = 0;
    const top = 100;
    let hasMore = true;
    const stats: SyncStats = {
      totalFetched: 0,
      newImported: 0,
      duplicatesSkipped: 0
    };

    // console.log(`Iniciando sincronização seletiva com a API PowerHUB (filtro inst: ${installationId || 'nenhum'}, mês: ${referenceMonth || 'nenhum'})...`);

    while (hasMore) {
      const url = `${baseUrl}?%24top=${top}&%24skip=${skip}`;
      // console.log(`Buscando lote de faturas (top=${top}, skip=${skip})...`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-way2-key': apiKey,
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        // console.error(`Erro ao consultar API PowerHUB (Status ${response.status}):`, errorText);
        throw new Error(`Erro na API PowerHUB: ${response.statusText} (${response.status})`);
      }

      const data: any = await response.json();
      const items = data.items || [];
      const totalCount = data.totalCount || 0;

      if (items.length === 0) {
        hasMore = false;
        break;
      }

      // console.log(`Processando lote de ${items.length} faturas recebidas...`);

      for (const item of items) {
        const mesRef = this.parseReferenceMonth(item.referenceDate);
        const instalacao = item.installationId || '';
        const numeroNF = item.invoiceNumber || '';

        // Filter by installationId if specified (skip if no match)
        if (installationId && installationId !== 'all' && instalacao !== installationId) {
          continue;
        }

        // Filter by referenceMonth if specified (skip if no match)
        if (referenceMonth && referenceMonth !== 'all' && mesRef !== referenceMonth) {
          continue;
        }

        stats.totalFetched++;

        // Fetch detailed invoice fields from the individual bill endpoint to retrieve consumptions and taxes
        let billableItems: any[] = [];
        let otherItems: any[] = [];
        let taxItems: any[] = [];

        try {
          const detailUrl = `${baseUrl}/${item.id}`;
          // console.log(`Buscando detalhes da fatura ID: ${item.id} (NF: ${numeroNF})...`);
          const detailResponse = await fetch(detailUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'x-way2-key': apiKey,
              'Cache-Control': 'no-cache'
            }
          });

          if (detailResponse.ok) {
            const detailData: any = await detailResponse.json();
            billableItems = detailData.billableItems || [];
            otherItems = detailData.otherItems || [];
            taxItems = detailData.taxItems || [];
          } else {
            // console.warn(`Aviso ao buscar detalhes da fatura ${item.id} (Status ${detailResponse.status})`);
          }
        } catch (error: any) {
          // console.error(`Erro ao buscar detalhes da fatura ${item.id}:`, error.message);
        }

        // Find detailed items in the billableItems list
        const tusdItem = billableItems.find((x: any) => x.area === 'Consumo TUSD' && x.name === 'Fora Ponta');
        const teItem = billableItems.find((x: any) => x.area === 'Consumo TE' && x.name === 'Fora Ponta');
        const yellowItem = billableItems.find((x: any) => x.area === 'Consumo TE' && x.name === 'Adicional Bandeira Amarela');
        const publicLightItem = billableItems.find((x: any) => x.area === 'Serviços' && x.name === 'Iluminação Pública');

        const detailItems = [...billableItems, ...otherItems];

        const multaValue = this.findBillableItemValue(detailItems, [
          (x: any) => x.name?.toLowerCase().includes('multa'),
          (x: any) => x.area?.toLowerCase().includes('multa')
        ]);
        const jurosMoraValue = this.findBillableItemValue(detailItems, [
          (x: any) => x.name?.toLowerCase().includes('juros'),
          (x: any) => x.area?.toLowerCase().includes('juros')
        ]);
        const atualizacaoMonetariaValue = this.findBillableItemValue(detailItems, [
          (x: any) => x.name?.toLowerCase().includes('atualiza'),
          (x: any) => x.area?.toLowerCase().includes('atualiza')
        ]);
        const ressarcimentoValue = this.findBillableItemValue(detailItems, [
          (x: any) => x.name?.toLowerCase().includes('ressarcimento'),
          (x: any) => x.area?.toLowerCase().includes('ressarcimento')
        ]);
        const outrosValue = jurosMoraValue + atualizacaoMonetariaValue;

        // Find taxes in the taxItems list
        const icmsItem = taxItems.find((x: any) => x.name === 'ICMS');
        const cofinsItem = taxItems.find((x: any) => x.name === 'COFINS');
        const pisItem = taxItems.find((x: any) => x.name === 'PIS' || x.name === 'PASEP' || x.name === 'PIS/PASEP');

        // Map PowerHUB object structure to PostgreSQL table fields
        const mappedFatura = {
          nome_do_site: item.clientName || item.customerName || 'PowerHUB Site',
          nome_do_cliente: item.customerName || item.clientName || 'Cliente PowerHUB',
          fonte: 'PowerHUB',
          modalidade_tarifaria: item.electricity?.tariffType || 'Convencional',
          data_insercao: new Date().toISOString().split('T')[0],
          nome_concessionaria: item.utilityProvider?.name || 'Way2 Distributor',
          cnpj_concessionaria: item.cnpjDistributor || item.utilityProvider?.legalIdentifier || '',
          endereco: this.formatAddress(item.address),
          cep: item.address?.zipCode || '',
          cidade: item.address?.city || '',
          uf: item.address?.state || '',
          cnpj: item.customerId || '',
          impostos_rs: Number(item.amount?.taxes) || 0,
          instalacao: instalacao,
          mes_referencia: mesRef,
          data_leitura_atualizada: this.formatDateOnly(item.readings?.date),
          data_leitura_anterior: this.formatDateOnly(item.readings?.previous),
          data_leitura_proxima: this.formatDateOnly(item.readings?.next),
          mes_consumo: mesRef,
          data_vencimento: this.formatDateOnly(item.dueDate),
          data_emissao: this.formatDateOnly(item.issueDate),
          valor_total_rs: Number(item.amount?.total) || 0,
          classe: item.electricity?.class || '',
          subclasse: item.electricity?.subClass || '',
          subgrupo: item.electricity?.group || '',
          codigo_barras: item.barcode || '',
          numero_nf: numeroNF,

          // Spreadsheet-specific detail fields mapped dynamically
          consumo_tusd_fora_ponta_rs: Number(tusdItem?.value) || 0,
          tarifa_consumo_tusd_fora_ponta: this.roundTariff(tusdItem?.tariff),
          medida_consumo_tusd_fora_ponta: Number(tusdItem?.measured) || 0,
          consumo_te_fora_ponta_rs: Number(teItem?.value) || 0,
          tarifa_consumo_te_fora_ponta: this.roundTariff(teItem?.tariff),
          medida_consumo_te_fora_ponta: Number(teItem?.measured) || 0,
          consumo_te_adicional_bandeira_amarela_rs: Number(yellowItem?.value) || 0,
          tarifa_consumo_te_adicional_bandeira_amarela: this.roundTariff(yellowItem?.tariff),
          medida_consumo_te_adicional_bandeira_amarela: Number(yellowItem?.measured) || 0,
          multa_rs: multaValue,
          juros_mora_rs: jurosMoraValue,
          atualizacao_monetaria_rs: atualizacaoMonetariaValue,
          ressarcimento_rs: ressarcimentoValue,
          outros_rs: outrosValue,
          aliquota_icms: this.aliquotaValue(icmsItem?.taxRate),
          base_calculo_icms_rs: Number(icmsItem?.taxableValue) || 0,
          custo_icms_rs: Number(icmsItem?.value) || 0,
          aliquota_cofins: this.aliquotaValue(cofinsItem?.taxRate),
          base_calculo_cofins_rs: Number(cofinsItem?.taxableValue) || 0,
          custo_cofins_rs: Number(cofinsItem?.value) || 0,
          aliquota_pis_pasep: this.aliquotaValue(pisItem?.taxRate),
          base_calculo_pis_pasep_rs: Number(pisItem?.taxableValue) || 0,
          custo_pis_pasep_rs: Number(pisItem?.value) || 0,
          servicos_iluminacao_publica_rs: Number(publicLightItem?.value) || 0,
          tarifa_servicos_iluminacao_publica: this.roundTariff(publicLightItem?.tariff),
          medida_servicos_iluminacao_publica: Number(publicLightItem?.measured) || 0,
        };

        // Insert or update the invoice in the database
        const status = await FaturaService.saveOrUpdateFatura(mappedFatura);
        if (status === 'inserted' || status === 'replaced') {
          stats.newImported++;
        } else {
          stats.duplicatesSkipped++;
        }
      }

      // Check paging condition
      if (items.length < top || skip + items.length >= totalCount) {
        hasMore = false;
      } else {
        skip += items.length;
      }
    }

    console.log(`Sincronização PowerHUB concluída! Estatísticas:`, stats);
    return stats;
  }
}

export default new PowerHubService();
