/**
* I like to think of this project as an alcoholic node process that crawls each page with maximum sobriety 
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

// #justnodethings
console.clear()
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
var urls = ['http://whostracking.me/sitemap.xml'];

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
				console.log(`## GOOGLE ANALYTICS: ${parsedUrl.query.tid} - ${parsedUrl.query.t.toUpperCase()}`);
                //storeData(GOOGLEANALYTICS, { id: parsedUrl.query.tid, hitType: parsedUrl.query.t ,payload:parsedUrl});
                storeData(GOOGLEANALYTICS, { 'id': parsedUrl.query.tid, 'hitType': 'Pageview','payload':parsedUrl })
			}

		// facebook pixel 
		} else if (url.indexOf('facebook.com/tr/') > -1) {
			const parsedUrl = URL.parse(url, true);
			if (typeof parsedUrl.query.id != 'undefined' && typeof parsedUrl.query.id != 'undefined') {
				//console.log(`## FACEBOOK PIXEL: ${PAGE} - ${parsedUrl.query.ev.toUpperCase()}`);
                //storeData(FACEBOOK, { id: parsedUrl.query.id, hitType: parsedUrl.query.ev ,payload:parsedUrl});
                storeData(FACEBOOK, { 'id': parsedUrl.query.id, 'hitType': 'Pageview','payload':parsedUrl })
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
                storeData(BING, { 'id': parsedUrl.query.ti, 'hitType':'Pageview','payload':parsedUrl })
			}
        }
       
	});
	

	await page.goto(PAGE); // get the PAGE
	await browser.close(); 
	
	reportJson[PAGE] =_page; //assign reportjson for this crawl instance to the info setup on function load
	//i.e reportJson.PAGE now contains the empty platforms from tracking information, which will be filled as the page is crawled
    //EX: storeData(BING, { id: parsedUrl.query.ti, hitType: parsedUrl.query.evt });
    


    // site > page > platforms > values > payload
    // arr > obj  > obj > obj > obj
    

    
    
    function storeData(platform, dataObj) {
    let { id, hitType ,payload} = dataObj; // assign references to the data parameter
    
    if(typeof id != undefined && typeof hitType != undefined){ // check if incoming data exists, proceed if true
     let data = _page[platform]
	 data[id] = (typeof id !=undefined) ?  {'id':id} : {}
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
        console.log('# Sitemap Crawler found - ',element)
    });
    onSitemapComplete() // calling the crawl after this to be sure the sitemap is generated before we  c r a w l 
});

// go through arr of sites and run checksites against each
function onSitemapComplete(){
    sitePage.forEach(page => {

		reportJson[page] = {}; // make anon instance of object for parent site
		console.log('Testing  ', currentTarget);
		promiseArr.push(checkPage(page)); // get site && push to arr
		
	});
	Promise.all(promiseArr).then(() => {
		console.log('All done! Results:');
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
		for(let i in reportJson[page]['googleAnalytics']){
			console.log(i + ' - ' + page)
		}
	});
}

// console.log('# Google Analytics',reportJson[site]['googleAnalytics'])
