import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from "puppeteer";

export interface AccumulatorObj {
  // Static configuration and data for the he scraping steps (scenarios)
  CONFIG: {
    SITE_URL: string;
    MAX_CATEGORY: number;
    MAX_ITEMS_PER_PAGE: number;
  };
  // Dynamic context of our script
  TEMP: {
    categoriesPageLinks: string[];
    category: {
      [key: string]: ShortSpecification[];
    };
    // [key: string]: any;
  };
  //** WANT attribute acts like RESULT context where we prepare data for output*/
  WANT: ProductSpecification[];
}

export interface ShortSpecification {
  name: string;
  regularPrice: string;
  oldPrice: string | any;
  url: string;
}
export interface ProductSpecification {
  picture: string;
  description: string;
  availableSizes: string;
  name: string;
  regularPrice: string;
  oldPrice: string;
  url: string;
}

// Step function type
export type ScenarioFunction = (
  page: Page,
  accumulator: AccumulatorObj
) => Promise<any>;

// Scenario object structure
export interface Scenario {
  name: string;
  action: ScenarioFunction;
}

// Accumulator object
export interface Accumulator {
  [key: string]: any;
}

export class HPuppeteerFacade<T extends AccumulatorObj> {
  private browser!: Browser;
  private accumulator: T;

  constructor(accumulator: T) {
    this.accumulator = accumulator;
  }
  async init(config?: PuppeteerLaunchOptions | undefined) {
    this.browser = await puppeteer.launch({
      headless: false, // Run browser in headless mode or not (true for headless)
      slowMo: 50, // Slow down Puppeteer operations by 50ms (useful for debugging)
      devtools: false, // Whether to auto-open DevTools panel
      ignoreHTTPSErrors: true, // Ignore HTTPS-related errors
      args: [
        "--no-sandbox", // Disable sandbox mode
        "--disable-setuid-sandbox", // Disable setuid sandbox (Linux only)
        "--disable-web-security", // Disable web security (allows cross-origin requests)
        "--disable-infobars", // Disable the info bar that shows up on top of the page
        "--window-size=1280,800", // Set initial browser window size
      ],
      ...config,
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async executeScenarios(scenarios: Scenario[]) {
    try {
      const page = await this.browser.newPage();
      for (const [_, scenario] of scenarios.entries()) {
        console.info(`Executing scenario: ${scenario.name}`);
        await scenario.action(page, this.accumulator);
      }
    } catch (error) {
      console.error("Error executing scenario:", error);
    }

    return this.accumulator;
  }
}
