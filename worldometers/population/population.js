/**
 *
 corona.js
 this script is getting get all information from data table and saving as a json file


 ###### HOW TO RUN THIS SCRIPT ######
 node population.js 2020-03-25

 ##### OUTPUT PATH ######
 json_data/2020/03/25/23.json

 *@param ${date} ${hour}
 * @version 1.0
 */


const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const RESULT_FOLDER_NAME = __dirname+'/population';
const moment = require('moment');



const date = process.argv[2];

if(date!=undefined){

    if(moment(date,'YYYY-MM-DD',true).isValid()){
        main(date)
    }
    else {
        console.log('Invalid Date');
        return;
    }
}
else {
    console.log('date is not defined');
}



function main(date) {

    try {

        const getOption = {
            headers: {'User-agent':'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:70.0) Gecko/20100101 Firefox/70.0'},
            jar: true,
            followAllRedirects: false,
            url:'https://www.worldometers.info/world-population/population-by-country/'
        };

        console.log('sending request to '+getOption.url);
        request.get(getOption,(err,response,html)=>{

            if(err){
                console.log('error in request');
                console.log(err);
            }
            else {

                const pageResult = extractInformation(html);
                saveOutPut(pageResult,date);
            }
        });

    }catch (e) {
        console.log('Exception in main functiion');
        console.log(e);
    }
}


function extractInformation(html) {

    console.log('start extracting information from page');
    const result = [];
    if(html!=undefined){

        const $ = cheerio.load(html);
        const trs = $("#example2  tbody tr");
        
        trs.each(function (index) {

            const rowObject = {};

            const rank  = $(this).find('td:nth-child(1)').text();
            const countryName  = $(this).find('td:nth-child(2)').text();
            const population  = $(this).find('td:nth-child(3)').text();
            const yearlyChanges  = $(this).find('td:nth-child(4)').text();
            const netChange  = $(this).find('td:nth-child(5)').text();
            const dencity  = $(this).find('td:nth-child(6)').text();
            const landArea  = $(this).find('td:nth-child(7)').text();
            const migrants  = $(this).find('td:nth-child(8)').text();
            const fertRate  = $(this).find('td:nth-child(9)').text();

            const medAge  = $(this).find('td:nth-child(10)').text();
            const urbunPopulation  = $(this).find('td:nth-child(11)').text();


            rowObject['rank'] = rank;
            rowObject['country'] = countryName;
            rowObject['population'] = population;
            rowObject['yearlyChanges'] = yearlyChanges;
            rowObject['netChange'] = netChange;
            rowObject['density'] = dencity;
            rowObject['landArea'] = landArea;
            rowObject['migrants'] = migrants;
            rowObject['fertRate'] = fertRate;
            rowObject['medAge'] = medAge;
            rowObject['urbunPopulation'] = urbunPopulation;

            result.push(rowObject);

        })

    }

    return result;
}

/**
 * this function saves json array into a file
 * @param pageResults
 * @param date
 * @param hour
 */
function saveOutPut(pageResults,date) {
    const folderPath = `${RESULT_FOLDER_NAME}/${date.split('-').join('/')}`;
    if(!fs.existsSync(folderPath)){
        console.log('creating '+folderPath);
        mkDirByPathSync(folderPath);
    }
    let fileName = `${folderPath}/info.json`;
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