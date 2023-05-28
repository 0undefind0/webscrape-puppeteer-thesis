const puppeteer = require('puppeteer');

const scrapeImages = async (url) => {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    await page.goto('https://www.lazada.com.ph/');

    await page.screenshot({path: '1.png'});

    // await page.type();

    // wait for 2 seconds using set timeout 
    setTimeout(() => {
        console.log('waiting for 2 seconds');
    }, 1000);

    // navigate to new url
    await page.goto('https://www.lazada.com.ph/products/true-wireless-stereo-tws-50-headset-heavy-bass-bluetooth-earphone-with-charging-box-bluetooth-50-earbuds-call-universal-stereo-waterproof-earpod-3500mah-charging-box-i2313242188-s13727987609.html');
    await page.waitForSelector('img');
    await page.screenshot({path: '2.png'});

    // Wait for the review section to load
    console.log('waiting for the review section to load');
    let target_review = await page.waitForSelector('#module_product_review > div > div')
    await page.evaluate((PageItem) => PageItem.scrollIntoView(), target_review);
    await page.waitForTimeout(1000);
    await page.screenshot({path: '3.png'});
    console.log('review section loaded');

    // Get the reviews
    const reviews = await page.evaluate( () => {
        const review_items = document.querySelectorAll('div.mod-reviews div.item');
        console.log(`----------------- v = ${typeof(review_items[0])} ------------------`)
        const review_list = Array.from(review_items).map(v => {
            // const starRating = v.querySelectorAll('div.container-star.starCtn.left img.star').length;
            const name = v.querySelector('div.middle > span:nth-child(1)').textContent.trim();
            const date = v.querySelector('div.top span.title.right').textContent.trim();
            const review = v.querySelector('div.item-content div.content').textContent.trim();

            // return {
            //     // starRating,
            //     name,
            //     date,
            //     review
            // };
            return {
                name,
                date,
                review
            };
        });
        return review_list;
    })

    console.log(reviews);


    await browser.close();

    return;

}


scrapeImages();