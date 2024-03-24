import { Page } from "puppeteer";
import fs from "fs";

export const getUrlsWithClass = async (
  page: Page,
  className: string
): Promise<string[]> => {
  const urls = await page.evaluate((className: string) => {
    const elements = document.querySelectorAll(className);
    const urls = Array.from(elements).map((element) =>
      element.getAttribute("href")
    );
    return urls.filter((url) => url !== null && url !== "");
  }, className);

  return urls as string[];
};

export const getTextWithClass = async (
  page: Page,
  className: string
): Promise<string[]> => {
  const obj = await page.evaluate((className: string) => {
    const elements = document.querySelectorAll(className);
    const texts = Array.from(elements).map((element) => element.textContent);
    return texts.filter((url) => url !== null && url !== "");
  }, className);

  return obj as string[];
};

export const cleanString = (inputString: string) => {
  // Remove \n
  let cleanedString = inputString.replace(/\n/g, "");
  // Remove extra whitespaces
  cleanedString = cleanedString.replace(/\s+/g, " ").trim();

  return cleanedString;
};

export const writeJSONToFile = (data: any, filePath: string) => {
  const jsonData = JSON.stringify(data, null, 2); // null and 2 for pretty formatting
  fs.writeFileSync(filePath, jsonData, "utf8");
};

export const getRandomElementFromArray = <T>(array: T[]): T | null => {
  // Check if empty
  if (array.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};
