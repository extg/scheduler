'use strict';

const fs = require('fs');
const ics = require('ics');
const {props} = require('bluebird');
const puppeteer = require('puppeteer');
const {pipe, split, map} = require('ramda');

const url = 'http://www.ifmo.ru/ru/schedule/0/M3308/raspisanie_zanyatiy_M3308.htm';

const $ = (...selectors) => selectors.join(' ');

const mapTime = pipe(
  split('-'),
  map(split(':')),
  map(map(Number))
);

// const createEvent = async (event) =>
//   await new Promise((resolve, reject) =>
//     ics.createEvent(event, (err, res) => err ? reject(err) : resolve(res)))

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // await page.goto(url);
  await page.goto(url, {waitUntil: 'networkidle0'});
  // await page.screenshot({path: 'example.png'});

  const rootSelector = '.rasp_tabl_day .rasp_tabl';
  const daySelector = '.day'
  const timeSelector = '.time'
  const locationSelector = '.room'
  const titleSelector = '.lesson'

  // console.log($(rootSelector, daySelector))

  // const day = await page.$eval($(rootSelector, daySelector), el => el.innerText.trim().toLowerCase());

  const $0 = (...s) => page.$eval($(rootSelector, ...s), el => el.innerText.trim());

  const now = () => new Date();

  const event = await props({
    day: $0(daySelector),
    time: $0(timeSelector).then(val => val.split('\n')[0]),
    location: $0(locationSelector).then(val => val.split('\n\t').reverse().join(', ')),
    title: $0(titleSelector).then(val => val.split('\n')[0]),
    description: '',
    status: 'CONFIRMED',
    productId: 'scheduler/ics',
    // 'RRULE:FREQ=WEEKLY;INTERVAL=2;UNTIL=20181218T205959Z;BYDAY=TU'
  }).then(({time, t = mapTime(time), ...event}) => ({
    ...event,
    start: [now().getFullYear(), now().getMonth(), now().getDay(), t[0][0], t[0][1]],
    end: [now().getFullYear(), now().getMonth(), now().getDay(), t[1][0], t[1][1]],
  })).catch(console.error)

  // console.log(JSON.stringify(mapTime(event.time)))
  console.log(JSON.stringify(event, null, 2))

  // const data = await createEvent(event);

  // console.log(data);

  // fs.writeFileSync('./calendars/result.ics', )

  await browser.close();
})();


