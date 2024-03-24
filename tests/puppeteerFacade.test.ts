import { HPuppeteerFacade, Scenario } from "../src/puppeteer";

describe("PuppeteerFacade Scenario tests", () => {
  let puppeteerFacade: HPuppeteerFacade<any>;

  const scenarios: {
    name: string;
    scenarios: Array<Scenario>;
    want: { length: number; values: { [key: string]: any } };
  }[] = [
    {
      name: "Test Case 1",
      scenarios: [
        {
          name: "Step 1",
          action: async (page: any, accumulator: any) => {
            accumulator.test1 = "Step 1 Completed";
          },
        },
        {
          name: "Step 2",
          action: async (page: any, accumulator: any) => {
            accumulator.test2 = "Step 2 Completed";
          },
        },
      ],
      want: {
        length: 2,
        values: {
          test1: "Step 1 Completed",
          test2: "Step 2 Completed",
        },
      },
    },
    {
      name: "Test Case 2",
      scenarios: [
        {
          name: "Step 3",
          action: async (page: any, accumulator: any) => {
            accumulator.test3 = "Step 3 Completed";
          },
        },
      ],
      want: {
        length: 1,
        values: {
          test3: "Step 3 Completed",
        },
      },
    },
  ];

  scenarios.forEach((testCase: any) => {
    it(testCase.name, async () => {
      const accumulator = {};
      puppeteerFacade = new HPuppeteerFacade(accumulator);
      await puppeteerFacade.init({ headless: true });
      const result = await puppeteerFacade.executeScenarios(testCase.scenarios);

      // Check accumulator values
      for (const key in testCase.want.values) {
        expect(result[key]).toBe(testCase.want.values[key]);
      }
      await puppeteerFacade.close();
    });
  });
});
