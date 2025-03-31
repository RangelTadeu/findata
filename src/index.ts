import path from "path";
import fs from "fs";
import { processCsv } from "./csvReader";
import Decimal from "decimal.js";
import { addMonths, isAfter, parseISO } from "date-fns";

const processor = (
  line: { id: string; scale: string; [key: string]: string },
  acc: { id: string; scale: string; [key: string]: string }[]
) => {
  acc.push(line);
};

const processorMean = (
  line: { id: string; scale: string; [key: string]: string },
  acc: { count: number; sum: Decimal }
) => {
  if (line.id !== "MO_BS_AR") {
    return acc;
  }

  let sum = new Decimal(0);
  let count = 0;

  Object.keys(line).forEach((key) => {
    if (key !== "id" && key !== "scale") {
      const value = new Decimal(line[key]);

      sum = sum.plus(value);
      count++;
    }
  });

  acc.sum = acc.sum.plus(sum);
  acc.count += count;
  return acc;
};

const calculateMean = (data: {
  id: string;
  scale: string;
  [key: string]: string;
}) => {
  let sum = new Decimal(0);
  let count = 0;

  Object.keys(data).forEach((key) => {
    if (key !== "id" && key !== "scale") {
      const value = new Decimal(data[key]);

      sum = sum.plus(value);
      count++;
    }
  });

  const mean = sum.dividedBy(count);
  return mean.times(data.scale).toString();
};

const findPeriod = (
  data: {
    id: string;
    scale: string;
    [key: string]: string;
  },
  date: Date
) => {
  let res = new Decimal(0);

  Object.keys(data).forEach((key) => {
    if (key !== "id" && key !== "scale") {
      const startPeriod = parseISO(key);
      // maybe is better end in the last day of the month
      const endPeriod = addMonths(startPeriod, 3);

      if (isAfter(date, startPeriod) && isAfter(endPeriod, date)) {
        res = new Decimal(data[key]);
      }
    }
  });

  return res.times(data.scale).toString();
};

(async () => {
  // question 1

  const res = await processCsv({
    filePath: path.resolve(__dirname, "./data/downloads/MNZIRS0108.csv"),
    processor: processor,
    initValue: [] as { id: string; scale: string; [key: string]: string }[],
  });

  // TODO use decimal and multiply by scale
  const recMO_BS_INV = res.find((r) => r.id === "MO_BS_INV");
  console.log("value for MO_BS_INV 2014-10-01", recMO_BS_INV!["2014-10-01"]);

  //question 2

  const res21 = await processCsv({
    filePath: path.resolve(__dirname, "./data/downloads/Y1HZ7B0146.csv"),
    processor: processor,
    initValue: [] as { id: string; scale: string; [key: string]: string }[],
  });

  const recMO_BS_AP = res21.find((r) => r.id === "MO_BS_AP");

  console.log("Mean for MO_BS_AP", calculateMean(recMO_BS_AP!));

  //question 3

  const res3 = await processCsv({
    filePath: path.resolve(__dirname, "./data/downloads/U07N2S0124.csv"),
    processor: processor,
    initValue: [] as { id: string; scale: string; [key: string]: string }[],
  });

  const resMO_BS_Intangibles = res3.find((r) => r.id === "MO_BS_Intangibles");

  console.log(
    "value for period 2015-09-30",
    findPeriod(resMO_BS_Intangibles!, new Date("2015-09-30"))
  );

  // read all files:

  const files = fs
    .readdirSync(path.resolve(__dirname, "./data/downloads"))
    .filter((file) => file.endsWith(".csv"));

  const allData = [];

  for (const file of files) {
    const res = await processCsv({
      filePath: path.resolve(__dirname, "./data/downloads", file),
      processor: processorMean,
      initValue: {
        count: 0,
        sum: new Decimal(0),
      },
    });

    allData.push({ filePath: file, ...res });
  }

  // calculate mean for all files
})();
