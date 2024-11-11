const axios = require('axios');
const fs = require('fs');

(async () => {
    try {
        const response = await axios.post(
            "https://api.gradient.network/api/sentrynode/list",
            {
                page: 1,
                size: 600,
                field: "active",
                direction: 0,
                active: true,
                banned: "",
                hide: 0
            },
            {
                headers: {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "en-US,en;q=0.9,vi;q=0.8",
                    "authorization": "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImI4Y2FjOTViNGE1YWNkZTBiOTY1NzJkZWU4YzhjOTVlZWU0OGNjY2QiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiS29qaW4gWW9qaSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJQkdNS3h0TUQtQ3docG1UNTE2ZXZqd1U0amI1UDhRYkxfM1FhX21rQmZQTnRpTWVtdj1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9ncmFkaWVudC1lNjExMiIsImF1ZCI6ImdyYWRpZW50LWU2MTEyIiwiYXV0aF90aW1lIjoxNzMxMjUyMzkxLCJ1c2VyX2lkIjoibWdHZnk2bE1zYlM0SUhvbU1DRjRVTzVBdkFTMiIsInN1YiI6Im1nR2Z5NmxNc2JTNElIb21NQ0Y0VU81QXZBUzIiLCJpYXQiOjE3MzEzMTE5NTksImV4cCI6MTczMTMxNTU1OSwiZW1haWwiOiJrb2ppbnlvamlAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMTYwNzgwMzk3NDQxMTM2Njg3NTQiXSwiZW1haWwiOlsia29qaW55b2ppQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.mT3lmT7THdSBQHPHYa2ZHkIvw_YMYId2Kpc34SzWUjjf1U-h0JujVlqPPG34G_GNfw44Buerv8yF3TOFheVBAOuGWTQUEJVct0naHUvY_2FYlB2dR4nICvrAaVvMp_zKAmKYbKOrfdc1Y6QDu9S6u7ixeslbcW5QHiJHncJKxdWezZXQaTOWrS8d3E2duL5X3Lmsk6FKtEE0Hj6C3sK-vVNff9j3EtwkSdgLE-Ko8Hxr6XcKzkQ1hknP5v_TXweFdll8DZaX6423IiSPOP82d92E-dzvbJASkJQw8ZuIYgaYA2Lsap1Zdezh18a_3JdvOVtOb-GYmCBd_c82l_REtw",
                    "content-type": "application/json",
                    "priority": "u=1, i",
                    "sec-ch-ua": `"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"`,
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": `"Windows"`,
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    "Referer": "https://app.gradient.network/",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                }
            }
        );
		console.log(response.data)
    } catch (error) {
        console.error("Error:", error);
    }
})();