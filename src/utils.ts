import nanoid from 'nanoid'
import { promisify } from 'util';
import ics from 'ics';
import { pipe, split, map, ValueOfRecord } from 'ramda';

import moment from './moment';

export const mapTime = pipe(split('-'), map(split(':')), map(map(Number)));

export interface Event extends Record<string, string | number | boolean | moment.Moment> { }

export const createEvent = (event: ics.EventAttributes) =>
  promisify(ics.createEvent)(event).then((res) => (res as string).split('\r\n').join('\n'));

// const createEvent2 = async ({ productId, uid, title, timestamp, start, end, location, status }) => {
//   const result = [
//     'BEGIN:VCALENDAR',
//     'VERSION:2.0',
//     'CALSCALE:GREGORIAN',
//     `PRODID:${productId}`,
//     'METHOD:PUBLISH',
//     'X-PUBLISHED-TTL:PT1H',
//     'BEGIN:VEVENT',
//     `UID:${uid}`,
//     `SUMMARY:${title}`,
//     `DTSTAMP:${moment(timestamp).format('YYYYMMDDTHHmm')}`,
//     `DTSTART:${moment(start).format('YYYYMMDDTHHmm')}`,
//     `DTEND:${moment(end).format('YYYYMMDDTHHmm')}`,
//     `LOCATION:${location}`,
//     `STATUS:${status}`,
//     'END:VEVENT',
//     'END:VCALENDAR',
//     '',
//   ];

//   return result.join('\n');
// };

// export const createEvents = async (...args) => args.map(async (event) => await createEvent(event));

// isOdd(0)
// 0
// isOdd(1)
// 1
// isOdd(2)
// 0
const isOdd = (num: number) => Boolean(num % 2);

export const getWeekDay = (day: string | number, isWeekOdd: boolean /* нечетность недели */) => {
  let targetWeek = moment().week(); // currentWeek

  if (typeof isWeekOdd !== 'undefined') {
    // Если текущая неделя нечетная, а нужна четная, то добавляем 1
    // или, если текущая неделя четная, а нужна нечетная, то тоже добавляем 1
    targetWeek = isOdd(targetWeek) !== isWeekOdd ? targetWeek + 1 : targetWeek;
  }

  return moment()
    .week(targetWeek)
    .day(day);
};

export const getByDay = (day: string | number) =>
  ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][
  moment()
    .day(day)
    .day()
  ];

const vFormatZ = (val: string | number) => vFormat(val) + 'Z';

const vFormat = (val: string | number) => {
  const date = moment(val).format('YYYYMMDD');
  const time = moment(val).format('HHmmss');

  return `${date}T${time}`;
};

export const vEvent = <T extends Event>({
  uid = nanoid(),
  timestamp = Date.now(),
  created = Date.now(),
  location,
  description,
  status,
  summary,
  start,
  end,
  byDay,
  interval,
}: T) =>
  [
    'BEGIN:VEVENT',
    'TRANSP:OPAQUE', // OPAQUE TRANSPARENT
    `UID:${uid}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    `STATUS:${status}`,
    'SEQUENCE:0',
    `SUMMARY:${summary}`,
    `DTSTAMP:${vFormatZ(timestamp as number)}`,
    // `CREATED:${vFormat(created)}`,
    `DTSTART;TZID=Europe/Moscow:${vFormat(start as string)}`,
    `DTEND;TZID=Europe/Moscow:${vFormat(end as string)}`,
    `RRULE:FREQ=WEEKLY;INTERVAL=${interval};UNTIL=20181231T235959Z;BYDAY=${byDay};WKST=MO`, // MO TU WE TH FR SA SU
    'END:VEVENT',
  ].join('\n');

export const vCalendar = <T extends Event>(...events: Array<T>) =>
  [
    'BEGIN:VCALENDAR',
    'METHOD:PUBLISH',
    'VERSION:2.0',
    'X-WR-CALNAME:ifmo',
    'PRODID:-//Scheduler//Parser v0.1//EN',
    'X-APPLE-CALENDAR-COLOR:#1D9BF6',
    'X-WR-TIMEZONE:Europe/Moscow',
    'CALSCALE:GREGORIAN',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Moscow',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+023017',
    'DTSTART:20010101T000000',
    'TZNAME:GMT+3',
    'TZOFFSETTO:+023017',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...events.map(vEvent),
    'END:VCALENDAR',
    '',
  ].join('\n');
