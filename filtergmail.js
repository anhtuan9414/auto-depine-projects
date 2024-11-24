const fs = require('fs');
// Read the file content
const gmaillist = fs.readFileSync('gmail.txt', 'utf-8');
// Split content by newline to get lines
const accounts = gmaillist.split(/\r?\n/); // Handles both \n and \r\n

const filePath = 'gamilValid_' + new Date().getTime() + '.txt';

const validGmail = [];

const gmail2 = [];

const check = async (gmail) => {
	for (let i of accounts) {
		const gmail2 = i.split('|')[0];
		if (gmail2 == gmail) {
			const line = i + '\n';
			try {
			  fs.appendFileSync(filePath, line);
			  console.log('Line successfully appended!', i);
			} catch (err) {
			  console.error('Error appending to file:', err);
			}
			break;
		}
	}
}

(async () => {
	for (let i of gmail2) {
		await check(i);
	}
})();