'use strict';

const fs = require('fs');
const puppeteer = require('puppeteer');

const {mapTime, getWeekDay, vCalendar, createEvent, createEvents, getByDay} = require('./utils');

const url = 'http://www.ifmo.ru/ru/schedule/0/M3308/raspisanie_zanyatiy_M3308.htm';

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
        summary: el.querySelector('.lesson').innerText.trim().split('\n')[0],
        day: el.querySelector('.day').innerText.trim(),
        time: el.querySelector('.time').innerText.trim().split('\n')[0],
        week: el.querySelector('.time').innerText.trim().split('\n')[1],
        location: el.querySelector('.room').innerText.trim().split('\n\t').reverse().join(', '),
      }))
      .map(({week, ...el}) => {
        let isWeekOdd;
        if (week === 'нечетная неделя') isWeekOdd = 1;
        if (week === 'четная неделя') isWeekOdd = 0;
        return ({
          ...el,
          isWeekOdd,
        })
      })
      .reduce((acc, el) => acc.concat({
        ...el,
        day: el.day || acc[acc.length - 1].day,
      }), [])
  );

  // log(rawData);
  // process.exit(0);

  const events = rawData
    .map(({time, ...event}) => ({...event, t: mapTime(time)}))
    .map(({t, day, isWeekOdd, ...event}) => ({
      ...event,
      // Если неделя чет или нечет, то повторяем раз в 2 недели
      interval: typeof isWeekOdd !== 'undefined' ? 2 : 1,
      byDay: getByDay(day),
      start: getWeekDay(day, isWeekOdd).hour(t[0][0]).minute(t[0][1]).local(),
      end: getWeekDay(day, isWeekOdd).hour(t[1][0]).minute(t[1][1]).local(),
    }))
    .map(event => ({
      ...event,
      description: '',
      status: 'TENTATIVE', // TENTATIVE, CONFIRMED, CANCELLED
      productId: 'scheduler/ics',
    }))

  // log(events);
  // process.exit(0);

  fs.writeFileSync('./calendars/result5.ics', vCalendar(...events));

  await browser.close();
})();

function log(...args) {console.log(...args.map(arg => JSON.stringify(arg, null, 2))); return args[args.length - 1];}
