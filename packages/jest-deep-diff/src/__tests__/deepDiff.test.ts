import {stringify} from 'jest-matcher-utils';
import compare, {DiffResult, ValuesDiff} from '../deepDiff';

describe('compare()', () => {
  describe('primitives', () => {
    [
      [true, false],
      [1, 2],
      [0, -0],
      [0, Number.MIN_VALUE], // issues/7941
      [Number.MIN_VALUE, 0],
      [0, new Number(0)],
      [new Number(0), 0],
      [new Number(0), new Number(1)],
      ['abc', new String('abc')],
      [new String('abc'), 'abc'],
      [/abc/gsy, /abc/g],
      [{a: 1}, {a: 2}],
      [{a: 5}, {b: 6}],
      ['banana', 'apple'],
    ].forEach(([a, b]) => {
      test(`${stringify(a)} is not equal to ${stringify(b)}`, () => {
        const expected: ValuesDiff = {
          a,
          b,
          diffResult: DiffResult.UPDATED,
        };
        expect(compare(a, b, undefined)).toEqual(expected);
      });
    });

    [
      [true, true],
      [1, 1],
      [NaN, NaN],
      // eslint-disable-next-line no-new-wrappers
      [0, new Number(0)],
      // eslint-disable-next-line no-new-wrappers
      // [new Number(0), 0],
      ['abc', 'abc'],
      // eslint-disable-next-line no-new-wrappers
      // [new String('abc'), 'abc'],
      // eslint-disable-next-line no-new-wrappers
      ['abc', new String('abc')],
      ['banana', 'banana'],
    ].forEach(([a, b]) => {
      test(`${stringify(a)} is equal to ${stringify(b)}`, () => {
        const expected: ValuesDiff = {
          a,
          b,
          diffResult: DiffResult.EQUAL,
        };
        expect(compare(a, b)).toEqual(expected);
      });
    });
    describe('complexObject', () => {
      test('plain objects', () => {
        const obj1 = {
          key1: 1,
          key2: 2,
        };

        const obj2 = {
          key1: 1,
          key2: 3,
        };

        const expected: ValuesDiff = {
          a: obj1,
          b: obj2,
          diffResult: DiffResult.UPDATED,
          path: undefined,
          propertyDiffs: [
            {
              a: obj1.key1,
              b: obj2.key1,
              diffResult: DiffResult.EQUAL,
              path: 'key1',
            },
            {
              a: obj1.key2,
              b: obj2.key2,
              diffResult: DiffResult.UPDATED,
              path: 'key2',
            },
          ],
        };

        expect(compare(obj1, obj2)).toEqual(expected);
      });
    });
  });
});
