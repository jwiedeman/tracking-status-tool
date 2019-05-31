/**
* I like to think of this project as an alcoholic node process that crawls each page like a bar crawl gone wrong
* Google Ads:
*  - Unique String for URL filtering:  'googleads.g.doubleclick.net'
*  - Conversion ID Expression:         parsedUrl.pathname.split('/')[3];
* Google Analytics:
*  - Unique String for URL filtering:  'google-analytics.com'
*  - UA Number Expression:             parsedUrl.query.tid;
*  - HitType Expression:               parsedUrl.query.t;
* Facebook Pixel:
*  - Unique String for URL filtering:  'facebook.com/tr/'
*  - Pixel ID Expression:              parsedUrl.query.id;
*  - Event Type Expression:            parsedUrl.query.ev;
* Bing Ads:
*  - Unique String for URL filtering:  'bat.bing.com/action'
*  - UET ID Expression:                parsedUrl.query.ti;
*  - UET HitType Expression:           parsedUrl.query.evt;
*/

// I suggest not running this against a large <50 page site, you'll have to hard restart


// Currently 3 stages. Sitemap processing > request URL filtering > display & storage

// #justnodethings
console.clear() // this can spit out a ton of info for bigger sites
var fs = require("fs");
const puppeteer = require('puppeteer');
var sitemaps = require('sitemap-stream-parser'); 
const URL = require('url');
process.setMaxListeners(Infinity); // y e e t

let tick = 0
const GOOGLEANALYTICS = 'googleAnalytics';
const FACEBOOK = 'facebook';
const BING = 'bing' 
const GOOGLEADS = 'googleAds';
let reportJson = {};
let promiseArr = [];
let targetSite ='http://whostracking.me/sitemap.xml' // Parent target, this will be the base URL to work off of
let currentTarget = ''; //current url being tried
const sitePage = [];
var urls = ['https://www.processsolutions.com/sitemap.xml'];

const site = [];


const checkPage = async PAGE => {
    currentTarget = PAGE // kinda backwards way of making PAGE acessible 
    const _page = { // instance obj
        'googleAnalytics': {},
        'facebook': {},
        'bing': {},
        'googleAds': {} 
    };

	
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	
	page.on('request', request => { // on request
		const url = request._url; // catch all requests 
		

		// google analytics
		if (url.indexOf('google-analytics.com') > -1) { // if analytics detected
			const parsedUrl = URL.parse(url, true); // if the url == the url.indexof true
			if (typeof parsedUrl.query.tid != 'undefined' && typeof parsedUrl.query.t != 'undefined') {
				//console.log(`## GOOGLE ANALYTICS: ${parsedUrl.query.tid} - ${parsedUrl.query.t.toUpperCase()}`);
                //storeData(GOOGLEANALYTICS, { id: parsedUrl.query.tid, hitType: parsedUrl.query.t ,payload:parsedUrl});
                storeData(GOOGLEANALYTICS, { 'id': parsedUrl.query.tid, 'hitType': parsedUrl.query.t,'payload':parsedUrl })
			}

		// facebook pixel 
		} else if (url.indexOf('facebook.com/tr/') > -1) {
			const parsedUrl = URL.parse(url, true);
			if (typeof parsedUrl.query.id != 'undefined' && typeof parsedUrl.query.id != 'undefined') {
				//console.log(`## FACEBOOK PIXEL: ${PAGE} - ${parsedUrl.query.ev.toUpperCase()}`);
                //storeData(FACEBOOK, { id: parsedUrl.query.id, hitType: parsedUrl.query.ev ,payload:parsedUrl});
                storeData(FACEBOOK, { 'id': parsedUrl.query.id, 'hitType': parsedUrl.query.ev,'payload':parsedUrl })
			}

		// google ads
		} else if (url.indexOf('googleads.g.doubleclick.net') > -1) {
            let parsedUrl = URL.parse(url, true);
            let conversionId = parsedUrl.pathname.split('/')[3];
            // Check if the URL contained query string values for the conversion ID
            //console.dir(`## GOOGLE ADS : ${PAGE} - ${conversionId}`);
            //storeData(GOOGLEADS, { id: conversionId ,payload:parsedUrl});
            storeData(GOOGLEADS, { 'id': 'conversionId', 'hitType':'Base Code Load','payload':parsedUrl })

        // microsoft ads
          } else if (url.indexOf('bat.bing.com/action') > -1) {
			const parsedUrl = URL.parse(url, true);
			if (parsedUrl.protocol == 'https:' &&typeof parsedUrl.query.ti != 'undefined' && typeof parsedUrl.query.evt != 'undefined') {
				//console.dir(`## BING UET: ${PAGE} - ${parsedUrl.query.evt}`);
                //storeData(BING, { id: parsedUrl.query.ti, hitType: parsedUrl.query.evt,payload:parsedUrl });
                storeData(BING, { 'id': parsedUrl.query.ti, 'hitType':parsedUrl.query.evt,'payload':parsedUrl })
			}
        }
       
	});
	

	await page.goto(PAGE); // get the PAGE
	await browser.close(); 
	
	reportJson[PAGE] =_page; //assign reportjson for this crawl instance to the info setup on function load
	//i.e reportJson.PAGE now contains the empty platforms from tracking information, which will be filled as the page is crawled
    //EX: storeData(BING, { id: parsedUrl.query.ti, hitType: parsedUrl.query.evt });
    


		// reportjson > site > page > platforms > id's > payload
		// obj > arr > obj  > obj > obj > obj
    

    
    
    function storeData(platform, dataObj) {
    let { id, hitType ,payload} = dataObj; // assign references to the data parameter
    
    if(typeof id != undefined && typeof hitType != undefined){ // check if incoming data exists, proceed if true
     let data = _page[platform]
	 data[id] = (typeof id !=undefined) ?  {'id':id, 'hitType':hitType,'payload':payload} : {}
	 data[id][hitType] = (typeof hitType !=undefined) ?  hitType : {}
     data[id][hitType][payload] = ( payload !=undefined) ? payload : {}
    
    }
    }
    
    
    /** Deprecieated code, TODO Delete
	function storeData(platform, dataObj) { //intake as params
		let { id, hitType ,payload} = dataObj; // set structure for incoming 2 param object, now acessible as normal id, hittype
		let info = trackingInformation[platform];
		if (typeof id != 'undefined' && typeof hitType != 'undefined') { // if ID and hittype are not undefined
			info[id] = (typeof info[id] != 'undefined') // if ID = true
				? id //assign info ID 
				: {};
				
			info[id][hitType] = (typeof info[id][hitType] != 'undefined') // if ID and hittype are true
				? info[id][hitType] + 1 
                : 1; 
           
			info[id]['payload'] = (typeof payload != 'undefined') // if ID = true
				? payload //assign info ID 
				: {};
		} 
	}*/
};




