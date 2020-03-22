/**
 *
 * @version 1.0
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require("puppeteer");
const moment = require('moment');
const RESULT_FOLDER_NAME = __dirname+'/events';


const eventId = process.argv[2];//'jD3wDzfp';

const scrapeSummary = true;
const scrapeStats = true;
const scrapeLineUp = true;

if(eventId !==undefined){
	main();
}
else {
	console.log('event id is not defined');
}



async function main() {
	try {
		console.log('loading match page');
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


		const url = `https://www.flashscore.com/match/${eventId}/#match-summary`;
		await page.goto(url, { timeout: 30000,waitUntil: 'networkidle2'});
		console.log('page is loaded');

		await page.waitForSelector('#summary-content',{timeout: 15000});
		await page.waitFor(15000);

		const matchDate = await page.evaluate(()=>{
			return document.querySelector('#utime').innerText.split(" ")[0].split(".").reverse().join("/");

		});

		if(moment(matchDate,'YYYY/MM/DD',true).isValid()){

			const folderPath = `${RESULT_FOLDER_NAME}/${matchDate}`;
			if(!fs.existsSync(folderPath)){
				console.log('creating '+folderPath);
				mkDirByPathSync(folderPath);
			}


			if(scrapeSummary){
				console.log('scraping summary content');
				const summary = await page.evaluate(()=>{

					const incidents = [];
					const incidentRows = document.querySelectorAll('#summary-content .detailMS__incidentRow');

					for (let incidentRow of incidentRows){
						const incident = {};
						const rowClassList = incidentRow.classList;
						const teamType = rowClassList.contains('incidentRow--home')?'' +
							'home':rowClassList.contains('incidentRow--away')?'away':'';

						const time = incidentRow.querySelector('[class*="time-box"').innerText.trim().replace("\\","");

						const iconDiv = incidentRow.querySelector('[class*="icon"]');
						const iconDivClassList = iconDiv.classList;
						const incidentType = iconDivClassList.contains('y-card')?'card':
							iconDivClassList.contains('soccer-ball')?'goal':'substitution';

						incident['teamType'] = teamType;
						incident['time'] = time;
						incident['incidentType'] = incidentType;

						switch (incidentType) {
							case 'card':
								const playerName = incidentRow.querySelector('.participant-name').innerText;
								const playerSlug = incidentRow.querySelector('.participant-name a').attributes[1].value.
								replace('window.open(\'',"").replace("\/'); return false;","");
								const cardDetail = {
									'playerName':playerName,
									'playerSlug':playerSlug
								};
								incident['cardDetail'] = cardDetail;
								break;

							case 'goal':
								const goalPlayerName = incidentRow.querySelector('.participant-name').innerText;
								const goalplayerSlug = incidentRow.querySelector('.participant-name a').attributes[1].value.
								replace('window.open(\'',"").replace("\/'); return false;","");
								const goalDetail = {
									'playerName':goalPlayerName,
									'playerSlug':goalplayerSlug
								};
								incident['goalDetail'] = goalDetail;
								break;

							case 'substitution':
								const playerInName = incidentRow.querySelector('.substitution-in-name').innerText;
								const playerOutName = incidentRow.querySelector('.substitution-out-name').innerText;

								const playerInSlug = incidentRow.querySelector('.substitution-in-name a').attributes[1].value.
								replace('window.open(\'',"").replace("\/'); return false;","");
								const playerOutSlug = incidentRow.querySelector('.substitution-out-name a').attributes[1].value.
								replace('window.open(\'',"").replace("\/'); return false;","");

								const substitutionDetail = {
									'playerInName':playerInName,
									'playerOutName':playerOutName,
									'playerInSlug':playerInSlug,
									'playerOutSlug':playerOutSlug
								};
								incident['substitutionDetail'] = substitutionDetail;
								break;
						}



						incidents.push(incident);
					}

					return incidents;
				});
				saveOutPut(eventId,summary,'summary',matchDate);
			}


			if(scrapeStats){

				console.log('clicking statistics tab');
				await page.click('#li-match-statistics');
				await page.waitForSelector('#statistics-content',{timeout: 15000});
				await page.waitFor(15000);

				console.log('scraping statistics content');
				const statistics = await page.evaluate(()=>{

					const statistic = {};
					const matchStats = [];
					const firstHalfStats = [];
					const secondHalfStats = [];

					const matchStatRows = document.querySelectorAll('#tab-statistics-0-statistic .statRow');
					for (let matchStatRow of matchStatRows){

						const titleValue = matchStatRow.querySelector('.statTextGroup .statText--titleValue').innerText;
						const homeValue = matchStatRow.querySelector('.statTextGroup .statText--homeValue').innerText;
						const awayValue = matchStatRow.querySelector('.statTextGroup .statText--awayValue').innerText;

						const stat = {};
						stat['titleValue'] = titleValue;
						stat['homeValue'] = homeValue;
						stat['awayValue'] = awayValue;

						matchStats.push(stat);
					}

					const firstHalfStatRows = document.querySelectorAll('#tab-statistics-1-statistic .statRow');
					for (let firstHalfStatRow of firstHalfStatRows){

						const titleValue = firstHalfStatRow.querySelector('.statTextGroup .statText--titleValue').innerText;
						const homeValue = firstHalfStatRow.querySelector('.statTextGroup .statText--homeValue').innerText;
						const awayValue = firstHalfStatRow.querySelector('.statTextGroup .statText--awayValue').innerText;

						const stat = {};
						stat['titleValue'] = titleValue;
						stat['homeValue'] = homeValue;
						stat['awayValue'] = awayValue;

						firstHalfStats.push(stat);
					}

					const secondHalfStatRows = document.querySelectorAll('#tab-statistics-2-statistic .statRow');
					for (let secondHalfStatRow of secondHalfStatRows){

						const titleValue = secondHalfStatRow.querySelector('.statTextGroup .statText--titleValue').innerText;
						const homeValue = secondHalfStatRow.querySelector('.statTextGroup .statText--homeValue').innerText;
						const awayValue = secondHalfStatRow.querySelector('.statTextGroup .statText--awayValue').innerText;

						const stat = {};
						stat['titleValue'] = titleValue;
						stat['homeValue'] = homeValue;
						stat['awayValue'] = awayValue;

						secondHalfStats.push(stat);
					}

					statistic['matchStats'] = matchStats;
					statistic['firstHalfStats'] = firstHalfStats;
					statistic['secondHalfStats'] = secondHalfStats;

					return statistic;

				});
				saveOutPut(eventId,statistics,'stats',matchDate);
			}


			if(scrapeLineUp){

				console.log('clicking lineup tab');
				await page.click('#li-match-lineups');
				await page.waitForSelector('#lineups-content',{timeout: 15000});
				await page.waitFor(15000);

				console.log('scraping lineup content');
				const lineup = await page.evaluate(()=>{

					const lineupRows = document.querySelectorAll('.lineups-wrapper table tbody tr');
					let category = null;

					const startLineupArray = [];
					const substitutesArray = [];
					const cocachArray = [];
					const captainArray = [];
					for (let lineupRow of lineupRows){

						const lineupRowClassList = lineupRow.classList;
						if(lineupRowClassList.contains('odd') || lineupRowClassList.contains('even')){

							switch (category) {

								case 'Starting Lineups':



									const leftSummaryTd = lineupRow.querySelector('.fl');
									const leftTime = leftSummaryTd.querySelector('.time-box')?
										leftSummaryTd.querySelector('.time-box').innerText : null;
									let leftName = leftSummaryTd.querySelector('.name').innerText;
									const leftplayerSlug = leftSummaryTd.querySelector('.name a').attributes[1].value.
									replace('window.open(\'',"").replace("\/'); return false;","");
									let leftSubstitue = leftSummaryTd.querySelector('.name-substitution a')?
										leftSummaryTd.querySelector('.name-substitution a').innerText : null;
									const leftSubPlayerSlug = leftSummaryTd.querySelector('.name-substitution a')?
										leftSummaryTd.querySelector('.name-substitution a').attributes[1].value.
									replace('window.open(\'',"").replace("\/'); return false;","") : null;


									if(leftSummaryTd.querySelector('.name a span[title="Captain"]')){

										leftName = leftName.split(".")[0];
										captainArray.push({
											'side':'left',
											'playerName':leftName,
											'playerSlug':leftplayerSlug

										});
									}
									else if(leftSummaryTd.querySelector('.name a span[title="Goalkeeper"]')){
										leftName = leftName.split(".")[0];
									}

									startLineupArray.push({
										"side":"left",
										"time":leftTime,
										"player":leftName,
										"playerSlug":leftplayerSlug,
										"subPlayer":leftSubstitue,
										"subPlayerSlug":leftSubPlayerSlug
									});






									const rightSummaryTd = lineupRow.querySelector('.fr');
									const rightTime = rightSummaryTd.querySelector('.time-box')?
										rightSummaryTd.querySelector('.time-box').innerText : null;
									let rightName = rightSummaryTd.querySelector('.name').innerText;
									const rightplayerSlug = rightSummaryTd.querySelector('.name a').attributes[1].value.
									replace('window.open(\'',"").replace("\/'); return false;","");
									let rightSubstitue = rightSummaryTd.querySelector('.name-substitution a')?
										rightSummaryTd.querySelector('.name-substitution a').innerText : null;
									const rightSubPlayerSlug = rightSummaryTd.querySelector('.name-substitution a')?
										rightSummaryTd.querySelector('.name-substitution a').attributes[1].value.
										replace('window.open(\'',"").replace("\/'); return false;","") : null;

									if(rightSummaryTd.querySelector('.name a span[title="Captain"]')){

										rightName = rightName.split(".")[0];
										captainArray.push({
											'side':'right',
											'playerName':rightName,
											'playerSlug':rightplayerSlug

										});
									}
									else if(rightSummaryTd.querySelector('.name a span[title="Goalkeeper"]')){
										rightName = rightName.split(".")[0];
									}

									startLineupArray.push({
										"side":"right",
										"time":rightTime,
										"player":rightName,
										"playerSlug":rightplayerSlug,
										"subPlayer":rightSubstitue,
										"subPlayerSlug":rightSubPlayerSlug
									});


									break;

								case 'Substitutes':

									const subsection_leftSummaryTd = lineupRow.querySelector('.fl');
									const subsection_leftTime = subsection_leftSummaryTd.querySelector('.time-box')?
										subsection_leftSummaryTd.querySelector('.time-box').innerText : null;
									const subsection_leftName = subsection_leftSummaryTd.querySelector('.name').innerText;
									const subsection_leftplayerSlug = subsection_leftSummaryTd.querySelector('.name a').attributes[1].value.
									replace('window.open(\'',"").replace("\/'); return false;","");
									let subsection_leftSubstitue = subsection_leftSummaryTd.querySelector('.name-substitution a')?
										subsection_leftSummaryTd.querySelector('.name-substitution a').innerText : null;
									const subsection_leftSubPlayerSlug = subsection_leftSummaryTd.querySelector('.name-substitution a')?
										subsection_leftSummaryTd.querySelector('.name-substitution a').attributes[1].value.
										replace('window.open(\'',"").replace("\/'); return false;","") : null;

									substitutesArray.push({
										"side":"left",
										"time":subsection_leftTime,
										"player":subsection_leftName,
										"playerSlug":subsection_leftplayerSlug,
										"subPlayer":subsection_leftSubstitue,
										"subPlayerSlug":subsection_leftSubPlayerSlug
									});

									const subsection_rightSummaryTd = lineupRow.querySelector('.fr');
									const subsection_rightTime = subsection_rightSummaryTd.querySelector('.time-box')?
										subsection_rightSummaryTd.querySelector('.time-box').innerText : null;
									const subsection_rightName = subsection_rightSummaryTd.querySelector('.name').innerText;
									const subsection_rightplayerSlug = subsection_rightSummaryTd.querySelector('.name a').attributes[1].value.
									replace('window.open(\'',"").replace("\/'); return false;","");
									let subsection_rightSubstitue = subsection_rightSummaryTd.querySelector('.name-substitution a')?
										subsection_rightSummaryTd.querySelector('.name-substitution a').innerText : null;
									const subsection_rightSubPlayerSlug = subsection_rightSummaryTd.querySelector('.name-substitution a')?
										subsection_rightSummaryTd.querySelector('.name-substitution a').attributes[1].value.
										replace('window.open(\'',"").replace("\/'); return false;","") : null;

									substitutesArray.push({
										"side":"right",
										"time":subsection_rightTime,
										"player":subsection_rightName,
										"playerSlug":subsection_rightplayerSlug,
										"subPlayer":subsection_rightSubstitue,
										"subPlayerSlug":subsection_rightSubPlayerSlug
									});


									break;

								case 'Coaches':
									break;
							}
						}
						else {
							category = lineupRow.innerText;
						}

					}

					const coachesRows = document.querySelectorAll('#coaches tbody tr');
					for (let coachRow of coachesRows){

						if(coachRow.classList.contains('even') ||coachRow.classList.contains('odd')){

							const leftCoachTdSummary = coachRow.querySelector('.fl');
							const leftCoachName = leftCoachTdSummary.querySelector('.name').innerText;
							const leftCoachSlug = leftCoachTdSummary.querySelector('.name a').attributes[1].value.
							replace('window.open(\'',"").replace("\/'); return false;","");

							cocachArray.push({
								'side':'left',
								'name':leftCoachName,
								'coachSlug':leftCoachSlug,
							});

							const rightCoachTdSummary = coachRow.querySelector('.fr');
							const rightCoachName = rightCoachTdSummary.querySelector('.name').innerText;
							const rightCoachSlug = rightCoachTdSummary.querySelector('.name a').attributes[1].value.
							replace('window.open(\'',"").replace("\/'); return false;","");

							cocachArray.push({
								'side':'right',
								'name':rightCoachName,
								'coachSlug':rightCoachSlug,
							})

						}
					}


					const formationRow = document.querySelector('#parts tbody tr');
					const leftFormation = formationRow.querySelectorAll('td')[0].innerText;
					const rightFormation = formationRow.querySelectorAll('td')[2].innerText;
					const formation = {
						'left':leftFormation,
						'right':rightFormation
					}


					return {"Starting Lineups":startLineupArray, "Substitutes":substitutesArray, "Coaches":cocachArray, "Captains":captainArray,"Formation":formation};
				});

				saveOutPut(eventId,lineup,'lineup',matchDate);

			}





		}
		else {
			console.log('match date not found. skipping scraping');
		}



	}
	catch (e) {
		console.log('main function exception');
		console.log(e);
	}
	console.log('closing browser');
	browser.close();
}


/**
 *  this will save the given ouptput to a json file
 * @param eventId
 * @param content
 * @param category
 * @param date
 */
function saveOutPut(eventId,content,category,date) {

	try {
		const folderPath = `${RESULT_FOLDER_NAME}/${date}`;
		const fileName = `${folderPath}/${eventId}_${category}.json`;
		fs.writeFileSync(fileName,JSON.stringify(content,null,4),'utf8');
		console.log('output saved to '+fileName);
	}
	catch (e) {
		console.log(`Failed to save output of ${eventId}_${category}.json}`);
	}

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
