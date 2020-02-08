import mri from 'mri';
import fs from 'fs';
import puppeteer from 'puppeteer';

import { mapTime, getWeekDay, vCalendar, getByDay, Event } from './utils';
import { groups } from './constants';

const argv = process.argv.slice(2);
const { group } = mri(argv, {
  alias: { group: ['g'] },
  default: { group: 'M3408' },
});

if (!groups.includes(group as string)) {
  console.error('Invalid group');
  process.exit(1);
}

const url = `http://www.ifmo.ru/ru/schedule/0/${group}/raspisanie_zanyatiy_${group}.htm`;

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle0' });

  // Получение сырых данных максимально приближенных к нужному формату
  const rawData = await page.$$eval('.rasp_tabl_day .rasp_tabl', (nodes) =>
    nodes
      .map((day) => day.querySelectorAll('tr'))
      .map((lessons) => Array.from(lessons))
      .flat()
      .filter((el) => el.innerText)
      .map((el) => {
        const [lesson, timeElem, room] = ['.lesson', '.time', '.room'].map((selector) =>
          (<HTMLElement>el?.querySelector(selector))?.innerText.trim()
        );
        const [time, week] = timeElem.split('\n') as [string, 'нечетная неделя' | 'четная неделя'];
        return {
          summary: lesson.split('\n')[0],
          day: (<HTMLElement>el?.querySelector('.day'))?.innerText.trim(),
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
        isWeekOdd: ({
          'нечетная неделя': true,
          'четная неделя': false,
        }[week]) ?? false,
      }))
      .map(
        (el, index, arr) =>
          ({
            ...el,
            day: el?.day ?? arr[index - 1].day,
          })
      )
  );

  // Приведение данных к формату
  const events = rawData
    .map(({ time, ...event }) => ({ ...event, t: mapTime(time) }))
    .map(({ t, day, isWeekOdd, ...event }) => {
      const [startTime, endTime] = t;
      const [[startHour, startMinute], [endHour, endMinute]] = [startTime, endTime];
      return {
        ...event,
        // Если неделя чет или нечет, то повторяем раз в 2 недели
        interval: typeof isWeekOdd !== 'undefined' ? 2 : 1,
        byDay: getByDay(day),
        start: getWeekDay(day, isWeekOdd)
          .hour(startHour)
          .minute(startMinute)
          .local(),
        end: getWeekDay(day, isWeekOdd)
          .hour(endHour)
          .minute(endMinute)
          .local(),
      };
    })
    .map((event) => ({
      ...event,
      description: '',
      status: 'TENTATIVE', // TENTATIVE, CONFIRMED, CANCELLED
      productId: 'scheduler/ics',
    }));

  const now = new Date();

  fs.writeFileSync(
    `./calendars/result_${now.toLocaleDateString()}_${group}.ics`,
    vCalendar(...events)
  );

  await browser.close();
})();