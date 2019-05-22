/**
* This tool is meant to serve as a simple proof-of-concept and
* has not been built for expansion/actual real-world use.
*
* 
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

const puppeteer = require('puppeteer');
const URL = require('url');

const GOOGLEANALYTICS = 'Google Analytics';
const FACEBOOK = 'Facebook Ads';
const BING = 'Bing Ads' 
const GOOGLEADS = 'Google Ads';

const exampleSites = [
	'http://localhost'
];

const sites = (process.argv.length > 2)
	? process.argv.slice(2)
	: exampleSites;

const checkPage = async site => {
	console.log('Started testing for ', site);
	const trackingInformation = {
		'Google Analytics': {},
		'Facebook Ads': {},
		'Bing Ads': {},
		'Google Ads': []
	};
	
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	
	page.on('request', request => { // on request
		const url = request._url; // catch all requests 
		

		// google analytics
		if (url.indexOf('google-analytics.com') > -1) { // if analytics detected
			const parsedUrl = URL.parse(url, true); // if the url == the url.indexof true
			//console.log(parsedUrl)///////

			// failout 
			if (typeof parsedUrl.query.tid != 'undefined' && typeof parsedUrl.query.t != 'undefined') {
				console.log(`${site} - GOOGLE ANALYTICS: ${parsedUrl.query.tid} - ${parsedUrl.query.t.toUpperCase()}`);
				storeData(GOOGLEANALYTICS, { id: parsedUrl.query.tid, hitType: parsedUrl.query.t });
			}


			// facebook pixel 
		} else if (url.indexOf('facebook.com/tr/') > -1) {
			const parsedUrl = URL.parse(url, true);
			
			if (typeof parsedUrl.query.id != 'undefined' && typeof parsedUrl.query.id != 'undefined') {
				console.log(`${site} - FACEBOOK PIXEL: ${parsedUrl.query.id} - ${parsedUrl.query.ev.toUpperCase()}`);
				storeData(FACEBOOK, { id: parsedUrl.query.id, hitType: parsedUrl.query.ev });
			}


			// google ads
		} else if (url.indexOf('googleads.g.doubleclick.net') > -1) {
			const parsedUrl = URL.parse(url, true);

			if (parsedUrl.pathname.split('/').length > 4 && parsedUrl.pathname.split('/')[3].length === 9) {
				const conversionId = parsedUrl.pathname.split('/')[3];
			
				console.log(`${site} - GOOGLE ADS REMARKETING: ${conversionId}`);
				storeData(GOOGLEADS, { id: conversionId });
			}

			// microsoft ads
		} else if (url.indexOf('bat.bing.com/action') > -1) {
			const parsedUrl = URL.parse(url, true);
			
			if (typeof parsedUrl.query.ti != 'undefined' && typeof parsedUrl.query.evt != 'undefined') {
				console.log(`${site} - BING UET: ${parsedUrl.query.ti} - ${parsedUrl.query.evt}`);
				storeData(BING, { id: parsedUrl.query.ti, hitType: parsedUrl.query.evt });
			}
		}
	});
	


	
	await page.goto(site); // get the site
	await browser.close(); 
	
	reportJson[site] = trackingInformation;
	
	function storeData(platform, dataObj) {
		let { id, hitType } = dataObj;
		let info = trackingInformation[platform];
		if (typeof id != 'undefined' && typeof hitType != 'undefined') {
			info[id] = (typeof info[id] != 'undefined')
				? info[id]
				: {};
			info[id][hitType] = (typeof info[id][hitType] != 'undefined')
				? info[id][hitType] + 1
				: 1; 
		} else if (typeof id != 'undefined') {
			if (!info.includes(id)) {
				info.push(id);
			}
		}
	}
};

let reportJson = {};
let promiseArr = [];


/*

//Debug pane
// feed vars for the table
// pretty self explanatory, feed instance stuff, itll make a table. Expand as pylons counts allow
var tick =0;
// an object whose properties are strings
function instance(target,googleAnalytics,googleAds,facebook,microsoft) {
  this.tick = tick;
  this.target = target;
  this.googleAnalytics = googleAnalytics;
  this.googleAds = googleAds; 
  this.facebook = facebook;
  this.microsoft = microsoft;
}

setInterval(function(){ 
tick+=1
console.clear()
console.table(new instance('target','googleAnalytics','googleAds','facebook','microsoft'));
}, 200);
*/




// go through arr of sites and run checksites against each
sites.forEach(site => {
	reportJson[site] = {}; // make anon instance of object for parent site

	promiseArr.push(checkPage(site)); // get site 
});

Promise.all(promiseArr).then(() => {
	console.log('All done! Results:');
//	console.dir(reportJson, { depth: null }); // log report
});


