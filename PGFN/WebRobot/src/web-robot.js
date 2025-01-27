const path = require("path");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");

class WebRobot {
  constructor(timeout = 30000) {
    this._timeout = timeout;
    this._browser = "";
    this._page = "";
    this._client = "";
  }

  /**
   * The function generates a random user agent string with a specific Chrome
   * version from a predefined list.
   * @returns a randomly generated user agent string with a Chrome version number
   * selected from the array `[124, 125, 126]`.
   */
  _changeRandomUserAgent() {
    const allowedVersions = [124, 125, 126];
    const randomAllowedVersions =
      allowedVersions[Math.floor(Math.random() * 3)];
    const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomAllowedVersions}.0.0.0 Safari/537.36`;
    return userAgent;
  }

  /**
   * The function uses Puppeteer to start a browser, set a random user agent, and
   * navigate to a specified page URL.
   * @param pageUrl - The `pageUrl` parameter is the URL of the webpage that you
   * want to navigate to using Puppeteer. It is the address of the webpage you want
   * to load and interact with programmatically.
   * @param browserOptions - Browser options are configurations that can be passed
   * to the puppeteer.launch() method when launching a new browser instance. These
   * options can include settings such as headless mode, user data directory, proxy
   * settings, and more.
   * @param [waitUntilInfo=networkidle2] - The `waitUntilInfo` parameter in the
   * `start` function specifies when the navigation should be considered complete.
   * In this case, it is set to "networkidle2", which means that navigation is
   * considered complete when there are no more than 2 network connections for at
   * least 500 ms. This
   * @returns The `start` function returns a Promise that resolves to the result of
   * the `_page.goto` method, which navigates the browser to the specified
   * `pageUrl` with the specified `waitUntilInfo` option.
   */
  async start(pageUrl, browserOptions, waitUntilInfo = "networkidle2") {
    this._browser = await puppeteer.launch(browserOptions);
    this._process = await this._browser.process();
    this._page = await this._browser.newPage();
    const userAgent = this._changeRandomUserAgent();
    this._page.setUserAgent(userAgent);
    console.log(userAgent);
    return await this._page.goto(pageUrl, { waitUntil: waitUntilInfo });
  }

  /**
   * The function takes a browser as an argument and sets the browser property to the value of the
   * argument
   * @param browser - The browser to use.
   */
  set browser(browser) {
    this._browser = browser;
  }

  /**
   * It returns the value of the private variable _browser.
   * @returns The browser property is being returned.
   */
  get browser() {
    return this._browser;
  }

  /**
   * The setter function is called when the page property is set
   * @param page - The page number to get.
   */
  set page(page) {
    this._page = page;
  }

  /**
   * It returns the value of the private variable _page.
   * @returns The page property is being returned.
   */
  get page() {
    return this._page;
  }

  /**
   * "Wait for the selector to appear on the page."
   *
   * The function is asynchronous, so it returns a promise
   * @param selector - The selector to wait for.
   * @param timeout - The maximum time to wait for in milliseconds. Defaults to 30000 (30 seconds).
   * Pass 0 to disable timeout.
   * @returns A promise that resolves when the element is found.
   */
  async waitForSelector(selector, timeout) {
    return this._page.waitForSelector(selector, { timeout: timeout });
  }

  /**
   * It waits until the element is not present in the DOM
   * @param selector - The selector of the element you want to wait for.
   * @param [timeout=10] - The time in seconds to wait for the element to vanish.
   * @returns A promise that resolves to true if the element vanishes, or throw a error if it doesn't.
   */
  async waitUntilVanish(selector, timeout = 10) {
    if (!timeout) throw new Error("ELEMENTO NAO DESAPARECEU");
    const element = await this._page.$(selector);
    if (element) {
      await this.delay(10);
      return await this.waitUntilVanish(selector, timeout - 0.01);
    }
    return true;
  }

  /**
   * The _verifyText function compares the text value of a specified element on a
   * webpage with a given text input after removing non-alphanumeric characters, and
   * returns true if they match, otherwise false.
   * @param textToInsert - The `textToInsert` parameter is the text that you want to
   * insert into a specific element on a web page.
   * @param selector - The `selector` parameter in the `_verifyText` function is used
   * to identify the element on the webpage from which the text value needs to be
   * retrieved for comparison. It is a CSS selector that targets the specific
   * element.
   * @returns If the `typedValue` is not equal to the `treatedTextToInsert`, then
   * `false` is being returned. Otherwise, `true` is being returned.
   */
  async _verifyText(textToInsert, selector) {
    let typedValue = await this._page.evaluate((selector) => {
      return document.querySelector(selector).value;
    }, selector);
    typedValue = typedValue.replace(/[^a-zA-Z0-9]/gi, "");
    const treatedTextToInsert = textToInsert.replace(/[^a-zA-Z0-9]/gi, "");
    console.log(typedValue, treatedTextToInsert);
    if (typedValue != treatedTextToInsert) return false;
    return true;
  }

  /**
   * The function `setText` asynchronously sets text in a specified selector, with an
   * option to verify the text, and a limit on retries.
   * @param text - The `text` parameter is the text that you want to set in the
   * specified selector element on the page.
   * @param selector - The `selector` parameter in the `setText` function is used to
   * specify the CSS selector of the element where the text will be set. This
   * selector is used to locate the element on the webpage before setting the text.
   * @param [verifyText=false] - The `verifyText` parameter in the `setText` function
   * is a boolean flag that determines whether the text input should be verified
   * after setting it in the specified selector. If `verifyText` is set to `true`,
   * the function will check if the text was successfully set in the element
   * specified by the
   * @param [LIMITER=3] - The `LIMITER` parameter in the `setText` function is used
   * to limit the number of retries when setting and verifying text in an element. If
   * the limit is reached and the text cannot be set and verified successfully, an
   * error will be thrown with the message "ERRO AO INSERIR E
   * @returns The `setText` function will return a boolean value `true` if the text
   * is successfully set in the specified selector element. If the `verifyText`
   * parameter is true and the text verification fails, it will recursively call
   * `setText` with a decremented `LIMITER` value until the limit is reached or the
   * text is successfully set and verified.
   */
  async setText(text, selector, verifyText = false, LIMITER = 3) {
    if (!LIMITER) throw new Error("ERRO AO INSERIR E VALIDAR TEXTO");
    await this.waitForSelector(selector, this._timeout);
    const element = await this._page.$(selector);
    await element.type(text);
    if (verifyText) {
      if (!(await this._verifyText(text, selector))) {
        await this.setValue("", selector);
        return await this.setText(text, selector, verifyText, --LIMITER);
      }
    }
    return true;
  }

  /**
   * The function `selectOptionFromDropdown` asynchronously selects an option from
   * a dropdown menu on a web page.
   * @param selector - The `selector` parameter is a string that represents the CSS
   * selector of the dropdown element from which you want to select an option.
   * @param option - The `option` parameter in the `selectOptionFromDropdown`
   * function represents the value of the option that you want to select from the
   * dropdown menu identified by the `selector`. This value should match one of the
   * available options in the dropdown list.
   */
  async selectOptionFromDropdown(selector, option) {
    await this.waitForSelector(selector, this._timeout);
    const element = await this._page.$(selector);
    await element.type(option);
  }

  /**
   * It takes a value and a selector, and then it uses the evaluate function to set the value of the
   * element that matches the selector to the value
   * @param value - The value to set the element to.
   * @param selector - The CSS selector of the element you want to set the value of.
   * @returns The value of the element.
   */
  async setValue(value, selector) {
    return this._page.evaluate(
      async (data) => {
        return (document.querySelector(data.selector).value = data.value);
      },
      { selector, value }
    );
  }

  /**
   * It waits for the selector to appear on the page, then clicks it
   * @param selector - The selector to wait for.
   * @returns The click method is being returned.
   */
  async click(selector) {
    await this.waitForSelector(selector, this._timeout);
    return this._page.click(selector);
  }

  /**
   * It waits for the element to be visible, then clicks on it
   * @param selector - The xpath selector to click on.
   * @returns The element that was clicked.
   */
  async clickByXpath(selector) {
    await this._page.waitForXPath(selector, this._timeout);
    const [element, ...rest] = await this._page.$x(selector);
    return element.click();
  }

  /**
   * It navigates to the given URL
   * @param url - The URL to navigate to. The url should include scheme, e.g. https://.
   * @returns The page.goto() method is being returned.
   */
  goto(url) {
    return this._page.goto(url);
  }

  /**
   * It returns a promise that resolves after a given number of milliseconds
   * @param milliseconds - The amount of time to wait before resolving the promise.
   * @returns A promise that will resolve after the specified time.
   */
  async delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  /**
   * It closes the browser
   * @returns The browser is being closed.
   */
  async close() {
    await this._browser.disconnect();
    return await this._browser.close();
  }

  /**
   * "Press a key on the keyboard."
   * @param key - The key to press.
   * @returns The return value is a promise that resolves when the key has been pressed.
   */
  async press(key) {
    return puppeteer.keyboard.press(this._page, key);
  }

  /**
   * It returns a promise that resolves to a boolean value
   * @param selector - The selector to find the element with.
   * @returns A boolean value.
   */
  async findElement(selector) {
    const element = await this._page.$(selector);
    if (element === null) return false;
    return element;
  }

  /**
   * The function `getElementText` asynchronously retrieves the text content of an
   * element selected by a given selector.
   * @param selector - The `selector` parameter is a string that represents a CSS
   * selector used to locate the element in the DOM (Document Object Model). It is
   * used to identify the element that you want to retrieve the text content from.
   * @returns The `getElementText` function returns the text content of the element
   * selected by the provided selector.
   */
  async getElementText(selector) {
    const element = await this._page.$(selector);
    return (await element.getProperty("textContent")).jsonValue();
  }

  /**
   * The function `getElementInnerText` asynchronously retrieves the inner text
   * content of an element selected by a given selector.
   * @param selector - The `selector` parameter in the `getElementInnerText`
   * function is a string that represents a CSS selector used to locate the HTML
   * element whose inner text content you want to retrieve asynchronously.
   * @returns The `getElementInnerText` function returns the inner text content of
   * the element selected by the provided selector.
   */
  async getElementInnerText(selector) {
    const element = await this._page.$(selector);
    return (await element.getProperty("innerText")).jsonValue();
  }

  /**
   * It waits for an element to appear on the page, and returns true if it does, or false if it doesn't
   * @param xpath - The xpath of the element you want to wait for.
   * @param counter - The number of times you want to try to find the element.
   * @returns A boolean value.
   */
  async waitForXpath(xpath, counter) {
    if (counter === 0) return false;
    const element = await this._page.$x(xpath);
    if (element[0] === undefined)
      return await this.waitForXpath(xpath, --counter);
    return true;
  }

  /**
   * It returns the value of the attribute of the element that matches the selector
   * @param selector - The CSS selector of the element you want to get the attribute of.
   * @param attribute - The attribute you want to get the value of.
   * @returns The value of the attribute of the element.
   */
  getElementAttribute(selector, attribute) {
    return this._page.evaluate(
      (selector, attribute) => {
        const element = document.querySelector(selector);
        return element.getAttribute(attribute);
      },
      selector,
      attribute
    );
  }

  /**
   * The `refresh` function asynchronously reloads the current page.
   * @returns The `refresh` function is returning a promise that resolves to the
   * result of calling the `reload` method on the `_page` object.
   */
  async refreshPage() {
    return await this._page.reload();
  }

  /**
   * This function sets the download path for the browser
   * @param pathToSave - The path to save the file to.
   */
  async setDownloadPath(pathToSave) {
    const downloadPath = path.resolve(String(`${pathToSave}`));
    this._client = await this._page.target().createCDPSession();
    await this._client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath,
    });
  }

  /**
   * It takes an array of files and returns an array of files that end with `.zip.crdownload`
   * @param files - An array of file names.
   * @returns An array of files that end in .zip.crdownload
   */
  getCrdownloadFile(files) {
    return files.filter((file) => file.match(/\.zip\.crdownload/g));
  }

  /**
   * It deletes all the files with the .crdownload extension in the specified directory
   * @param path - The path to the directory where the files are located.
   * @returns An array of crdownload files.
   */
  deleteCrdownloadFiles(path) {
    const files = fs.readdirSync(path);
    const crds = this.getCrdownloadFile(files);
    return crds.forEach((crd) => fs.unlinkSync(`${path}${crd}`));
  }

  /**
   * It waits for a file to be downloaded
   * @param pathToSave - the path where the file is being downloaded
   * @param [pattern] - the pattern to be used to filter the files in the folder.
   * @param [counter=0] - the number of times the function has been called
   * @param [limiter=10] - the number of times the function will try to verify if the download is
   * complete.
   * @returns A boolean value
   */
  async verifyDownload(pathToSave, pattern = "", counter = 0, limiter = 10) {
    if (counter > limiter) return false;
    console.log("Aguardando download...");
    let files = fs.readdirSync(pathToSave);
    if (pattern !== "") files = files.filter((file) => file.match(pattern));
    const found = this.getCrdownloadFile(files);
    console.log(files);
    console.log(found);
    await this.delay(1000 * counter);
    if (files.length === 0)
      return await this.verifyDownload(pathToSave, pattern, ++counter, limiter);
    if (found.length === 0) return true;
    return await this.verifyDownload(pathToSave, pattern, ++counter, limiter);
  }
}

module.exports = WebRobot;
