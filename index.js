#!/usr/bin/env node

const puppeteer = require('puppeteer');
const chalk = require('chalk');
const notifier = require('node-notifier');

// TODO: try to skip login if cookie set and session still active

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
  await page.goto('http://192.168.1.99/teampass/index.php')

  await page.type('#login', process.env.TEAMPASS_USER)
  await page.type('#pw', process.env.TEAMPASS_PASSWORD)
  await page.click('#but_identify_user')
  await page.waitForNavigation()

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
