'use strict';

const { createEvent, vEvent, getByDay } = require('../src/utils');

xtest('createEvent дожна возвращать ics data', async () => {
  expect.assertions(1);

  const result = await createEvent({
    timestamp: '20181118T000000Z',
    uid: 'uid',
    title: 'ТЕОРИЯ СИСТЕМ И СИСТЕМНЫЙ АНАЛИЗ (ЛАБ)',
    location: 'Кронверкский пр., д.49, лит.А, 315 АУД.',
    start: [2018, 10, 20, 8, 20],
    end: [2018, 10, 20, 9, 50],
    description: '',
    status: 'TENTATIVE',
    productId: 'scheduler/ics',
  });

  const expected = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'PRODID:scheduler/ics',
    'METHOD:PUBLISH',
    'X-PUBLISHED-TTL:PT1H',
    'BEGIN:VEVENT',
    'UID:uid',
    'SUMMARY:ТЕОРИЯ СИСТЕМ И СИСТЕМНЫЙ АНАЛИЗ (ЛАБ)',
    'DTSTAMP:20181118T000000Z',
    'DTSTART:20181020T052000Z',
    'DTEND:20181020T065000Z',
    'LOCATION:Кронверкский пр., д.49, лит.А, 315 АУД.',
    'STATUS:TENTATIVE',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ];

  expect(result.split('\n')).toEqual(expected);
});

xtest('vEvent', () => {
  console.log(
    vEvent({
      timestamp: Date.now(),
      uid: 'uid',
      summary: 'ТЕОРИЯ СИСТЕМ И СИСТЕМНЫЙ АНАЛИЗ (ЛАБ)',
      location: 'Кронверкский пр., д.49, лит.А, 315 АУД.',
      start: [2018, 10, 20, 8, 20],
      end: [2018, 10, 20, 9, 50],
      description: '',
      status: 'TENTATIVE',
      productId: 'scheduler/ics',
    }),
    '\n\n'
  );
});

test('getByDay', () => {
  // MO TU WE TH FR SA SU
  expect(getByDay('Пн')).toEqual('MO');
  expect(getByDay('Вт')).toEqual('TU');
  expect(getByDay('Ср')).toEqual('WE');
  expect(getByDay('Чт')).toEqual('TH');
  expect(getByDay('Пт')).toEqual('FR');
  expect(getByDay('Сб')).toEqual('SA');
  expect(getByDay('Вс')).toEqual('SU');
});
