import * as fs from 'fs';
import { Readable, Transform, Writable } from 'stream';
import { pipeline } from 'stream/promises';

// Утилита: безопасный split строки на CSV-поля (без поддержки кавычек)
function parseCsvLine(line: string): string[] {
  return line
    .split(',')
    .map(field => field.trim());
}

// Transform: читает строки CSV, парсит в объекты JSON
class CsvToJsonTransform extends Transform {
  private headers: string[] | null = null;

  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null, data?: any) => void): void {
    const line = chunk.toString('utf8').trim();
    if (!line) {
      callback();
      return;
    }

    const values = parseCsvLine(line);

    if (!this.headers) {
      // Первая строка — заголовки
      this.headers = values;
      callback();
      return;
    }

    // Создаём объект { header: value }
    const row: Record<string, string> = {};
    this.headers.forEach((header, i) => {
      row[header] = values[i] ?? '';
    });

    callback(null, row);
  }
}

// Transform: объект → JSON-строка (NDJSON)
const objectToJsonLine = new Transform({
  objectMode: true,
  transform(obj: Record<string, any>, encoding, callback) {
    callback(null, JSON.stringify(obj) + '\n');
  }
});

// Writable: запись в файл
const createWriteStream = (path: string): Writable => {
  return fs.createWriteStream(path);
};

// Основная функция
export async function processCsvToJsonPure(inputPath: string, outputPath: string): Promise<void> {
  const readStream = fs.createReadStream(inputPath, { encoding: 'utf8' })
    .pipe(new Transform({
      transform(chunk, _, callback) {
        // Разбиваем входной поток на строки
        const lines = chunk.toString().split(/\r?\n/);
        for (const line of lines) {
          if (line.trim() !== '') {
            callback(null, line + '\n');
          }
        }
      }
    }));

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

const input = process.argv[2];
const output = process.argv[3];

if (!input || !output) {
  console.error('Использование: ts-node csvToJsonStreamPure.ts <input.csv> <output.json>');
  process.exit(1);
}

processCsvToJsonPure(input, output).catch(console.error);