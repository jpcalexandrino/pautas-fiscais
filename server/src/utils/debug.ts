import '../config/env';
import db from '../config/db';
import { TextractCompactor } from '../services/TextractCompactor';

async function main() {
  try {
    const res = await db.query('SELECT filename, uf, textract_json FROM pauta_arquivo_ocr ORDER BY updated_at DESC LIMIT 1');
    const { filename, uf, textract_json } = res.rows[0];
    
    const compacted = TextractCompactor.compact(textract_json, uf);
    const lines = compacted.split('\n');
    const matches: string[] = [];

    lines.forEach((line) => {
      const lower = line.toLowerCase();
      // Look for lines that contain our brand terms in the compacted table markdown
      if (lower.includes('imperio') || lower.includes('império') || lower.includes('cidade') || lower.includes('3.0')) {
        matches.push(line.trim());
      }
    });

    console.log(`Compact text total lines: ${lines.length}`);
    console.log(`Found ${matches.length} matching lines in compacted markdown:`);
    const unique = Array.from(new Set(matches));
    console.log(`Unique lines count: ${unique.length}`);
    unique.forEach((m, idx) => {
      console.log(`[${idx+1}] ${m}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();


