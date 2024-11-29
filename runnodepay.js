const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const SSH = require('simple-ssh');
const fs = require('fs');
const _ = require('lodash');
// Read the file content
const data = fs.readFileSync('nodepay_accounts.txt', 'utf-8');
// Split content by newline to get lines
const accounts = data.split(/\r?\n/); // Handles both \n and \r\n

let ssh_user = 'root';
let ssh_pass = 'anhTuan@123AA';
let secUntilRestart = 60;

const rejectResourceTypes = ["image", "font"];
const totalIps = [];

function isValidIPv4(ip) {
	const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
	return ipv4Regex.test(ip);
}

function formatDateToDDMMYYYY(date) {
    const day = String(date.getDate()).padStart(2, '0'); // Get day and pad to 2 digits
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month (0-indexed, so +1) and pad to 2 digits
    const year = date.getFullYear(); // Get full year
    return `${day}-${month}-${year}`; // Format as dd-mm-yyyy
}

const filePath = 'temp_runNodepay_'  + formatDateToDDMMYYYY(new Date()) + '_' + new Date().getTime() + '.txt';


const actionRunScripts = async (ips, token, type) => {
  const ipErrors = [];
  const runHandler = async (ip) => {
    let countRetry = 0;
    const run = async (ip) => {
      try {
		  let ssh;
		if (type == "0") {
			ssh = new SSH({
			  host: ip,
			  user: ssh_user,
			  pass: ssh_pass,
			});
		} else {
			ssh = new SSH({
			  host: ip,
			  user: 'ubuntu',
			  key: require('fs').readFileSync('./id_rsa')
			});
		}
        
        await new Promise((resolve, reject) => {
          console.log(`Start run scripts [${ip}]`);
          try {
            ssh.exec(`
				docker rm -f $(docker ps -aqf "ancestor=kellphy/nodepay:latest")
				docker pull kellphy/nodepay:latest
				docker run -d --memory=300mb --restart unless-stopped --name nodepay -e NP_COOKIE="${token}" kellphy/nodepay:latest
			  `, {
              out: function (stdout) {
                console.log(stdout);
              },
              exit: resolve,
            }).start({
              fail: (e) => {
                console.error(`ssh error ip: [${ip}]: `, e);
                reject(e);
              },
            });
          } catch (e) {
            reject(e);
          }
        });
      } catch (e) {
        console.error(`Error ip: [${ip}]: `, e.message);
        if (countRetry < 2) {
          console.error(`Retry ip: [${ip}]`);
          ++countRetry;
          await new Promise((resolve) => {
            setTimeout(resolve, 5000);
          });
          await run(ip);
        } else {
          ipErrors.push({
            ip: ip,
            message: e.message,
          });
        }
      }
    }
    await run(ip);
  };

  for (let l of ips) {
	  if(isValidIPv4(l)) {
		   await runHandler(l);
	  } else {
		  ipErrors.push({
            ip: l,
            message: 'NOT IPv4',
          });
	  }
  }

  if (ipErrors.length > 0) {
    console.log('IP Error: ', ipErrors);
  }
  return ipErrors;
};

const waitForElementExists = async (page, selector, timeout = 5000) => {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch {
        return false;
    }
};

const check = async (data, iplist) => {
	let browser;
	let token;
	
	
	try {
		const email = data.split('|')[0];
		const type = data.split('|')[1];
		const password = data.split('|')[2];
		
		try {
			browser = await puppeteer.launch({
		headless: false,
		targetFilter: target => !!target.url(),
		args: ['--window-size=1024,768']
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
		
		const waitTable = async () => {
			try {
				await page.goto('https://app.nodepay.ai/dashboard', { waitUntil: 'networkidle0' });
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
		} catch (e) {
			await browser.close();
			throw e;
		}
		
		const line = email + '|' + token + '\n';
		try {
		  fs.appendFileSync(filePath, line);
		  console.log('Line successfully appended!');
		} catch (err) {
		  console.error('Error appending to file:', err);
		}
		
		await browser.close();
		
		console.log(email, iplist, token);
		const ipErrors = await actionRunScripts(iplist, token, type);
		return ipErrors;
	} catch (err) {
		console.error(`Error: ${err.message}`);
        if (browser) await browser.close();
        console.log(`Restarting in ${secUntilRestart} seconds...`);
		await new Promise((_func) => setTimeout(_func, secUntilRestart * 1000));
		return await check(data, iplist);
	}
}

(async () => {
	const listfailed = [];
	const listIpFailed = [];
	const chunks = _.chunk(totalIps, 3);
	let j = 0;
	for (let i of accounts) {
	  const ips = chunks[j];
	  if (!ips || ips.length < 3){
		  console.log('Failed: ', ips);
		  continue;
	  }
       try {
		  const ipErrors = await check(i, ips);
		  if (ipErrors.length > 0) {
			   listIpFailed.push({
				   acc: i,
				   ipErrors: ipErrors.forEach(it => it.ip)
			  });
		   }
	   } catch (e) {
		   listfailed.push({acc: i, ips: ips});
		   console.log(e);
	   }
	   ++j;
    }
	console.log('List Failed: ', listfailed)
	console.log('List ip Failed: ', listIpFailed)
})();