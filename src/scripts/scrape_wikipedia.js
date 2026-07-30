import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import pl from 'nodejs-polars';
import path from 'path';
import { cwd } from 'node:process';

const YEARS = [
    1924, 1928, 1932, 1936, 1948, 1952, 1956, 1960, 1964, 1968, 
    1972, 1976, 1980, 1984, 1988, 1992, 1994, 1998, 2002, 2006, 
    2010, 2014, 2018, 2022, 2026
];

async function scrapeMedals(year) {
    const url = `https://en.wikipedia.org/wiki/${year}_Winter_Olympics_medal_table`;
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        const rawData = [];

        // Find the specific medal table by looking for headers
        let $table = null;
        $('table.wikitable').each((i, el) => {
            const headers = $(el).find('th').text().toLowerCase();
            if (headers.includes('gold') && headers.includes('silver') && headers.includes('bronze')) {
                $table = $(el);
                return false; // Break loop
            }
        });

        if (!$table) {
            console.warn(`Warning: No medal table found for ${year}`);
            return null;
        }

        $table.find('tr').each((i, row) => {
            const cols = $(row).find('td, th');
            // Basic validation: ensure we have enough columns and it's not a header row without data
            // Most medal tables have: Rank, Nation, Gold, Silver, Bronze, Total
            if (cols.length < 5) return;

            // Extract text and clean it
            const getCellText = (index) => {
                // Handle th used as row header (Rank) or td
                return $(cols[index]).text().trim();
            };

            // Skip rows that don't look like data (e.g. headers repeated at bottom)
            const rankText = getCellText(0);
            const nationText = $(cols[1]).text().trim();
            
            // Skip header rows where Rank is "Rank" or Nation is "NOC" or "Nation"
            if (rankText === 'Rank' || nationText === 'NOC' || nationText === 'Nation') return;
            
            if (!rankText && rankText !== '-') {
                 // Might be a total row or empty
            }

            // In some tables, Rank might be in th, or Nation might be in th.
            // Standard wikitable: Rank (td), Nation (th/td), G, S, B, T
            // Let's try to identify columns based on content if possible, or assume standard structure.
            // Standard structure is reliable for these pages.
            
            const gold = parseInt($(cols[2]).text()) || 0;
            const silver = parseInt($(cols[3]).text()) || 0;
            const bronze = parseInt($(cols[4]).text()) || 0;

            if (nationText) {
                rawData.push({
                    Rank: rankText,
                    Nation: nationText,
                    Gold: gold,
                    Silver: silver,
                    Bronze: bronze,
                    Year: year
                });
            }
        });

        if (rawData.length === 0) {
            return null;
        }

        const table = pl.DataFrame(rawData)
            .withColumn(pl.col('Gold').cast(pl.Int64))
            .withColumn(pl.col('Silver').cast(pl.Int64))
            .withColumn(pl.col('Bronze').cast(pl.Int64))
            .withColumn(pl.col('Year').cast(pl.Int64));

        return table
            .withColumn(
                pl.col('Nation')
                    .str.replaceAll('\\[.*?\\]|\\*', '')
                    .str.strip()
                    .alias('Nation')
            )
            .filter(
                pl.col('Nation')
                    .str.contains('(?i)total')
                    .not()
                    .and(pl.col('Nation').str.contains('^\\s*$').not())
            );
    } catch (e) {
        console.error(`Error ${year}: ${e.message}`);
        return null;
    }
}

async function main() {
    let tables = [];
    console.log("🏹 Aiming Polars at Wikipedia...");

    for (const year of YEARS) {
        const table = await scrapeMedals(year);
        if (table) {
            console.log(`Successfully scraped ${year}: ${table.height} rows`);
            tables.push(table);
        }
    }

    if (tables.length > 0) {
        // Concatenate all tables
        const masterTable = pl.concat(tables);

        console.log(`\nResults: ${masterTable.height} rows processed.`);
        // masterTable.print(); // Fancy console output
        
        // Export to CSV in public/data
        const outputDir = path.join(cwd(), 'public', 'data');
        if (!fs.existsSync(outputDir)){
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path.join(outputDir, 'medals.csv');
        
        masterTable.writeCSV(outputPath);
        console.log(`Data written to ${outputPath}`);
    } else {
        console.log("No data scraped.");
    }
}

main();
