import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch ${url}, status: ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(data); });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching official Wordle target answers...');
  const answersRaw = await fetchUrl('https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/wordle-answers-alphabetical.txt');
  const targetWords = answersRaw
    .split('\n')
    .map(w => w.trim().toUpperCase())
    .filter(w => w.length === 5);

  console.log(`Fetched ${targetWords.length} target words.`);

  console.log('Fetching official Wordle allowed guesses...');
  const allowedRaw = await fetchUrl('https://gist.githubusercontent.com/cfreshman/cdcdf777450c5b5301e439061d29694c/raw/wordle-allowed-guesses.txt');
  const allowedGuesses = allowedRaw
    .split('\n')
    .map(w => w.trim().toUpperCase())
    .filter(w => w.length === 5);

  console.log(`Fetched ${allowedGuesses.length} allowed guesses.`);

  // Combine target words + allowed guesses
  const allValidSet = new Set([...targetWords, ...allowedGuesses]);
  const allValidWords = Array.from(allValidSet).sort();

  console.log(`Total valid 5-letter words in dictionary: ${allValidWords.length}`);

  // Create wordList.ts
  const outputFilePath = path.join(__dirname, '../src/services/wordList.ts');
  const fileContent = `// Auto-generated complete official Wordle dictionaries
// Total Target Words: ${targetWords.length}
// Total Valid Guess Words: ${allValidWords.length}

export const TARGET_WORDS: string[] = ${JSON.stringify(targetWords)};

export const ALL_VALID_WORDS: string[] = ${JSON.stringify(allValidWords)};
`;

  fs.writeFileSync(outputFilePath, fileContent, 'utf-8');
  console.log(`Successfully written word lists to ${outputFilePath}`);
}

main().catch(err => {
  console.error('Error fetching words:', err);
  process.exit(1);
});
