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
    await page.goto(url);
    // await page.goto('https://www.lazada.com.ph/products/lenovo-thinkplus-lp19-in-ear-true-wireless-earbuds-bluetooth-51-earphone-with-microphone-enc-noise-cancelling-hifi-sports-waterproof-headphones-bass-i3649062632-s19063103193.html');
    await page.waitForSelector('img');
    await page.screenshot({path: '2.png'});

    // // Click the title to focus
    // await page.waitForSelector('pdp-mod-product-badge-title');
    // await page.click('pdp-mod-product-badge-title');

    // Click anywhere on the page
    await page.waitForTimeout(1000);
    await page.mouse.click(200, 100); // Replace with the desired coordinates

    console.log('waiting for the review section to load');

    // Wait for the review section to load
    const scrollTo = async (target_review_selector) => {
        const target_review = await page.waitForSelector(target_review_selector);
        await page.evaluate((PageItem) => PageItem.scrollIntoView(), target_review);
        console.log('scrolling...');
    }

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
                "dateiso_scraped": new Date().toISOString(),
                review
            };
        });
        console.log('scraping reviews in the page')
        return review_list;
    }

    // Check for slider
    // const sliderSelector = '#nc_1_n1z.nc_iconfont.btn_slide'
    const solveSliderCaptcha = async () => {
        await page.waitForSelector('iframe#baxia-dialog-content', {timeout: 2000})
            .then(async () => {
                console.log('performing captcha; slider found');
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

                        const sliderButtonBoundingBox = await slider.boundingBox();

                        // Calculate the desired position for sliding the slider
                        const slideAmount = 600; // Adjust the slide amount as needed

                        // Calculate the target coordinates for sliding
                        const startX = sliderButtonBoundingBox.x;
                        const startY = sliderButtonBoundingBox.y + sliderButtonBoundingBox.height / 2;
                        await page.waitForTimeout(400);

                        // Simulate mouse movements to slide the slider
                        await page.waitForTimeout(1000);
                        await page.mouse.move(startX, startY);
                        await page.waitForTimeout(400);
                        await page.mouse.down();
                        await page.waitForTimeout(400);

                        const steps = 80; // Number of steps for the mouse movement
                        const deltaY = slideAmount / steps; // Amount to move on the y-axis per step
                        let currentY = startY;

                        for (let i = 0; i < steps; i++) {
                            const x = startX + slideAmount * (i + 1) / steps;
                            const y = currentY + deltaY * Math.sin((i / steps) * Math.PI); // Apply sine function for smooth movement on the y-axis

                            await page.mouse.move(x, y);
                            await page.waitForTimeout(10); // Adjust the timeout as needed for the desired speed

                            currentY = y;
                        }

                        await page.waitForTimeout(400);
                        await page.mouse.up();

                        console.log('Slider automatically slid successfully');
                    })
                    .catch(() => {
                        console.log('slider disappeared; maybe it was already taken cared of; if not, then the captcha failed');
                    });
            })
            .catch(() => {
                console.log('no captcha; slider not found');
            })
            
    }

    const reviewList = [];

    // scrape the reviews of default page
    let reviews;
    // ! SCRAPE THE FIRST PAGE OF FIRST LOAD
    // reviews = await page.evaluate( scrapeReview )
    // console.log(reviews);
    // reviewList.push(...reviews);

    // open filter section function
    const openFilterSection = async () => {
        // click the filter button
        const filterSelector = 'div.pdp-mod-filterSort > div.oper:nth-child(2)'
        await page.waitForSelector(filterSelector);
        try {
            await page.click(filterSelector);
            console.log('filter button opened');
        } catch (error) {
            console.log('filter button not found');
            return;
        }
    }

    await openFilterSection();

    await solveSliderCaptcha();


    // wait
    setTimeout(() => {
        console.log('waiting...');
    }, 1000);

    await page.screenshot({path: '4.png', fullPage: true});

    // apply star filter
    const selectStarFiler = async (star = 0) => {
        // 5 star = nth-child(2)
        // 4 star = nth-child(3)
        // 3 star = nth-child(4)
        // 2 star = nth-child(5)
        // 1 star = nth-child(6)
        // all stars = nth-child(1)
        const starCalculation = 7 - star;
        if (starCalculation < 1 || starCalculation > 6) {
            console.log('invalid star filter');
            return;
        }
        if (star === 0) {
            starCalculation = 1; // all stars
        }
        const starSelector = `div[data-tag=gateway-wrapper] div ul > li:nth-child(${starCalculation})`
        await page.waitForSelector(starSelector)
        console.log('filter reviews div loaded');
        await page.waitForTimeout(2000);
        await page.hover(starSelector);
        try {
            await page.click(starSelector);
            console.log(`SET FILTER to ==> ${star} star filter`);
        } catch (error) {
            console.log(`error clicking ${star} star filter`);
        }
    
        await solveSliderCaptcha();
        await page.waitForTimeout(800);
    }

    await selectStarFiler(3);

    await page.screenshot({path: '5.png', fullPage: true});

    // Get the page's HTML content
    // const htmlContent = await page.content();

    // ! // Save the HTML content to a file for analysis
    // // fs.writeFileSync('freezepage.html', htmlContent);
    await page.waitForTimeout(2000);


    // // scrape the 4 star reviews
    // reviews = await page.evaluate( scrapeReview )
    // console.log(reviews);
    // reviewList.push(...reviews);
    // await page.waitForTimeout(1000);

    // click the next button function
    const clickNextButton = async () => {
        // click next button
        const nextButtonSelector = 'div.next-pagination button.next' // #module_product_review > div > div > div:nth-child(3) > div.next-pagination.next-pagination-normal.next-pagination-arrow-only.next-pagination-medium.medium.review-pagination > div > button.next-btn.next-btn-normal.next-btn-medium.next-pagination-item.next
        await page.waitForSelector(nextButtonSelector)
        const nextButton = await page.$(nextButtonSelector);
        await nextButton.hover(nextButtonSelector);
        await nextButton.click(nextButtonSelector, {delay: 200}).then(() => {
            console.log('next button clicked');
        }).catch(() => {
            console.log('next button not clicked');
        });
        await page.waitForTimeout(500);
    }
    
    // scrapeAllPages function
    const scrapeAllPages = async (max_pages=10) => {
        let pageNumber = 1;
        // click next button until it is disabled
        let isNextButtonDisabled = false;

        await page.waitForTimeout(200);

        // get the first page
        reviews = await page.evaluate( scrapeReview )
        console.log(reviews);
        reviewList.push(...reviews);
        
        // get the succeeding pages
        while ((!isNextButtonDisabled) && (pageNumber < max_pages)) {
            await page.waitForTimeout(200);

            await clickNextButton();
            await page.waitForTimeout(1000);
            isNextButtonDisabled = await page.waitForSelector('div.next-pagination button.next[disabled]', {timeout: 800})
                .then(() => {
                    console.log('next button disabled');
                    return true;
                })
                .catch(() => {
                    console.log('continuing to next page');
                    return false;
                });

            reviews = await page.evaluate( scrapeReview )
            console.log(reviews);
            reviewList.push(...reviews);
            
            pageNumber++;
        } 
    }

    // await scrapeAllPages();

    await openFilterSection();
    await page.waitForTimeout(1000);
    await selectStarFiler(5);
    await page.waitForTimeout(1000);
    await scrapeAllPages();
    await page.waitForTimeout(1000);

    await openFilterSection();
    await page.waitForTimeout(1000);
    await selectStarFiler(4);
    await page.waitForTimeout(1000);
    await scrapeAllPages();
    await page.waitForTimeout(1000);

    await openFilterSection();
    await page.waitForTimeout(1000);
    await selectStarFiler(3);
    await page.waitForTimeout(1000);
    await scrapeAllPages();
    await page.waitForTimeout(1000);

    await openFilterSection();
    await page.waitForTimeout(1000);
    await selectStarFiler(2);
    await page.waitForTimeout(1000);
    await scrapeAllPages();
    await page.waitForTimeout(1000);

    await openFilterSection();
    await page.waitForTimeout(1000);
    await selectStarFiler(1);
    await page.waitForTimeout(1000);
    await scrapeAllPages();
    await page.waitForTimeout(1000);

    // await clickNextButton();

    // await solveSliderCaptcha();

    // await page.waitForTimeout(2000);

    // // scrape the 4 star reviews page 2
    
    // reviews = await page.evaluate( scrapeReview )
    // console.log(reviews);
    // reviewList.push(...reviews);

    await page.screenshot({path: '6.png', fullPage: true});


    // suspend and freeze the page
    await page.waitForTimeout(22000);

    console.log('closing browser');
    await browser.close();

    return reviewList;

}


scrapeImages('https://www.lazada.com.ph/products/lenovo-thinkplus-lp19-in-ear-true-wireless-earbuds-bluetooth-51-earphone-with-microphone-enc-noise-cancelling-hifi-sports-waterproof-headphones-bass-i3649062632-s19063103193.html')
    .then((reviews) => {
        console.log(reviews);
        console.log('Saving Reviews to json file for reference sample ONLY');
        fs.writeFileSync('reviews.json', JSON.stringify(reviews));
    })
    .catch((err) => {
        console.log(err);
    });