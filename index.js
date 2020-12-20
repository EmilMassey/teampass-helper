#!/usr/bin/env node

const puppeteer = require('puppeteer');
const chalk = require('chalk');
const notifier = require('node-notifier');
const cacache = require('cacache')

const CACHE_PATH = '/tmp/node-teampass-helper-cache'
const CACHE_KEY_COOKIES = 'cookies'

/**
 * @param {Page} page
 *
 * @return void
 */
async function login(page) {
  try {
    const { data: cachedCookiesBuffer } = await cacache.get(CACHE_PATH, CACHE_KEY_COOKIES)

    await page.setCookie(...JSON.parse(cachedCookiesBuffer.toString()))
  } catch (e) {
    // there are no cached cookies
  }

  await page.goto('http://192.168.1.99/teampass/index.php?page=items')

  if (await page.$('#login')) {
    await page.type('#login', process.env.TEAMPASS_USER)
    await page.type('#pw', process.env.TEAMPASS_PASSWORD)
    await page.click('#but_identify_user')
    await page.waitForNavigation()
  }

  const cookies = Array.from(await page.cookies()).map(cookie => {
    cookie.expires = 999999999999
    return cookie
  })

  cacache.put(CACHE_PATH, CACHE_KEY_COOKIES, Buffer.from(JSON.stringify(cookies)))
}

(async () => {
  if (process.argv.length < 3) {
    console.error(chalk.red('You need to pass query string'))
    process.exit(1)
  }

  if (!process.env.TEAMPASS_USER || !process.env.TEAMPASS_PASSWORD) {
    console.error(chalk.red('You need to setup TEAMPASS_USER and TEAMPASS_PASSWORD environmental variables'))
    process.exit(2)
  }

  const queryString = process.argv.slice(2).join(' ')

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await login(page)

  await page.waitForSelector('#search_item')
  await page.type('#search_item', queryString)
  await page.keyboard.press('Enter')
  await page.waitForResponse(response => response.url().indexOf('find.queries.php') !== -1)
  await page.waitForTimeout(100)

  const resultsCount = await page.$$eval('#full_items_list > li', elements => elements.length)

  if (resultsCount > 0) {
    await page.click('#full_items_list > li:first-of-type')
    // TODO: wait for something specific
    await page.waitForTimeout(100)

    const title = await page.$eval('#id_label', el => el.textContent)
    const username = await page.$eval('#hid_login', el => el.value)
    await page.click('#button_quick_pw_copy')

    console.log(`${chalk.green(title)}\n\n${username}`)
    notifier.notify({
      title,
      message: 'Hasło zostało skopiowane do schowka',
      timeout: false,
    })
  } else {
    console.error(chalk.red('No results found'))
    process.exit(4)
  }

  await browser.close()
})()
