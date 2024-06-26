import {
  AccumulatorObj,
  ProductSpecification,
  Scenario,
  ShortSpecification,
} from "./src/puppeteer";
import { getUrlsWithClass, getTextWithClass, cleanString } from "./src/helpers";

export const AccumulatorObject: AccumulatorObj = {
  CONFIG: {
    SITE_URL: "https://www.etsy.com/",
    MAX_CATEGORY: 1,
    MAX_ITEMS_PER_PAGE: 10,
    ADD_CARD_PRODUCT_URL:
      "https://www.etsy.com/listing/594957748/stunning-small-gunmetal-green-ceramic?ref=cart",
  },
  // Dynamic contextual data
  TEMP: {
    categoriesPageLinks:
      [] /** Collected category urls from main page, so the next extraction is possible */,
    category:
      {} /** There is also map of all Categories which includes short item information */,
  },
  // WANT context attribute for final items result
  WANT: [],
};

/**
 *
 * Inspiration was to make iterator which will loop trough the scenarios.
 * Those scenarios describe our usage of the scraper itself. (we get flexible)
 *
 * We should treat it like story, which is splitted in logical scenarios.
 * If you want to join writing the story, just add the new scenario :)
 *
 *
 *
 */

export const scrapingSteps: Scenario[] = [
  {
    name: "1. Open Etsy shop",
    action: async (page, accumulator) => {
      await page.goto(accumulator.CONFIG.SITE_URL);
    },
  },
  {
    name: "2. Collect all category groups on page",
    action: async (page, accumulator) => {
      // Idea behind this scenario is to collect all category urls
      // On the main page, collect all urls of category cards
      accumulator.TEMP.categoriesPageLinks = await getUrlsWithClass(
        page,
        ".wt-card__action-link"
      );
    },
  },
  {
    name: "3. On Category pages collect 10 items with attributes: [name, prices, url]",
    action: async (page, accumulator) => {
      const { categoriesPageLinks } = accumulator.TEMP;
      let listItems: ShortSpecification[] = [];
      // Visit every category page and extract the items for it
      for (const url of categoriesPageLinks.splice(
        0,
        accumulator.CONFIG.MAX_CATEGORY
      )) {
        await page.goto(url);

        const pageCategoryName = (
          await getTextWithClass(page, ".wt-text-heading")
        )[0];

        // Select card containers which contains data about products(items) and limit the output
        // Parent selector reference
        const cardElements = (
          await page.$$(
            ".js-merch-stash-check-listing.v2-listing-card.wt-mr-xs-0.search-listing-card--desktop.search-listing-card--desktop.listing-card-experimental-style.appears-ready"
          )
        ).slice(0, accumulator.CONFIG.MAX_ITEMS_PER_PAGE);

        for (const cardElement of cardElements) {
          // Select price element container
          const priceElement = await cardElement.$(
            ".n-listing-card__price.wt-display-flex-xs.wt-align-items-center.wt-width-full.wt-flex-wrap.wt-width-full.wt-text-title-01.lc-price"
          );
          if (priceElement) {
            const childElements = await priceElement.$$("p");
            // Extract information
            listItems.push({
              regularPrice: cleanString(
                (await childElements[0]?.evaluate(
                  (el) => el.textContent?.trim() || ""
                )) || "n/a"
              ),
              oldPrice: cleanString(
                (await childElements[1]?.evaluate(
                  (el) => el.textContent?.trim() || ""
                )) || "n/a"
              ),
              name:
                (await cardElement?.$eval(
                  ".wt-text-caption.v2-listing-card__title.wt-text-truncate",
                  (el) => el.textContent?.trim() || ""
                )) || "n/a",
              url:
                (await cardElement?.evaluate((el) => {
                  const anchor = el.querySelector(
                    "a.listing-link.wt-display-inline-block"
                  ) as HTMLAnchorElement;
                  return anchor ? anchor.href : "n/a";
                })) || "n/a",
            });
          }
        }
        accumulator.TEMP.category[pageCategoryName] = listItems;
      }
    },
  },
  {
    name: "4. Collect product item details  [name, prices, url, picture, description, availableSizes]",
    action: async (page, accumulator) => {
      let detailProductResult: ProductSpecification[] = [];
      const { category } = accumulator.TEMP;

      // Extract data based on keys from product category
      const productItems = Object.keys(accumulator.TEMP.category)
        .filter((el) => category[el])
        .map((el) => category[el])[0];

      for (const product of productItems) {
        await page.goto(product.url);

        // Parent selector reference
        const cardElement = (
          await page.$$(
            ".wt-pt-xs-5.listing-page-content-container-wider.wt-horizontal-center"
          )
        )[0];

        detailProductResult.push({
          ...product,
          picture:
            (await cardElement?.evaluate((el) => {
              const item: any = el.querySelector(
                ".wt-max-width-full.wt-horizontal-center.wt-vertical-center.carousel-image.wt-rounded"
              );
              return item ? item.src : "n/a";
            })) || "n/a",
          description:
            (await cardElement?.$eval(
              ".wt-text-body-01.wt-line-height-tight.wt-break-word.wt-mt-xs-1",
              (el) => el.textContent?.trim() || ""
            )) || "n/a",
          availableSizes:
            (await cardElement?.evaluate(() => {
              const selectElement = document.querySelector(
                "#variation-selector-1"
              );
              const isSize = document.querySelector(
                ".wt-display-flex-xs.wt-justify-content-space-between.wt-align-items-baseline"
              );
              // Not sure if i made it correctly.
              // Pattern is here, we can easily adjust.
              if (!selectElement || !isSize) return "n/a";

              const options = selectElement.querySelectorAll("option");
              const optionValues = Array.from(options).map(
                (option) => option.textContent?.trim() || ""
              );
              return optionValues.toString();
            })) || "n/a",
        });
        accumulator.WANT = detailProductResult;
      }
    },
  },
  {
    name: "5. Simulate Adding Products to Cart ",
    action: async (page, accumulator) => {
      // We could use random URL, or hardcoded like this from config for now.
      const { ADD_CARD_PRODUCT_URL } = accumulator.CONFIG;
      await page.goto(ADD_CARD_PRODUCT_URL);

      // Add to card action
      await page.click(".wt-btn.wt-btn--filled.wt-width-full");
      await page.waitForNavigation();
    },
  },
  {
    name: "6. Checkout Simulation",
    action: async (page) => {
      await page.click(
        ".proceed-to-checkout.wt-btn.wt-btn--filled.wt-mt-xs-2.wt-width-full"
      );

      // Wait for the overlay modal to appear
      await page.waitForSelector(
        ".wt-overlay__modal.wt-overlay--animation-done"
      );
    },
  },
];
