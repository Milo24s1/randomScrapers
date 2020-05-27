/**
 * @description
 * HOW TO RUN SCRIPT
 * node current_season_transfers.js <URL>
 * example ( node current_season_transfers.js https://www.transfermarkt.co.uk/fc-barcelona/transfers/verein/131
 *
 *
 *path issue fixed
 * @author
 * @version 1.0 (2020-05-27)
 */
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const RESULT_FOLDER_NAME = __dirname+'/transfers';

const url  = process.argv[2];
if(url===undefined){
    console.log('URL is not defined');
    return;
}


const getOption = {
    headers: {'User-agent':'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:70.0) Gecko/20100101 Firefox/70.0'},
    jar: true,
    followAllRedirects: false,
    url:url
};


main(getOption);

/**
 * main execution
 */
function main(getOption) {
    try {
        console.log('sending request to '+getOption.url);
        request.get(getOption,(err,response,html)=>{
            if(err){
                console.log('Error in request sending');
                console.log(err);
            }
            else {

                const currentSeasonYear = getCurrentSeasonYear(html);

                const formattedInputUrl = getFomattedInputUrl(getOption.url);
                const teamId = formattedInputUrl.split("/").pop();

                /**
                 * urlBySession = 'https://www.transfermarkt.co.uk/fc-barcelona/transfers/verein/131/saison_id/2019/plus/1';
                 * */
                const urlBySession = formattedInputUrl+'/saison_id/'+currentSeasonYear+'/plus/1';
                getOption.url = urlBySession;

                try {
                    console.log('sending request to '+getOption.url);
                    request.get(getOption,(err,response,html)=>{
                        if(err){
                            console.log('Error in request sending');
                            console.log(err);
                        }
                        else {
                            let pageResults = extractInformation(html);
                            saveOutPut(pageResults,teamId,currentSeasonYear);
                        }
                    });
                }
                catch (e) {
                    console.log('**** EXCEPTION IN MAIN FUNCTION CALLBACK****');
                    console.log(e);
                    console.log('**** END OF EXCEPTION ****');
                }
            }
        });
    }
    catch (e) {
        console.log('**** EXCEPTION IN MAIN FUNCTION ****');
        console.log(e);
        console.log('**** END OF EXCEPTION ****');
    }



}


/**
 * this function will extract information from given html content
 * @param html
 * @returns {Array}
 */
function extractInformation(html) {
    console.log('extracting squad information from page');
    const players = [];
    const departPlayers = [];
    if(html!==undefined){
        const $ = cheerio.load(html);

        //process arrivals
        let trs = $("#main .row .large-12 .box:nth-child(3) .responsive-table > table > tbody > tr");
        for(let i=0;i<trs.length;i++){

            try {
                //player row
                let tr = trs[i];
                const player = {};


                const imagePath = $(tr).find('img[class*="bilderrahmen"]').attr('src');
                const playerName = $($(tr).find('td')[1]).find('.inline-table tbody tr a').text().trim();
                const playerUrl = $($(tr).find('td')[1]).find('.inline-table tbody tr a').attr('href');
                const position = $($(tr).find('td')[1]).find('.inline-table tbody tr:nth-child(2)').text().trim();
                const age =  $($(tr).find('td.zentriert')[0]).text();
                const marketValue = $($(tr).find('td.rechts')[0]).text();
                const nationalityArray = [];
                $($(tr).find('td.zentriert')[1]).find('img').each(function () {
                    nat = $(this).attr('title');
                    nationalityArray.push(nat);
                });

                const left = $($(tr).find('td.zentriert')[1]).next().find('tr:nth-child(1)').text().trim();
                const fee = $($(tr).find('td.rechts')[1]).text();
                // console.log(fee);



                player['imagePath'] = imagePath;
                player['playerName'] = playerName;
                player['playerUrl'] = playerUrl;
                player['position'] = position;
                player['age'] = age;
                player['marketValue'] = marketValue;
                player['nat'] = nationalityArray;
                player['left'] = left;
                player['fee'] = fee;



                players.push(player);
            }
            catch (e) {
                console.log('Exception when parsing html contnet row '+i);
                console.log(e);
            }
        }



        //process departs
        trs = $("#main .row .large-12 .box:nth-child(4) .responsive-table > table > tbody > tr");
        for(let i=0;i<trs.length;i++){

            try {
                //player row
                let tr = trs[i];
                const player = {};


                const imagePath = $(tr).find('img[class*="bilderrahmen"]').attr('src');
                const playerName = $($(tr).find('td')[1]).find('.inline-table tbody tr a').text().trim();
                const playerUrl = $($(tr).find('td')[1]).find('.inline-table tbody tr a').attr('href');
                const position = $($(tr).find('td')[1]).find('.inline-table tbody tr:nth-child(2)').text().trim();
                const age =  $($(tr).find('td.zentriert')[0]).text();
                const marketValue = $($(tr).find('td.rechts')[0]).text();
                const nationalityArray = [];
                $($(tr).find('td.zentriert')[1]).find('img').each(function () {
                    nat = $(this).attr('title');
                    nationalityArray.push(nat);
                });

                const left = $($(tr).find('td.zentriert')[1]).next().find('tr:nth-child(1)').text().trim();
                const fee = $($(tr).find('td.rechts')[1]).text();
                // console.log(fee);



                player['imagePath'] = imagePath;
                player['playerName'] = playerName;
                player['playerUrl'] = playerUrl;
                player['position'] = position;
                player['age'] = age;
                player['marketValue'] = marketValue;
                player['nat'] = nationalityArray;
                player['left'] = left;
                player['fee'] = fee;



                departPlayers.push(player);
            }
            catch (e) {
                console.log('Exception when parsing html contnet row '+i);
                console.log(e);
            }
        }
    }

    // console.log(players);
    return {'arrivals':players,'departures':departPlayers,'meta':{arrivals:players.length,departures:departPlayers.length}};
}

/**
 *
 * @param html
 */
function getSeasonList(html){
    const seasonObjectList = [];
    const $ = cheerio.load(html);
    const seasonOptions = $(".inline-select select option");
    seasonOptions.each(function (index) {
        const seasonObject = {};
        const year = $(this).attr('value');
        const displayValue = $(this).text();
        seasonObject['year'] = year;
        seasonObject['displayValue'] = displayValue;
        seasonObjectList.push(seasonObject);
    });

    return seasonObjectList;

}

/**
 *
 * @param html
 * @returns {jQuery}
 */
function getCurrentSeasonYear(html){
    const seasonObjectList = [];
    const $ = cheerio.load(html);
    return $('.inline-select select option[selected="selected"]').attr('value');

}



function getFomattedInputUrl(url){
    if(url.endsWith("/")){
        return url.substring(0,url.length-1);
    }
    return url;
}

/**
 * this function saves json array into a file
 * @param pageResults
 */
function saveOutPut(pageResults,teamId,season) {
    const folderPath = RESULT_FOLDER_NAME+'/'+teamId+'/'+season;
    if(!fs.existsSync(folderPath)){
        console.log('creating '+folderPath);
        mkDirByPathSync(folderPath);
    }
    let fileName = folderPath+'/info.json';
    fs.writeFileSync(fileName,JSON.stringify(pageResults,null,4),'utf8');
    console.log('output saved to '+fileName);
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



// extractInformation(fs.readFileSync('currnttrans.html','utf8'));