/**
 * @description
 * HOW TO RUN SCRIPT
 * node sofascore.js <URL>
 *
 * this script will scrape all countries leagues in to json file
 * [
 *
 *
 * ]
 *
 *
 * @author
 * @version 1.0 (2020-05-14)
 */
const fs = require('fs');
const puppeteer = require("puppeteer");
const moment = require('moment');
const request = require('request');
const cheerio = require('cheerio');
const path = require('path');
const RESULT_FILE_NAME = __dirname+'/leagues.json';
const WAIT_TIME_BETWEEN_REQUEST = 1500;

main();

async function main() {
	try {


		browser = await puppeteer.launch({
			headless: false,
		});

		const page = await browser.newPage();

		await page.setRequestInterception(true);
		page.on('request', request => {
			if (request.resourceType() === 'image')
				request.abort();
			else
				request.continue();
		});

		const url = 'https://www.sofascore.com/';
		await page.goto(url, { timeout: 30000,waitUntil: 'networkidle2'});
		console.log('page is loaded');

		await page.waitForSelector('.leagues__list.js-sidebar-category-list li',{timeout:30000});

		const countryList = await page.evaluate(()=>{

			const nameAndIdMap = [...document.querySelectorAll('.leagues__list.js-sidebar-category-list li')].
			map(node=>{return {'id':node.classList[1].split("-").pop().trim(),'name':node.innerText.trim().split("\n")[0]}});

			return nameAndIdMap;

		});


		for (let item of countryList){

			await getCountryLeagues(item);
			console.log('wating '+(WAIT_TIME_BETWEEN_REQUEST/1000)+' seconds');
			await timeout(WAIT_TIME_BETWEEN_REQUEST);
		}
	}
	catch (e) {
		console.log('main function exception');
		console.log(e);
	}

	browser.close();
}

async function getCountryLeagues(item) {

	return new Promise(resolve => {

		const getOption = {
			headers: {'User-agent':'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:70.0) Gecko/20100101 Firefox/70.0'},
			jar: true,
			followAllRedirects: true,
		};

		const dataid = item.id;
		const countryName = item.name;
		var date = new Date();
		var currentTimestamp = parseInt(date.getTime()/1000);
		getOption.url = 'https://www.sofascore.com/esi/category/'+dataid+'/tournaments?_='+currentTimestamp;

		console.log('process '+countryName);
		request.get(getOption,(err,response,html)=>{

			if(err){
				console.log(err);
				resolve(false);
			}
			else {
				saveAndMergeResult(extractCountryLeagueList(html,countryName));
				resolve(true);
			}
		});
	});
}

const timeout = ms => new Promise(res => setTimeout(res, ms));

function extractCountryLeagueList(html,countryName) {

	const leagues = [];
	const $ = cheerio.load(html);
	$('.leagues__list li a[href*="tournament"]').each(function () {
		var leagueSlug = $(this).attr('href');
		var leagueName = $(this).text().trim();
		var leagueId = leagueSlug.split("/").pop();

		const league = {
			'id':leagueId,
			'name':leagueName,
			'href':leagueSlug,
			'country':countryName
		};

		leagues.push(league);
	});

	return leagues;
}

/**
 * this function merge new result in a page
 * @param pageResult
 */
function saveAndMergeResult(pageResult){
	try {
		console.log('Begin saveAndMergeResult');
		if(pageResult.length>0){

			if(!fs.existsSync(RESULT_FILE_NAME)){
				console.log(RESULT_FILE_NAME+' file is not exisitng');
				console.log('creating new '+RESULT_FILE_NAME+ ' file');
				fs.writeFileSync(RESULT_FILE_NAME,'','utf8');
			}


			let existingResult = fs.readFileSync(RESULT_FILE_NAME,'utf8');
			if(existingResult.length>0){
				existingResult = JSON.parse(existingResult);
			}
			else {
				existingResult = [];
			}
			console.log('Merging new result set :'+pageResult.length);
			const mergedResult = existingResult.concat(pageResult);
			console.log('total records after merge :'+mergedResult.length);
			fs.writeFileSync(RESULT_FILE_NAME,JSON.stringify(mergedResult,null,4),'utf8');
			console.log('saving Merged result set');
		}
	}
	catch (e) {
		console.log('Exception in saveAndMergeResult'+e);
	}

}

