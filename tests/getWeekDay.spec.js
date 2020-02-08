'use strict';

const tk = require('timekeeper');

const { getWeekDay } = require('../src/utils');

// Odd week
// 5 Mon
// 6 Tue
// 7 Wed
// 8 Thu
// 9 Fri
// 10 Sat
// 11 Sun

// Even week
// 12 Mon
// 13 Tue
// 14 Wed
// 15 Thu
// 16 Fri
// 17 Sat
// 18 Sun

// Odd week
// 19 Mon
// 20 Tue
// 21 Wed
// 22 Thu
// 23 Fri
// 24 Sat
// 25 Sun

describe('Сейчас четная неделя', () => {
  beforeEach(() => {
    tk.travel(new Date('2018-11-12T00:00:00.000Z')); // 12 Oct, Mon, Even week
  });

  afterAll(() => {
    tk.reset();
  });

  it('нужен ближайший пн на четной (день в день)', () => {
    expect(getWeekDay('Пн', 0).toString()).toEqual('Mon Nov 12 2018 03:00:00 GMT+0300');
  });

  it('нужен ближайший пн на нечетной (день в день)', () => {
    expect(getWeekDay('Пн', 1).toString()).toEqual('Mon Nov 19 2018 03:00:00 GMT+0300');
  });

  it('нужен ближайший вт на четной (день после)', () => {
    expect(getWeekDay('Вт', 0).toString()).toEqual('Tue Nov 13 2018 03:00:00 GMT+0300');
  });

  it('нужен ближайший вт на нечетной (день после)', () => {
    expect(getWeekDay('Вт', 1).toString()).toEqual('Tue Nov 20 2018 03:00:00 GMT+0300');
  });
});

describe('Сейчас нечетная неделя', () => {
  beforeEach(() => {
    tk.travel(new Date('2018-11-07T00:00:00.000Z')); // 7 Oct, Wed, Odd week
  });

  afterAll(() => {
    tk.reset();
  });

  it('нужен ближайший вт на четной (день до)', () => {
    expect(getWeekDay('Вт', 0).toString()).toEqual('Tue Nov 13 2018 03:00:00 GMT+0300');
  });

  it('нужен ближайший вт на нечетной (день до)', () => {
    expect(getWeekDay('Вт', 1).toString()).toEqual('Tue Nov 06 2018 03:00:00 GMT+0300');
  });
});
