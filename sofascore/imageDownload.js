/**
 * download.js (2020-06-10)
 *
 * this script download image file with given address and save it to folder with the given number
 * how to run code
 *
 * node imageDownload.js  <IMAGE-URL> <NUMBER>
 *
 * example
 * node download.js https://api.sofascore.com/api/v1/unique-tournament/28/image  54
 *
 * @author
 * @version 1.0
 *
 */

const request = require('request');
const fs = require('fs');
const path = require('path');

const RESULT_FOLDER_NAME = __dirname+'/images/orignial';

let url = process.argv[2];
let number = process.argv[3];

if(url===undefined){
    console.log('url is not provided');
    return false;
}
if(number===undefined){
    console.log('number is not provided');
    return false;
}


main();



function  main(){

    const getOption = {
        jar:true,
        followAllRedirects:true,
        method: 'GET',
        url: url,
    };

    try {

        if(!fs.existsSync(RESULT_FOLDER_NAME)){
            console.log(RESULT_FOLDER_NAME+' folder is not existing');
            console.log('creating new '+RESULT_FOLDER_NAME+ ' folder');
            mkDirByPathSync(RESULT_FOLDER_NAME);
        }

        const filePath = `${RESULT_FOLDER_NAME}/${number}.png`;

        request(url).pipe(fs.createWriteStream(filePath)).on('close', function(){
            console.log('file saved to '+filePath);
        });

    }
    catch (e) {
        console.log('exception in main function');
        console.log(e);
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