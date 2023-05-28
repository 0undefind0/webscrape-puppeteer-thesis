const puppeteer = require('puppeteer');
const fs = require('fs');

const scrapeImages = async (url) => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await page.goto('https://www.lazada.com.ph/');

    // // Add Headers 
	// await page.setExtraHTTPHeaders({ 
	// 	'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', 
	// 	'upgrade-insecure-requests': '1', 
	// 	'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8', 
	// 	'accept-encoding': 'gzip, deflate, br', 
	// 	'accept-language': 'en-US,en;q=0.9,en;q=0.8' 
	// }); 

    await page.screenshot({path: '1.png'});

    // wait for 2 seconds using set timeout 
    setTimeout(() => {
        console.log('waiting for 2 seconds');
    }, 1100);

    // navigate to new url
    await page.goto('https://www.lazada.com.ph/products/lenovo-he05-bluetooth-earphone-ipx5-waterproof-sport-headset-magnetic-neckband-wireless-headphone-with-mic-for-android-mobile-phone-i1643144702-s7057188098.html');
    await page.waitForSelector('img');
    await page.screenshot({path: '2.png'});

    // // Click the title to focus
    // await page.waitForSelector('pdp-mod-product-badge-title');
    // await page.click('pdp-mod-product-badge-title');

    // Click anywhere on the page
    await page.waitForTimeout(1000);
    await page.mouse.click(200, 100); // Replace with the desired coordinates

    // Wait for the review section to load
    console.log('waiting for the review section to load');
    let target_review = await page.waitForSelector('#module_product_review > div > div')
    await page.evaluate((PageItem) => PageItem.scrollIntoView(), target_review);
    await page.waitForTimeout(900);
    await page.screenshot({path: '3.png'});
    console.log('review section loaded');

    // Get the reviews
    const scrapeReview = () => {
        const review_items = document.querySelectorAll('div.mod-reviews div.item');
        const review_list = Array.from(review_items).map(v => {
            const name = v.querySelector('div.middle > span:nth-child(1)').textContent.trim();
            const date = v.querySelector('div.top span.title.right').textContent.trim();
            const review = v.querySelector('div.item-content div.content').textContent.trim();

            return {
                name,
                date,
                review
            };
        });
        return review_list;
    }
    const reviews = await page.evaluate( scrapeReview )

    console.log(reviews);

    const filterSelector = 'div.pdp-mod-filterSort > div.oper:nth-child(2)'
    await page.waitForSelector(filterSelector);
    await page.click(filterSelector);
    
    // wait
    setTimeout(() => {
        console.log('waiting...');
    }, 1000);

    await page.screenshot({path: '4.png', fullPage: true});

    const threeStarButton = 'div[data-tag=gateway-wrapper] div ul > li:nth-child(3)'
    // wait mimic user
    await page.waitForSelector('div[data-tag=gateway-wrapper] div ul > li:nth-child(3)')
    console.log('filter reviews div loaded');
    await page.waitForTimeout(2000);
    await page.click(threeStarButton);

    // wait mimic user
    // setTimeout(() => {
    //     console.log('waiting...');
    // }, 3100);
    await page.waitForTimeout(1000);


    await page.screenshot({path: '5.png', fullPage: true});

    // Get the page's HTML content
    const htmlContent = await page.content();

    // Save the HTML content to a file for analysis
    fs.writeFileSync('freezepage.html', htmlContent);

    // suspend and freeze the page
    
    await page.waitForTimeout(12000);


    await browser.close();

    return;

}


scrapeImages();