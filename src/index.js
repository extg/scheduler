'use strict';

import mri from 'mri';
const fs = require('fs');
const puppeteer = require('puppeteer');
const { mapTime, getWeekDay, vCalendar, createEvent, createEvents, getByDay } = require('./utils');
import { groups } from './constants';

const argv = process.argv.slice(2);
const { group } = mri(argv, {
  alias: {
    group: ['g'],
  },
  default: {
    group: 'M3408',
  },
});

if (!groups.includes(group)) {
  console.error('Invalid group');
  process.exit(1);
}

const url = `http://www.ifmo.ru/ru/schedule/0/${group}/raspisanie_zanyatiy_${group}.htm`;

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle0' });

  // Получение сырых данных максимально приближенных к нужному формату
  const rawData = await page.$$eval('.rasp_tabl_day .rasp_tabl', (nodes) =>
    nodes
      .map((day) => day.querySelectorAll('tr'))
      .map((lessons) => [].slice.call(lessons))
      .flat()
      .filter((el) => el.innerText)
      .map((el) => {
        const [lesson, time, room] = ['.lesson', '.time', '.room'].map((selector) =>
          el.querySelector(selector).innerText.trim()
        );
        const [time, week] = time.innerText.trim().split('\n');
        return {
          summary: lesson.split('\n')[0],
          day: el.querySelector('.day').innerText.trim(),
          time,
          week,
          location: room
            .split('\n\t')
            .reverse()
            .join(', '),
        };
      })
      .map(({ week, ...el }) => ({
        ...el,
        isWeekOdd: {
          'нечетная неделя': 1,
          'четная неделя': 0,
        }[week],
      }))
      .reduce(
        (acc, el) =>
          acc.concat({
            ...el,
            day: el.day || acc[acc.length - 1].day,
          }),
        []
      )
  );

  // Приведение данных к формату
  const events = rawData
    .map(({ time, ...event }) => ({ ...event, t: mapTime(time) }))
    .map(({ t, day, isWeekOdd, ...event }) => ({
      ...event,
      // Если неделя чет или нечет, то повторяем раз в 2 недели
      interval: typeof isWeekOdd !== 'undefined' ? 2 : 1,
      byDay: getByDay(day),
      start: getWeekDay(day, isWeekOdd)
        .hour(t[0][0])
        .minute(t[0][1])
        .local(),
      end: getWeekDay(day, isWeekOdd)
        .hour(t[1][0])
        .minute(t[1][1])
        .local(),
    }))
    .map((event) => ({
      ...event,
      description: '',
      status: 'TENTATIVE', // TENTATIVE, CONFIRMED, CANCELLED
      productId: 'scheduler/ics',
    }));

  fs.writeFileSync(
    `./calendars/result_${new Date().toLocaleDateString()}_${group}.ics`,
    vCalendar(...events)
  );

  await browser.close();
})();
