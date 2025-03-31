import axios from "axios";
import fs from "fs";
import path from "path";

// TODO: unzip files and delete .zip

const urls = [
  "https://as-findata-tech-challenge.s3.us-west-2.amazonaws.com/company-data/MNZIRS0108.zip",
  "https://as-findata-tech-challenge.s3.us-west-2.amazonaws.com/company-data/Y1HZ7B0146.zip",
  "https://as-findata-tech-challenge.s3.us-west-2.amazonaws.com/company-data/U07N2S0124.zip",
  "https://as-findata-tech-challenge.s3.us-west-2.amazonaws.com/company-data/Y8S4N80139.zip",
  "https://as-findata-tech-challenge.s3.us-west-2.amazonaws.com/company-data/CT4OAR0154.zip",
];

export async function downloadFile(url: string, outputPath: string) {
  const response = await axios({ url, responseType: "stream" });
  response.data.pipe(fs.createWriteStream(outputPath));

  return new Promise((resolve, reject) => {
    response.data.on("end", resolve);
    response.data.on("error", reject);
  });
}

(async () => {
  const downloadPromises = urls.map((url) => {
    const fileName = url.split("/").pop();
    const outputPath = path.resolve(__dirname, `./data/downloads/${fileName}`);
    return downloadFile(url, outputPath);
  });

  await Promise.all(downloadPromises);
  console.log("All files downloaded successfully.");
})();
