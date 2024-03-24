import * as puppeteer from "puppeteer";

describe("Library usage test", () => {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it("should have the correct page title", async () => {
    await page.goto("https://google.com");
    const title = await page.title();
    expect(title).toBe("Google");
  });
});

describe("Puppeteer page scroll tests", () => {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;

  const tests = [
    { scrollAmount: 200, description: "Scroll by 200 pixels" },
    { scrollAmount: 500, description: "Scroll by 500 pixels" },
    { scrollAmount: 1000, description: "Scroll by 1000 pixels" },
  ];
  afterAll(async () => {
    await browser.close();
  });

  tests.forEach((test, index) => {
    it(`${test.description} - Test ${index + 1}/${tests.length}`, async () => {
      browser = await puppeteer.launch({ headless: true });
      page = await browser.newPage();

      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(
        "https://sr.wikipedia.org/wiki/%D0%90%D0%B1%D0%B0%D0%B4%D0%BE%D0%BD"
      );
      // Get the initial scroll position
      const initialScrollPosition = await page.evaluate(() => {
        return window.scrollY;
      });

      // Scroll the page by the current amount
      await page.evaluate((scrollAmount) => {
        window.scrollBy(0, scrollAmount);
      }, test.scrollAmount);

      await page.evaluate(() => {
        // Wait for a brief moment for the scroll to take effect (awaitFor - not working _/\_/\_ )
        return new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      });

      // Get the new scroll position after scrolling
      const newScrollPosition = await page.evaluate(() => {
        return window.scrollY;
      });

      // Assert that the new scroll position is greater than the initial position
      expect(newScrollPosition).toBeGreaterThan(initialScrollPosition);
    });
  });
});
