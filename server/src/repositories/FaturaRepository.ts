import db from '../config/db';
import { QueryResult } from 'pg';

class FaturaRepository {
  async createTable(): Promise<QueryResult> {
    const queryText = `
      CREATE TABLE IF NOT EXISTS fato_faturas (
        sk_fatura SERIAL PRIMARY KEY,
        nome_do_site TEXT,
        nome_do_cliente TEXT,
        fonte TEXT,
        modalidade_tarifaria TEXT,
        data_insercao DATE,
        nome_concessionaria TEXT,
        cnpj_concessionaria TEXT,
        endereco TEXT,
        cep TEXT,
        cidade TEXT,
        uf TEXT,
        cnpj TEXT,
        impostos_rs NUMERIC,
        instalacao TEXT,
        mes_referencia TEXT,
        data_leitura_atualizada DATE,
        data_leitura_anterior DATE,
        data_leitura_proxima DATE,
        mes_consumo TEXT,
        data_vencimento DATE,
        data_emissao DATE,
        valor_total_rs NUMERIC,
        classe TEXT,
        subclasse TEXT,
        subgrupo TEXT,
        codigo_barras TEXT,
        numero_nf TEXT,
        consumo_tusd_fora_ponta_rs NUMERIC,
        tarifa_consumo_tusd_fora_ponta NUMERIC,
        medida_consumo_tusd_fora_ponta NUMERIC,
        consumo_te_fora_ponta_rs NUMERIC,
        tarifa_consumo_te_fora_ponta NUMERIC,
        medida_consumo_te_fora_ponta NUMERIC,
        consumo_te_adicional_bandeira_amarela_rs NUMERIC,
        tarifa_consumo_te_adicional_bandeira_amarela NUMERIC,
        medida_consumo_te_adicional_bandeira_amarela NUMERIC,
        multa_rs NUMERIC,
        juros_mora_rs NUMERIC,
        atualizacao_monetaria_rs NUMERIC,
        ressarcimento_rs NUMERIC,
        outros_rs NUMERIC,
        aliquota_icms NUMERIC,
        base_calculo_icms_rs NUMERIC,
        custo_icms_rs NUMERIC,
        aliquota_cofins NUMERIC,
        base_calculo_cofins_rs NUMERIC,
        custo_cofins_rs NUMERIC,
        aliquota_pis_pasep NUMERIC,
        base_calculo_pis_pasep_rs NUMERIC,
        custo_pis_pasep_rs NUMERIC,
        servicos_iluminacao_publica_rs NUMERIC,
        tarifa_servicos_iluminacao_publica NUMERIC,
        medida_servicos_iluminacao_publica NUMERIC,
        D_E_L_E_T_ VARCHAR(1) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return db.query(queryText);
  }

  async insert(fatura: any): Promise<QueryResult> {
    const fields = [
      'nome_do_site', 'nome_do_cliente', 'fonte', 'modalidade_tarifaria', 'data_insercao',
      'nome_concessionaria', 'cnpj_concessionaria', 'endereco', 'cep', 'cidade', 'uf', 'cnpj',
      'impostos_rs', 'instalacao', 'mes_referencia', 'data_leitura_atualizada',
      'data_leitura_anterior', 'data_leitura_proxima', 'mes_consumo', 'data_vencimento',
      'data_emissao', 'valor_total_rs', 'classe', 'subclasse', 'subgrupo', 'codigo_barras',
      'numero_nf', 'consumo_tusd_fora_ponta_rs', 'tarifa_consumo_tusd_fora_ponta',
      'medida_consumo_tusd_fora_ponta', 'consumo_te_fora_ponta_rs', 'tarifa_consumo_te_fora_ponta',
      'medida_consumo_te_fora_ponta', 'consumo_te_adicional_bandeira_amarela_rs',
      'tarifa_consumo_te_adicional_bandeira_amarela', 'medida_consumo_te_adicional_bandeira_amarela',
      'multa_rs', 'juros_mora_rs', 'atualizacao_monetaria_rs', 'ressarcimento_rs', 'outros_rs', 'aliquota_icms', 'base_calculo_icms_rs',
      'custo_icms_rs', 'aliquota_cofins', 'base_calculo_cofins_rs', 'custo_cofins_rs',
      'aliquota_pis_pasep', 'base_calculo_pis_pasep_rs', 'custo_pis_pasep_rs',
      'servicos_iluminacao_publica_rs', 'tarifa_servicos_iluminacao_publica',
      'medida_servicos_iluminacao_publica'
    ];

    const values = fields.map(field => {
      const val = fatura[field];
      return (val !== undefined && val !== null) ? val : null;
    });

    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const queryText = `INSERT INTO fato_faturas (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    
    return db.query(queryText, values);
  }

  private normalizeMonth(val: string | null | undefined): string {
    if (!val) return '';
    const clean = String(val).trim().split(' ')[0];
    const parts = clean.split(/[/-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[1]}/${parts[0]}`;
      }
      return `${parts[1]}/${parts[2]}`;
    }
    if (parts.length === 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return clean;
  }

  async findActiveMatches(instalacao: string, mes_referencia: string): Promise<any[]> {
    const cleanInstalacao = String(instalacao || '').trim();

    const queryMonth = `
      SELECT * FROM fato_faturas
      WHERE instalacao = $1 AND D_E_L_E_T_ <> '*'
    `;
    const resultMonth = await db.query(queryMonth, [cleanInstalacao]);

    const targetMonthNormalized = this.normalizeMonth(mes_referencia);
    if (targetMonthNormalized === '') return [];

    return resultMonth.rows.filter(row => this.normalizeMonth(row.mes_referencia) === targetMonthNormalized);
  }

  async checkExists(instalacao: string, mes_referencia: string): Promise<boolean> {
    const matches = await this.findActiveMatches(instalacao, mes_referencia);
    return matches.length > 0;
  }

  async softDeleteByIds(ids: number[]): Promise<QueryResult> {
    if (ids.length === 0) {
      return db.query('SELECT 1');
    }
    return db.query("UPDATE fato_faturas SET D_E_L_E_T_ = '*' WHERE sk_fatura = ANY($1::int[])", [ids]);
  }

  async getAll(): Promise<QueryResult> {
    return db.query("SELECT * FROM fato_faturas WHERE D_E_L_E_T_ <> '*' ORDER BY created_at DESC");
  }

  async deleteAll(): Promise<QueryResult> {
    return db.query('DELETE FROM fato_faturas');
  }
}

export default new FaturaRepository();
