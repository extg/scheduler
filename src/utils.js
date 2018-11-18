'use strict';

const ics = require('ics');
const {pipe, split, map} = require('ramda');

const moment = require('./moment');

const mapTime = pipe(
  split('-'),
  map(split(':')),
  map(map(Number))
);

const now = () => new Date();

const createEvent = async (event) =>
  await new Promise((resolve, reject) =>
    ics.createEvent(event, (err, res) => err ? reject(err) : resolve(res)));

const createEvents = async (...args) => args.map(async event => await createEvent(event));

// isOdd(0)
// 0
// isOdd(1)
// 1
// isOdd(2)
// 0
const isOdd = num => num % 2

const getWeekDay = (day, isWeekOdd = 0 /* нечетность недели */) => {
  const currentWeek = moment().week()

  // Если текущая неделя нечетная, а нужна четная, то добавляем 1
  // или, если текущая неделя четная, а нужна нечетная, то тоже добавляем 1
  const targetWeek = isOdd(currentWeek) !== isWeekOdd ? currentWeek + 1 : currentWeek

  return moment().week(targetWeek).day(day)
}

module.exports = {
  mapTime,
  now,
  createEvent,
  createEvents,
  getWeekDay,
}
