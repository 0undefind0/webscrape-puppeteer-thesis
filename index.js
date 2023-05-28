const puppeteer = require('puppeteer');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config(); // load env variables from .env file

const scrapeImages = async (url) => {
    // const auth = `${process.env.BRIGHTUSERNAME}:${process.env.BRIGHTPASSWORD}`;

    const browser = await puppeteer.launch({
        headless: false,
        // browserWSEndpoint: `wss://${auth}@zproxy.lum-superproxy.io:9222`
        defaultViewport: { width: 1280, height: 720 },
    });
    const page = await browser.newPage();

    // By setting navigator.webdriver to false, this code is attempting to hide the fact that the browser is being controlled by WebDriver, 
    // which can help bypass some automated browser testing detection mechanisms.
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });
    });

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

    // navigate to product url
    await page.goto('https://www.lazada.com.ph/products/lenovo-thinkplus-lp19-in-ear-true-wireless-earbuds-bluetooth-51-earphone-with-microphone-enc-noise-cancelling-hifi-sports-waterproof-headphones-bass-i3649062632-s19063103193.html');
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
    const scrollTo = ( async (target_review_selector) => {
        const target_review = await page.waitForSelector(target_review_selector);
        await page.evaluate((PageItem) => PageItem.scrollIntoView(), target_review);
    })

    await scrollTo('#module_product_review > div > div');
    // let target_review = await page.waitForSelector('#module_product_review > div > div')
    // await page.evaluate((PageItem) => PageItem.scrollIntoView(), target_review);
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
            const stars = v.querySelectorAll('img[src="//laz-img-cdn.alicdn.com/tfs/TB19ZvEgfDH8KJjy1XcXXcpdXXa-64-64.png"]').length;
            return {
                name,
                stars,
                date,
                "date_scraped_iso": new Date().toISOString(),
                review
            };
        });
        return review_list;
    }

    // Check for slider
    // const sliderSelector = '#nc_1_n1z.nc_iconfont.btn_slide'
    const solveSliderCaptcha = async () => {
        await page.waitForSelector('iframe#baxia-dialog-content', {timeout: 2000})
            .then(async () => {
                console.log('slider found');
                console.log('waiting for human interference');
                await page.waitForTimeout(4000);
                console.log('human interference window over');

                
                await page.$('iframe')
                    .then(async (frame) => {
                        console.log("Accessing iframe");
                        const sliderFrame = await frame.contentFrame();
                        const sliderSelector = '#nc_1_n1z.nc_iconfont.btn_slide'
                        const slider = await sliderFrame.waitForSelector(sliderSelector);
                        await sliderFrame.click('#nc_1_n1z.nc_iconfont.btn_slide');
                        console.log('clicked slider');

                        console.log( await slider.boundingBox());
                        const sliderButtonBoundingBox = await slider.boundingBox();

                        // Calculate the desired position for sliding the slider
                        const slideAmount = 600; // Adjust the slide amount as needed

                        // Calculate the target coordinates for sliding
                        const startX = sliderButtonBoundingBox.x;
                        const startY = sliderButtonBoundingBox.y + sliderButtonBoundingBox.height / 2;
                        await page.waitForTimeout(400);
                        // Simulate mouse movements to slide the slider
                        await page.mouse.move(startX, startY);
                        await page.mouse.down();
                        await page.mouse.move(startX + slideAmount, startY, { steps: 80 }); // Adjust the number of steps as needed
                        await page.mouse.up();

                        console.log('Slider slid successfully');

                    })
                    .catch(() => {
                        console.log('slider does not exist; maybe it was already taken cared of');
                    });
            })
            .catch(() => {
                console.log('slider not found');
            })
            
    }

    // scrape the reviews of default page
    let reviews;
    reviews = await page.evaluate( scrapeReview )
    console.log(reviews);

    // click the filter button
    const filterSelector = 'div.pdp-mod-filterSort > div.oper:nth-child(2)'
    await page.waitForSelector(filterSelector);
    // await scrollTo(filterSelector)
    await page.click(filterSelector);

    await solveSliderCaptcha();


    // wait
    setTimeout(() => {
        console.log('waiting...');
    }, 1000);

    await page.screenshot({path: '4.png', fullPage: true});

    // select 4 star from the filter
    const fourStarButton = 'div[data-tag=gateway-wrapper] div ul > li:nth-child(6)'
    await page.waitForSelector(fourStarButton)
    console.log('filter reviews div loaded');
    await page.waitForTimeout(2000);
    await page.hover(fourStarButton);
    await page.click(fourStarButton); // select the 4 star review filter

    await solveSliderCaptcha();

    await page.waitForTimeout(1000);

    await page.screenshot({path: '5.png', fullPage: true});

    // Get the page's HTML content
    const htmlContent = await page.content();

    // Save the HTML content to a file for analysis
    fs.writeFileSync('freezepage.html', htmlContent);
    await page.waitForTimeout(2000);


    // scrape the 4 star reviews
    reviews = await page.evaluate( scrapeReview )
    console.log(reviews);
    // click next button
    await page.waitForTimeout(1000);
    const nextButtonSelector = 'div.next-pagination button.next' // #module_product_review > div > div > div:nth-child(3) > div.next-pagination.next-pagination-normal.next-pagination-arrow-only.next-pagination-medium.medium.review-pagination > div > button.next-btn.next-btn-normal.next-btn-medium.next-pagination-item.next
    await page.waitForSelector(nextButtonSelector)
    const nextButton = await page.$(nextButtonSelector);
    // await scrollTo(nextButtonSelector);
    await nextButton.hover(nextButtonSelector);
    await nextButton.click(nextButtonSelector, {delay: 200}).then(() => {
        console.log('next button clicked');
    }).catch(() => {
        console.log('next button not clicked');
    });
    // console.log('next button clicked');

    await solveSliderCaptcha();

    await page.waitForTimeout(2000);

    // scrape the 4 star reviews page 2
    
    reviews = await page.evaluate( () => {
        const review_items = document.querySelectorAll('div.mod-reviews div.item');
        const review_list = Array.from(review_items).map(v => {
            const name = v.querySelector('div.middle > span:nth-child(1)').textContent.trim();
            const date = v.querySelector('div.top span.title.right').textContent.trim();
            const review = v.querySelector('div.item-content div.content').textContent.trim();
            const stars = v.querySelectorAll('img[src="//laz-img-cdn.alicdn.com/tfs/TB19ZvEgfDH8KJjy1XcXXcpdXXa-64-64.png"]').length;
            return {
                name,
                stars,
                date,
                "date_scraped_iso": new Date().toISOString(),
                review
            };
        });
        return review_list;
    } )
    console.log(reviews);

    await page.screenshot({path: '6.png', fullPage: true});


    // suspend and freeze the page
    await page.waitForTimeout(22000);

    console.log('closing browser');
    await browser.close();

    return reviews;

}


scrapeImages()
    .then((reviews) => {
        console.log(reviews);
    });