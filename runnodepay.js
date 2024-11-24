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
const totalIps = ['140.245.61.152', '217.142.191.95', '140.245.37.145', '40.233.28.181', '129.151.241.100', '89.168.35.50', '144.24.205.227', '158.178.194.175', '129.151.252.141', '144.24.192.139', '129.151.246.83', '129.151.241.138', '158.178.199.242', '129.151.255.222', '84.235.230.133', '129.151.224.126', '40.233.26.140', '141.145.200.52', '84.235.238.247', '84.235.239.73', '40.233.27.26', '158.178.212.224', '84.235.232.15', '144.24.205.194', '40.233.2.64', '84.235.230.119', '84.235.231.162', '89.168.44.184', '40.233.26.53', '40.233.21.151', '40.233.16.105', '139.177.100.210', '129.151.239.127', '40.233.5.6', '144.24.205.154', '129.151.232.115', '40.233.18.202', '89.168.48.99', '144.24.201.250', '40.233.24.190', '144.24.193.215', '40.233.2.156', '144.24.204.61', '89.168.46.131', '141.145.210.220', '129.151.246.194', '40.233.7.198', '89.168.54.80', '129.151.249.167', '158.178.203.189', '129.151.250.185', '129.151.229.209', '89.168.48.189', '144.24.203.55', '158.178.194.211', '144.24.201.227', '84.235.239.21', '158.178.212.201', '129.151.229.66', '141.145.213.199', '129.151.242.73', '79.72.27.17', '84.235.237.15', '89.168.51.46', '89.168.61.50', '129.151.238.201', '140.84.173.157', '144.24.199.177', '89.168.58.158', '40.233.20.117', '40.233.23.19', '140.84.174.33', '84.235.230.194', '40.233.2.130', '139.177.100.32', '40.233.3.150', '84.235.228.196', '158.178.212.183', '129.151.242.43', '40.233.28.211', '158.178.207.127', '144.24.193.119', '40.233.4.43', '129.151.228.138', '84.235.232.61', '40.233.29.170', '129.151.249.152', '40.233.19.89', '40.233.7.4', '84.235.235.179', '84.235.227.193', '89.168.38.9', '40.233.20.27'];

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