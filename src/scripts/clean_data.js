import pl from 'nodejs-polars';
import path from 'path';
import { cwd } from 'node:process';

const inputPath = path.join(cwd(), 'public', 'data', 'medals.csv');
const OUTPUT_PATH = path.join(cwd(), 'public', 'data', 'medals_year_total_nation.csv');
pl.Config.setTblRows(1000);

function main() {
  const medals = pl.readCSV(inputPath);
  //console.log(medals.height);

  // filter out all rows where Rank is 'Total'
  // polars uses 'col' to refer to columns and expressions
  const cleaned = medals.filter(
    pl.col("Rank").str.startsWith("Total").not()
  );

  // Identify shifted rows: Rank is not numeric AND Nation is numeric (contains Gold count)
  // This happens when Rank is missing and Nation name is in Rank column
  const isShifted = pl.col("Rank").str.contains("^\\d+$").not().and(
    pl.col("Nation").str.contains("^\\d+$")
  );

  const shifted = cleaned.filter(isShifted);
  const regular = cleaned.filter(isShifted.not());

  // Process shifted rows: Rank->Nation, Nation->Gold, etc.
  const shiftedFixed = shifted.select(
    pl.col("Rank").alias("Nation"),
    pl.col("Nation").cast(pl.Int64).alias("Gold"),
    pl.col("Gold").cast(pl.Int64).alias("Silver"),
    pl.col("Silver").cast(pl.Int64).alias("Bronze"),
    pl.col("Year").cast(pl.Int64)
  );

  // Process regular rows (including those with non-numeric Rank like '–' but correct Nation name)
  const regularFixed = regular.withColumns(
    pl.col("Gold").cast(pl.Int64),
    pl.col("Silver").cast(pl.Int64),
    pl.col("Bronze").cast(pl.Int64),
    pl.col("Year").cast(pl.Int64)
  ).drop("Rank");

  // concat regularFixed with shiftedFixed
  const cleanedUnion = pl.concat([regularFixed, shiftedFixed]);
  //console.log(cleanedUnion);

  // rename ROC to Russia, Olympic Athletes from Russia to Russia, East Germany to Germany, United Team of Germany to Germany, 
  // West Germany to Germany, United States to USA to Russia, Czechoslovakia to Czech Republic
  /*const cleanedUnionRenamed = cleanedUnion.withColumn(
    pl.col("Nation").str.replace("ROC", "Russia")
  ).withColumn(
    pl.col("Nation").str.replace("Olympic Athletes from Russia", "Russia")
  ).withColumn(
    pl.col("Nation").str.replace("East Germany", "Germany")
  ).withColumn(
    pl.col("Nation").str.replace("United Team of Germany", "Germany")
  ).withColumn(
    pl.col("Nation").str.replace("West Germany", "Germany")
  ).withColumn(
    pl.col("Nation").str.replace("United States", "USA")
  ).withColumn(
    pl.col("Nation").str.replace("Czechoslovakia", "Czech Republic")
  ).withColumn(
    pl.col("Nation").str.replace("Soviet Union", "Russia")
  ).withColumn(
    pl.col("Nation").str.replace("Unified Team", "Russia")
  );*/
  const cleanedUnionRenamed = cleanedUnion.withColumn(
    pl.col("Nation").str.replace("United States", "USA")
  );

  // filter out the nation "Mixed Team"
  const cleanedUnionRenamedNoMixed = cleanedUnionRenamed.filter(
    pl.col("Nation").str.contains("(?i)mixed team").not()
  );

  // remove extra non-alphanumeric characters from the nations names at the end of the names such as * or ‡
  const cleanedUnionRenamedNoSymbols = cleanedUnionRenamedNoMixed.withColumn(
    pl.col("Nation").str.replaceAll(/[^a-zA-Z0-9\s]/, "")
  ).filter(
    pl.col("Nation").str.lengths().gt(0)
  );
  //console.log(cleanedUnionRenamed.sort("Nation"));

  // aggregate by Nation and Year the total number of all medals
  const aggregated = cleanedUnionRenamedNoSymbols.groupBy("Nation", "Year").agg(
    pl.col("Gold").sum(),
    pl.col("Silver").sum(),
    pl.col("Bronze").sum()
  );

  // add a new column with the total number of all medals
  const aggregatedWithTotal = aggregated.withColumn(
    pl.col("Gold")
      .add(pl.col("Silver"))
      .add(pl.col("Bronze"))
      .alias("Total")
  );

  // Select only Year, Total, and Nation columns, then sort by Year ascending,
  // Total descending (using -1 multiplier to invert sort order), and Nation ascending
  const table = aggregatedWithTotal
    .select(["Year", "Total", "Nation"])
    .sort([pl.col("Year"), pl.col("Total").mul(-1), pl.col("Nation")]);

  console.log(table);
  table.writeCSV(OUTPUT_PATH);

}

main();
