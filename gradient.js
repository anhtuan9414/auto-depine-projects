const timers = require("node:timers/promises");
const { getGraStatus, loginGradient, reloginGradient, sendExtension } = require("./lib");
const axios = require("axios").default;
const { HttpsProxyAgent } = require("https-proxy-agent");
const {
    getUsers,
    updateConnectionStatus,
    saveScreenshot,
} = require("./connection/pgConnection");
const lodash = require("lodash");
async function main() {
    // extract user
    // let [user, offset] = process.env.GRASS_USER.split("-");
    // let users = await getUsers(user + "@gmail.com", offset);
    let user = { id: "Depin", user: process.env.USER, pass: process.env.PASS };
    console.log("🚀 ~ Start Script ~");

    let localBrowser;
    let localPage;

    const startExtension = async function (user) {
        let { browser, page: localPage1 } = await loginGradient(user);
        localPage = localPage1;
        localBrowser = browser;
        let { status, text, page } = await getGraStatus(
            localBrowser,
            localPage,
            user,
        );
        localPage = page;
        return text;
    };

    const restartExtension = async function (user) {
        console.log("Relogin extension...");
        localPage = await reloginGradient(user, localPage, localBrowser);
        let { status, text, page } = await getGraStatus(
            localBrowser,
            localPage,
            user,
        );
        localPage = page;
        return text;
    };

    let interval;
    const checkStatus = () => {
        interval = setInterval(async () => {
            try {
                let { status, text, page } = await getGraStatus(
                    localBrowser,
                    localPage,
                    user,
                );
                localPage = page;
                if (text.toLowerCase() == "unsupported") {
                    clearInterval(interval);
                    return;
                } else {
                    if (!status) {
                        clearInterval(interval);
                        if (
                            (await restartExtension(user)).toLowerCase() ==
                            "unsupported"
                        ) {
                            return;
                        }
                        checkStatus();
                    }
                }
            } catch (error) {
                clearInterval(interval);
                console.log("🚀 ~ checkStatus ~ error:", error);
				throw error;
            }
        }, 600000);
    };
	
	const getRandomInterval = (minMinutes, maxMinutes) => {
		const min = minMinutes * 60 * 1000; // Convert to milliseconds
		const max = maxMinutes * 60 * 1000;
		return Math.floor(Math.random() * (max - min + 1)) + min;
    };
	
	
	const send = async () => {
		let tryNum = 0;
		const executeWithDynamicInterval = async () => {
			let newPage;
			try {
				newPage = await localBrowser.newPage();
				await sendExtension(user, newPage);
			} catch (error) {
				++tryNum;
				newPage.close();
				console.log("Send extension error");
				if (tryNum <= 5) {
					console.log("Retrying send extension...");
					await new Promise((res) => setTimeout(res, 2000)); // Retry after 2 seconds
					await executeWithDynamicInterval();
					return; // Exit if retry occurs
				}
			}
			tryNum = 0;
			if (newPage) {
				newPage.close();
			}
			// Schedule the next execution with a dynamic interval
			const interval = getRandomInterval(30, 90); // between 30 mins to 90 mins
			console.log(
				`Send extension execution in ${interval / 60000} minutes.`,
			);
			setTimeout(executeWithDynamicInterval, interval);
		};
		
		// Set an initial delay for the first execution
		const initialInterval = getRandomInterval(30, 50);
		console.log(
			`Send extension execution in ${initialInterval / 60000} minutes.`,
		);
		setTimeout(executeWithDynamicInterval, initialInterval);
	};
		
	if ((await startExtension(user)).toLowerCase() != "unsupported") {
		checkStatus();
    }
	
	//send();
}

main();
