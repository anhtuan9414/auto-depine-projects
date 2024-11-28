const axios = require('axios');

const ipAddresses = [];

async function getIpLocation(ip) {
  try {
    // Make a GET request to ip-api.com
    const response = await axios.get(`http://ip-api.com/json/${ip}`);

    // Access the response data
    const data = response.data;
    if (data.status === "success") {
		console.log(`IP: ${ip}`);
      console.log(`City: ${data.city}`);
      console.log(`Region: ${data.regionName}`);
      console.log(`Country: ${data.country}`);
    } else {
      console.log('Failed to retrieve location information:', data.message);
    }
  } catch (error) {
    console.error('Error fetching IP location:', error.message);
  }
}

for (let ip of ipAddresses) {
getIpLocation(ip);
}
