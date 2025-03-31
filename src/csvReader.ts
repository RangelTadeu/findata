import { createReadStream } from "fs";
import { createInterface } from "readline";

/**
 * Processes a CSV file line by line, applying a processor function to each record.
 *
 * @template R - The type of each record in the CSV file.
 * @template Acc - The type of the accumulator object.
 *
 * @param params - An object containing the following properties:
 *   - filePath: The path to the CSV file to be processed.
 *   - processor: A function that processes each record in the CSV file. It receives the current record (`line`) and the accumulator (`acc`) as arguments.
 *   - initValue: An optional initial value for the accumulator. Defaults to `null`.
 *   - withHeaders: A boolean indicating whether the CSV file includes a header row. Defaults to `true`. If `false`, the `headers` parameter must be provided.
 *   - headers: An optional array of strings representing the headers to use if `withHeaders` is `false`. Ignored if `withHeaders` is `true`.
 *   - delimiter: An optional string representing the delimiter used in the CSV file. Defaults to `","`.
 *
 * @returns A promise that resolves to the accumulator object (`Acc`) after processing all lines in the CSV file.
 *
 * @throws {Error} If `withHeaders` is `false` and no `headers` are provided or if the `headers` array is empty.
 */
export const processCsv = async <R, Acc>(params: {
  filePath: string;
  processor: (line: R, acc: Acc) => void;
  initValue?: Acc | null;
  withHeaders?: boolean;
  headers?: string[];
  delimiter?: string;
}): Promise<Acc> => {
  const {
    filePath,
    processor,
    initValue = null,
    withHeaders = true,
    headers,
    delimiter = ",",
  } = params;

  if (!withHeaders && (!headers || headers.length === 0)) {
    throw new Error("Headers must be provided if withHeaders is false.");
  }

  let lineIndex = 0;
  const csvRegex = new RegExp(`${delimiter}(?=(?:[^"]*"[^"]*")*[^"]*$)`);

  const readStream = createReadStream(filePath);
  const readLine = createInterface({ input: readStream, crlfDelay: Infinity });
  const acc = (initValue ?? {}) as Acc;

  const resolvedHeaders = headers ?? [];

  for await (const line of readLine) {
    lineIndex++;

    if (withHeaders && resolvedHeaders.length === 0) {
      resolvedHeaders.push(...line.split(delimiter));
      continue;
    }

    const values = line
      .split(csvRegex)
      .map((value) => value.trim().replace(/^"|"$/g, ""));

    const isEmptyLine = values.every((value) => value.trim() === "");
    if (isEmptyLine) continue;

    const record = resolvedHeaders.reduce((obj, header, index) => {
      obj[header] = values[index];
      return obj;
    }, {} as Record<string, string>);

    try {
      processor(record as R, acc);
    } catch (error) {
      console.error(`Error processing ${filePath} line ${lineIndex}`);
      throw error;
    }
  }

  return acc;
};