// generate the sitemap
sitemaps.parseSitemaps(urls, function(url) { sitePage.push(url); }, function(err, sitemaps) {
    sitePage.forEach(element => {
        console.log('       # Sitemapper found - ',element)
	});
	console.log('Sitemapper process complete ---------')
    onSitemapComplete() // calling the crawl after this to be sure the sitemap is generated before we  c r a w l 
});

// go through arr of sites and run checksites against each
// !! Holy fuck add a load balancer, this will just KO your client if theres more than 50 pages on a site
function onSitemapComplete(){
    sitePage.forEach(page => { // ! Probably slow this down so there is only 10 pages being requested / crawled at once

		reportJson[page] = {}; // make anon instance of object for parent site
		promiseArr.push(checkPage(page)); // get site && push to arr
		console.log('       Testing  ', currentTarget);
		
	});
	Promise.all(promiseArr).then(() => {
		console.log('Testing Complete, Results : ');
		found()
		fs.writeFile("./json.json", JSON.stringify(reportJson), (err) => {
			console.log("File has been created");
        });
        
	});

}
    


function found(){
	sitePage.forEach(page => {
       // console.log('#### Results for ',site )
		//console.log('# Google Ads',reportJson[site]['Google Ads'])
		//console.log('# Google Analytics',reportJson[site]['Google Analytics'])
		//console.log('# Facebook',reportJson[site]['Facebook'])
		//console.log('# Bing',reportJson[site]['Bing'])
        //console.log('# Google Analytics',reportJson[site])
		//console.log('### ' + reportJson[page]['googleAnalytics'] + ' - ' + page)

		//RND
		
		const _page = Object.values(reportJson[page])
		const _adPlatform = Object.values(reportJson[page]['googleAnalytics'])
		let a =0;
		for(let i in _page){
			
			console.log(_page[i]);
		}

		/** 		for(let i in _adPlatform){
			console.log('       '+_adPlatform[i].id + ' - ' + _adPlatform[i].hitType + ' detected on ' + page)
		}*/


	});
}

// console.log('# Google Analytics',reportJson[site]['googleAnalytics'])
