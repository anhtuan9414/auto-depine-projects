const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
// Read the file content
const data = fs.readFileSync('nodepay_accounts.txt', 'utf-8');
// Split content by newline to get lines
const accounts = data.split(/\r?\n/); // Handles both \n and \r\n

const rejectResourceTypes = ["image", "font"];

const waitForElementExists = async (page, selector, timeout = 5000) => {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch {
        return false;
    }
};

const check = async (data) => {
	let browser;
	let token;
	let res = {
		iplist: [],
		totalIp: [],
	};
	
	const email = data.split('|')[0];
    const type = data.split('|')[1];
	
	try {
		browser = await puppeteer.launch({
    headless: false,
    targetFilter: target => !!target.url(),
  });
 
  

  var page = await browser.pages();
  page = page[0];
  await page.setRequestInterception(true);
    page.on("request", (req) => {
        if (
            rejectResourceTypes.includes(req.resourceType())
        ) {
            return req.abort();
        }
        return req.continue();
    });
  console.log('Start login: ', email);
  try {
	  await page.goto('https://app.nodepay.ai/login', {timeout: 5000});
  } catch {}
	// Input credentials
	const password = 'Anhtuan@123';       // Replace with your password

	const sendLogin = async () => {
		try {
			await new Promise((_func) => setTimeout(_func, 5000));
			// Wait for the login form to load
			await page.waitForSelector('#basic_user', { timeout: 5000 });
			await page.waitForSelector('#basic_password');
			await page.type('#basic_user', email, { delay: 50 }); // Simulate typing
			await page.type('#basic_password', password, { delay: 50 });

			// Click the login button
			await page.click('button[type="submit"]');
			await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
			console.log('Login successful!');
			return true;
		}catch {
			console.log('Login failed!');
			return false;
		}
	}
	
	while (!(await sendLogin())) {
			console.log('Trying login...');
            await page.reload();
    }

	// Perform any post-login actions here
	// Example: Navigate to the dashboard
	await page.goto('https://app.nodepay.ai/dashboard', { waitUntil: 'networkidle0' });
	
	const waitTable = async () => {
		try {
			await new Promise((_func) => setTimeout(_func, 5000));
			await page.waitForSelector('#table-device-networks table', { timeout: 10000 });
			return true;
		}catch {
			console.log('Load dashboard failed');
			return false;
		}
	}
	
	while (!(await waitTable())) {
			console.log('Trying reload dashboard...');
            await page.reload();
    }
	
	
	token = await page.evaluate((key) => {
        return localStorage.getItem(key);
    }, 'np_token');
	console.log(token);
	} catch (e) {
		await browser.close();
		throw e;
	}
}

(async () => {
	const listfailed = [];
	for (let i of accounts) {
       try {
		   await check(i);
	   } catch (e) {
		   listfailed.push(i);
		   console.log(e);
	   }
    }
	console.log('List Failed: ', listfailed)
})();