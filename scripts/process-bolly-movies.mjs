import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE = 'C:\\Users\\Abhirup Mazumder\\.gemini\\antigravity-ide\\brain\\0c09a124-6c22-4500-ad33-70f5856cff89\\scratch\\Bollywood-Movie-Dataset\\IMDB-Movie-Dataset(2023-1951).csv';
const OUT_FILE = path.join(__dirname, '..', 'src', 'assets', 'bolly-movies.json');

const results = [];

fs.createReadStream(CSV_FILE)
  .pipe(csv())
  .on('data', (data) => {
    // Parse Year
    const yearMatch = data.year ? data.year.match(/\d{4}/) : null;
    const year = yearMatch ? parseInt(yearMatch[0], 10) : null;

    // We only want movies from 2000 to 2023
    if (year && year >= 2000 && year <= 2023) {
      // Split comma separated arrays and trim whitespace
      const genre = data.genre ? data.genre.split(',').map(s => s.trim()) : [];
      const cast = data.cast ? data.cast.split(',').map(s => s.trim()) : [];
      
      results.push({
        id: data.movie_id,
        name: data.movie_name.trim(),
        year: year,
        genre: genre,
        director: data.director ? data.director.trim() : 'Unknown',
        cast: cast,
        overview: data.overview ? data.overview.trim() : ''
      });
    }
  })
  .on('end', () => {
    // Ensure the assets directory exists
    const dir = path.dirname(OUT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`Processed ${results.length} movies and saved to ${OUT_FILE}`);
  });
