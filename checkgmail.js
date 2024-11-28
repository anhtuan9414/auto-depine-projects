const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
// Read the file content
const gmaillist = fs.readFileSync('gmail.txt', 'utf-8');
// Split content by newline to get lines
const accounts = gmaillist.split(/\r?\n/); // Handles both \n and \r\n

const filePath = 'temp_gmailValid_' + new Date().getTime() + '.txt';
const filePath2 = 'temp_gmailInvalid_' + new Date().getTime() + '.txt';

const waitForElementExists = async (page, selector, timeout = 5000) => {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch {
        return false;
    }
};

const check = async (data) => {
	 const gmail = data.split('|')[0];
	console.log('Start login: ', gmail);
	if (!gmail) {
		return;
	}
	let browser;
	
	browser = await puppeteer.launch({
    headless: false,
    targetFilter: target => !!target.url(),
	});

  let page = await browser.pages();
  page = page[0];

	
	try {
	  await page.goto('https://accounts.google.com/signin', {timeout: 5000});
  } catch {}
	await page.waitForSelector('input[type="email"]');
	  console.log('Send email', gmail);
  await page.type('input[type="email"]', gmail + '\u000d');
  await new Promise((_func) => setTimeout(_func, 10000));
  
  if (await waitForElementExists(page, "::-p-xpath(//*[text()='Couldn’t find your Google Account'])")) {
	  console.log('Couldn’t find your Google Account');
	  await browser.close();
	  return;
  }
  
  const line = data + '\n';
  if (!(await page.$('iframe[title="reCAPTCHA"]')) && await waitForElementExists(page, "input[type='password']", 30000)) {
	  try {
		  fs.appendFileSync(filePath, line);
		  console.log('Line successfully appended!');
		} catch (err) {
		  console.error('Error appending to file:', err);
		}
  } else {
		console.log('Exists captcha'); 
		try {
		  fs.appendFileSync(filePath2, line);
		  console.log('Line successfully appended!');
		} catch (err) {
		  console.error('Error appending to file:', err);
		}
		
  }
  await browser.close();
}

(async () => {
	for (let i of accounts) {
		await check(i);
	}
})();