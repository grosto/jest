import formatter from '../formatter';
import deepDiff from '../deepDiff';
import diff from '../../../jest-diff';

describe('formatter', () => {
  describe('objects', () => {
    fit('should format object updated', () => {
      const a = {a: {b: {c: 5}}};
      const b = {a: {b: {c: 6}}};
      const expected = [
        '  Object {',
        '    "a": Object {',
        '      "b": Object {',
        '-       "c": 5,',
        '+       "c": 6,',
        '      },',
        '    },',
        '  }',
      ].join('\n');

      console.log(expected);

      expect(formatter(deepDiff(a, b))).toEqual(expected);
    });
  });
});
