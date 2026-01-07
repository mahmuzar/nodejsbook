import * as fs from 'fs';
import { Transform, Writable } from 'stream';
import { pipeline } from 'stream/promises';

// Утилита: парсит строку CSV (без кавычек)
function parseCsvLine(line: string): string[] {
  return line.split(',').map(s => s.trim());
}

// Transform: CSV (строки) → объекты JSON
class CsvToJsonTransform extends Transform {
  private headers: string[] | null = null;

  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk: Buffer, encoding: string, callback: (error?: Error | null, data?: any) => void): void {
    const lines = chunk.toString('utf8').split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const values = parseCsvLine(trimmed);

      if (!this.headers) {
        this.headers = values;
        continue; // пропускаем строку заголовков
      }

      const obj: Record<string, string> = {};
      this.headers.forEach((header, i) => {
        obj[header] = values[i] ?? '';
      });

      // ⚠️ НЕ вызываем callback здесь! Используем push()
      this.push(obj);
    }

    // ✅ Вызываем callback ОДИН раз — после обработки всего chunk
    callback();
  }
}

// Transform: объект → NDJSON-строка
const objectToJsonLine = new Transform({
  objectMode: true,
  transform(obj: Record<string, any>, _, callback) {
    callback(null, JSON.stringify(obj) + '\n');
  }
});

// Writable: запись в файл
const createWriteStream = (path: string): Writable => fs.createWriteStream(path);

// Основная функция
export async function processCsvToJsonPure(inputPath: string, outputPath: string): Promise<void> {
  const readStream = fs.createReadStream(inputPath);

  try {
    await pipeline(
      readStream,
      new CsvToJsonTransform(),
      objectToJsonLine,
      createWriteStream(outputPath)
    );
    console.log(`✅ Готово: ${outputPath}`);
  } catch (err) {
    console.error('❌ Ошибка:', err);
    throw err;
  }
}

// --- CLI ---
if (require.main === module) {
  const input = process.argv[2];
  const output = process.argv[3];

  if (!input || !output) {
    console.error('Использование: npx ts-node -T csvToJsonStreamPure.ts <input.csv> <output.json>');
    process.exit(1);
  }

  processCsvToJsonPure(input, output).catch(process.exit);
}