const timers = require("node:timers/promises");
const {
    getGraStatus,
    loginGradient,
    reloginGradient,
    gradientWithoutLogin,
    printStats,
    sendExtension,
    signInWithPassword,
} = require("./lib-mini");
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
    let user = {
        id: "Depin",
        user: process.env.USER,
        pass: process.env.PASS,
        key: process.env.KEY,
    };
    console.log("🚀 ~ Start Script ~");

    let localBrowser;
    let localPage;

    const startExtension = async function (user) {
        let { browser, page: localPage1 } = await gradientWithoutLogin(user);
        localPage = localPage1;
        localBrowser = browser;
        return true;
    };

    const getRandomInterval = (minMinutes, maxMinutes) => {
        const min = minMinutes * 60 * 1000; // Convert to milliseconds
        const max = maxMinutes * 60 * 1000;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const getRandomIntervalSeconds = (minSeconds, maxSeconds) => {
        const minMs = minSeconds * 1000; // Convert seconds to milliseconds
        const maxMs = maxSeconds * 1000;
        return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    };

    const getRandomIntervalHours = (minHours, maxHours) => {
        const minMs = minHours * 60 * 60 * 1000; // Convert hours to milliseconds
        const maxMs = maxHours * 60 * 60 * 1000;
        return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    };

    const checkStatus = async () => {
        let tryNum = 0;

        const executeWithDynamicInterval = async () => {
            try {
                await sendExtension(user, localPage);
                tryNum = 0; // Reset retry counter on success
            } catch (error) {
                ++tryNum;
                console.log("Send extension error");
                if (tryNum <= 5) {
                    console.log("Retrying send extension...");
                    await new Promise((res) => setTimeout(res, 2000)); // Retry after 2 seconds
                    await executeWithDynamicInterval();
                    return; // Exit if retry occurs
                } else {
                    console.log("Closing all browser instances");
                    await localPage.close();
                    await localBrowser.close();
                    throw error;
                }
            }

            // Schedule the next execution with a dynamic interval
            const interval = getRandomInterval(30, 60); // between 30 mins to 60 mins
            console.log(
                `Send extension execution in ${interval / 60000} minutes.`,
            );
            setTimeout(executeWithDynamicInterval, interval);
        };

        // Set an initial delay for the first execution
        const initialInterval = getRandomInterval(30, 60);
        console.log(
            `Send extension execution in ${initialInterval / 60000} minutes.`,
        );
        setTimeout(executeWithDynamicInterval, initialInterval);
    };

    const getToken = async () => {
        try {
            console.log("Get token executed at:", new Date());
            await signInWithPassword(user.user, user.pass, user.key);
            await sendExtension(user, localPage);
            const nextInterval = getRandomIntervalSeconds(86400, 172800); // from 24h to 48h
            console.log(
                `Next get token execution in: ${(nextInterval / 1000).toFixed(2)} seconds`,
            );
            clearInterval(intervalId);
            intervalId = setInterval(getToken, nextInterval);
        } catch (error) {
            console.log("Get token error: ", error);
        }
    };

    await startExtension(user);

    checkStatus();

    let intervalId = setInterval(
        getToken,
        getRandomIntervalSeconds(86400, 172800),
    ); // from 24h to 48h
}

main();
