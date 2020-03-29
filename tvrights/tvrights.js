/**
 *Get rights passing chanel url
 * @version 1.0
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require("puppeteer");
const moment = require('moment');
const RESULT_FOLDER_NAME = __dirname+'/tvs';

/**
 * url format is something like this
 *  https://www.livesoccertv.com/es/channels/bt-sport-ultra-hd
 *
 */
const url = process.argv[2];
if(url!=undefined){
	main();
}
else {
	console.log('URL is not definied');
}

async function main() {

	try {
		console.log('loading tv channel page');
		browser = await puppeteer.launch({
			headless: true,
		});

		const page = await browser.newPage();
		await page.setRequestInterception(true);
		page.on('request', request => {
			if (request.resourceType() === 'image')
				request.abort();
			else
				request.continue();
		});


		await page.goto(url, { timeout: 30000,waitUntil: 'networkidle2'});
		console.log('page is loaded');

		await page.waitForSelector('#leftcol_white',{timeout: 15000});
		await page.waitFor(15000);


		const info = await page.evaluate(()=>{

			let imgPath = null;
			const imgElement = document.querySelector('#leftcol_white div').querySelector('a img');
			if(imgElement!=null){
				imgPath = imgElement.src;
			}

			let website = null;
			const webLinkElement = document.querySelector('#leftcol_white div').querySelector('a');
			if(webLinkElement != null){
				website = webLinkElement.href;
			}

			let about = [];
			const aboutElement = document.querySelectorAll('#leftcol_white p');
			if(aboutElement != null){
				about = [...aboutElement].map(p=>p.innerText);
			}

			const infoObject = {};
			infoObject['imgPath'] = imgPath;
			infoObject['website'] = website;
			infoObject['about'] = about;


			return infoObject;

		});


		saveOutput(info,url);

	}catch (e) {
		console.log('main function exception');
		console.log(e);
	}
	console.log('closing browser');
	browser.close();
}

function saveOutput(infoObject,url) {

	let channelName = null;

	if(url.endsWith("/")){
		const urlParts = url.split("/");
		channelName = urlParts[urlParts.length-2];
	}
	else {
		channelName = url.split("/").pop();
	}

	const folderPath = `${RESULT_FOLDER_NAME}/${channelName}`;
	if(!fs.existsSync(folderPath)){
		console.log('creating '+folderPath);
		mkDirByPathSync(folderPath);
	}

	const fileName = `${folderPath}/info.json`;
	fs.writeFileSync(fileName,JSON.stringify(infoObject,null,4),'utf8');
	console.log('ouput saved to '+fileName);

}


/**
 *
 * @param targetDir
 * @param isRelativeToScript
 * @returns {T}
 */
function mkDirByPathSync(targetDir, { isRelativeToScript = true } = {}) {
	const sep = path.sep;
	const initDir = path.isAbsolute(targetDir) ? sep : '';
	const baseDir = isRelativeToScript ? __dirname : '.';

	return targetDir.split(sep).reduce((parentDir, childDir) => {
		const curDir = path.resolve(baseDir, parentDir, childDir);
		try {
			fs.mkdirSync(curDir);
		} catch (err) {
			if (err.code === 'EEXIST') { // curDir already exists!
				return curDir;
			}

			// To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
			if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
				throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
			}

			const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
			if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
				throw err; // Throw if it's just the last created dir.
			}
		}

		return curDir;
	}, initDir);
}
