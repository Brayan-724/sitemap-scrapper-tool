import { chromium } from "playwright";
import { Site } from "./Site";

interface SpecialValues {
  isExternal: boolean;
  parents: string[];
  childs: string[];
}

interface WithSpecialValues {
  path: string;
  value: SpecialValues;
}

function mapWithSpecialValues(site: Site): WithSpecialValues[] {
  return Array.from(site.paths.entries()).flatMap(([path, value]) => {
    return {
      path,
      value: {
        isExternal: value.isExternal,
        parents: Array.from(value.parents),
        childs: Array.from(value.childs),
      },
    };
  });
}

interface ReducedSpecialValues {
  [key: string]: SpecialValues;
}

function reduceSpecialValues(
  mapped: WithSpecialValues[]
): ReducedSpecialValues {
  return mapped.reduce<{
    [key: string]: { isExternal: boolean; parents: string[]; childs: string[] };
  }>((obj, { path, value }) => {
    return {
      ...obj,
      [path]: value,
    };
  }, {});
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const site = new Site(browser, "https://ldcmurrietasec6.wixsite.com/website", {
    dataPath: "data",
  });

  await site.run();

  const mappedData = mapWithSpecialValues(site);
  const data = reduceSpecialValues(mappedData);
  const toLogData = reduceSpecialValues(
    mappedData.filter((d) => !d.value.isExternal)
  );

  console.log(toLogData);

  site.siteSaver.writeJson("data.json", data);

  await browser.close();
}

main();
