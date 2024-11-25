const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const SSH = require('simple-ssh');
const fs = require('fs');
const _ = require('lodash');
const filePath = new Date().getTime() + '.txt';
// Read the file content
const data = fs.readFileSync('nodepay_accounts.txt', 'utf-8');
// Split content by newline to get lines
const accounts = data.split(/\r?\n/); // Handles both \n and \r\n

let ssh_user = 'root';
let ssh_pass = 'anhTuan@123AA';

const rejectResourceTypes = ["image", "font"];
const totalIps = ["159.54.147.240","140.84.171.36","159.54.139.64","140.84.167.76","159.54.130.134","159.54.152.114","89.168.60.234","141.145.216.179","89.168.34.58","158.178.211.250","89.168.48.23","158.178.205.216","140.84.163.128","159.54.153.64","140.84.175.142","159.54.131.110","140.84.169.234","159.54.154.195","158.178.215.119","158.178.192.89","158.178.196.93","89.168.34.73","89.168.37.5","141.145.212.243","89.168.58.17","158.178.199.101","89.168.54.29","89.168.43.142","158.178.206.241","158.178.215.231","129.151.246.34","84.235.233.91","129.151.225.49","129.151.233.13","84.235.228.120","84.235.238.213","84.235.230.157","84.235.237.158","79.72.25.237","129.151.254.201","129.151.249.217","144.24.204.3","129.151.250.131","144.24.204.23","144.24.201.210","79.72.27.67","79.72.27.157","79.72.29.136","168.138.95.234","168.138.64.134","155.248.230.113","151.145.42.150","168.138.73.76","151.145.32.220","40.233.68.68","40.233.78.87","40.233.66.188","155.248.216.249","40.233.77.66","40.233.64.209","192.18.155.232","155.248.217.177","40.233.77.104","192.18.152.71","40.233.78.121","40.233.86.193","139.177.96.14","40.233.24.244","40.233.3.138","139.177.100.174","40.233.27.247","40.233.4.211","89.168.55.39","89.168.42.83","158.178.199.110","158.178.194.127","89.168.36.74","141.145.218.112","140.84.189.168","159.54.134.157","159.54.146.54","140.84.174.176","140.84.180.29","159.54.151.47","159.54.142.129","159.54.146.89","159.54.158.118","140.84.189.70","140.84.160.133","140.84.173.89"];

function isValidIPv4(ip) {
	const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
	return ipv4Regex.test(ip);
}

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
	
	const email = data.split('|')[0];
    const type = data.split('|')[1];
    const password = data.split('|')[2];
	
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
	} catch (e) {
		await browser.close();
		throw e;
	}
	
	await browser.close();
	
	console.log(email, iplist, token);
	await actionRunScripts(iplist, token, type);
	
	
}

(async () => {
	const listfailed = [];
	const chunks = _.chunk(totalIps, 3);
	let j = 0;
	for (let i of accounts) {
	  const ips = chunks[j];
	  if (!ips || ips.length < 3){
		  console.log('Failed: ', ips);
		  continue;
	  }
       try {
		   await check(i, ips);
	   } catch (e) {
		   listfailed.push({acc: i, ips: ips});
		   console.log(e);
	   }
	   ++j;
    }
	console.log('List Failed: ', listfailed)
})();