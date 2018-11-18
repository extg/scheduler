'use strict';

const fs = require('fs');
const ics = require('ics');
const {props} = require('bluebird');
const puppeteer = require('puppeteer');
const {pipe, split, map} = require('ramda');

const url = 'http://www.ifmo.ru/ru/schedule/0/M3308/raspisanie_zanyatiy_M3308.htm';

const mapTime = pipe(
  split('-'),
  map(split(':')),
  map(map(Number))
);

const createEvent = async (event) =>
  await new Promise((resolve, reject) =>
    ics.createEvent(event, (err, res) => err ? reject(err) : resolve(res)));

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, {waitUntil: 'networkidle0'});

  const rawData = await page.$$eval('.rasp_tabl_day .rasp_tabl', nodes =>
    nodes
      .map(day => day.querySelectorAll('tr'))
      .map(lessons => [].slice.call(lessons))
      .flat()
      .filter(el => el.innerText)
      .map(el => ({
        title: el.querySelector('.lesson').innerText.trim().split('\n')[0],
        day: el.querySelector('.day').innerText.trim(),
        time: el.querySelector('.time').innerText.trim().split('\n')[0],
        week: el.querySelector('.time').innerText.trim().split('\n')[1],
        location: el.querySelector('.room').innerText.trim().split('\n\t').reverse().join(', '),
      }))
      .reduce((acc, val) => acc.concat({
        ...val,
        day: val.day || acc[acc.length - 1].day,
      }), [])
  );


  log(rawData)

  // console.log($(rootSelector, daySelector))
  process.exit(0)
  // const day = await page.$eval($(rootSelector, daySelector), el => el.innerText.trim().toLowerCase());

  const $0 = (...s) => page.$eval($(rootSelector, ...s), el => el.innerText.trim());
  // const $$0 = (...s) => page.$$eval($(rootSelector, ...s), el => el.innerText.trim());

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
  }).then(({time, t = mapTime(time), day, ...event}) => ({
    ...event,
    start: [now().getFullYear(), now().getMonth() + 1, now().getDate(), t[0][0], t[0][1]],
    end: [now().getFullYear(), now().getMonth() + 1, now().getDate(), t[1][0], t[1][1]],
  })).catch(console.error)

  // console.log(JSON.stringify(mapTime(event.time)))
  console.log(JSON.stringify(event, null, 2))

  const data = await createEvent(event);

  // console.log(data);

  fs.writeFileSync('./calendars/result.ics', data);

  await browser.close();
})();

function log(...args) {console.log(...args.map(arg => JSON.stringify(arg, null, 2))); return args[args.length - 1];}
