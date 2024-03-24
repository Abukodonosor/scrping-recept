import { AccumulatorObject, scrapingSteps } from "./scenarios";
import { writeJSONToFile } from "./src/helpers";
import { AccumulatorObj, HPuppeteerFacade } from "./src/puppeteer";

(async () => {
  let res;
  const facade = new HPuppeteerFacade(AccumulatorObject);

  try {
    await facade.init();
    res = await facade.executeScenarios(scrapingSteps);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await facade.close();
    writeJSONToFile(res, "./item-results.json");
  }
})();
