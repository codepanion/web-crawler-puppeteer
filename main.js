const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const port = 3000;

app.get("/crawl", async (req, res, next) => {
  const website = req.query.website;

  if (!website) {
    const err = new Error("Required query website missing");
    err.status = 400;
    next(err);
  }

  try {
    const browser = await puppeteer.launch();

    const registry = {};
    let queue = [website];

    while (queue.length > 0) {
      const url = queue[queue.length - 1];
      console.log("current url", url);
      const page = await browser.newPage();
      await page.goto(url);
      registry[url] = await page.$eval("*", (el) => el.innerText);
      queue.pop();
      console.log("queue length", queue);

      const hrefs = await page.$$eval("a", (anchorEls) =>
        anchorEls.map((a) => a.href)
      );

      const filteredHrefs = hrefs.filter(
        (href) => href.startsWith(website) && registry[href] === undefined
      );
      const uniqueHrefs = [...new Set(filteredHrefs)];
      queue.push(...uniqueHrefs);
      queue = [...new Set(queue)];

      await page.close();
    }

    browser.close();

    return res.status(200).send(registry);
  } catch (e) {
    console.log(e);
    res.status(500).send("Something broke");
  }
});

app.listen(port, () => {
  console.log(`app is running on port: ${port}`);
});
