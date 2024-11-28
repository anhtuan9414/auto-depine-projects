const axios = require('axios');
const fs = require('fs');

const config = {
    method: 'get',
    url: 'https://api.nodepay.org/api/network/device-networks?page=0&limit=10&active=false',
    headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
        'authorization': 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxMjkwMzI1MDYyNjA3NDM3ODI0IiwiaWF0IjoxNzMyNjgxMzQwLCJleHAiOjE3MzM4OTA5NDB9.oV4tWHABIGO3-gMJjWrXilkuzWCrMaulRd5jiyUZ52WRtwXOv8G_GZFYc619TYxCiVapUDs3SE5SJ6Lc4254fA',
        'content-type': 'application/json',
        'cookie': '__cf_bm=iTRh7DyfWyxIibOlGSaxs.6ezfmzL0RIbpSOYhM6G0k-1732805766-1.0.1.1-UicNTzHEIJd39dPTX92SoFORQvJNqx6su.4Ll48CHgVFj88NMIInUQBMU29F3ENlCuy1UHN2tur2QVLU9Qp5Yw',
        'origin': 'https://app.nodepay.ai',
        'priority': 'u=1, i',
        'referer': 'https://app.nodepay.ai/',
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
};

axios(config)
    .then(response => {
        console.log(response.data);
    })
    .catch(error => {
        console.error(error);
    });