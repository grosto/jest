import formatter from '../formatter';
import deepDiff from '../deepDiff';
import diff from '../../../jest-diff';

describe('formatter', () => {
  describe('objects', () => {
    it('should format object updated', () => {
      const a = {a: {b: {c: 5, d: 6}}};
      const b = {a: {b: {c: 6, d: 6}}};
      const expected = [
        '  Object {',
        '    "a": Object {',
        '      "b": Object {',
        '-       "c": 5,',
        '+       "c": 6,',
        '        "d": 6,',
        '      },',
        '    },',
        '  }',
      ].join('\n');

      expect(formatter(deepDiff(a, b))).toEqual(expected);
    });

    it('if property is set to undefined it should show up in diff', () => {
      const a = {a: 2};
      const b = {a: undefined};
      const expected = [
        '  Object {',
        '-   "a": 2,',
        '+   "a": undefined,',
        '  }',
      ].join('\n');

      expect(formatter(deepDiff(a, b))).toEqual(expected);
    });
    describe('multiline string as value of object property', () => {
      const expected = [
        '  Object {',
        '    "id": "J",',
        '    "points": "0.5,0.460',
        '+ 0.5,0.875',
        '  0.25,0.875",',
        '  }',
      ].join('\n');

      test('(non-snapshot)', () => {
        const a = {
          id: 'J',
          points: '0.5,0.460\n0.25,0.875',
        };
        const b = {
          id: 'J',
          points: '0.5,0.460\n0.5,0.875\n0.25,0.875',
        };

        console.log(formatter(deepDiff(a, b)));
        expect(formatter(deepDiff(a, b))).toBe(expected);
      });
    });
  });

  test('numbers', () => {
    expect(formatter(deepDiff(1, 2))).toBe('- 1\n+ 2');
  });

  test('-0 and 0', () => {
    expect(formatter(deepDiff(-0, 0))).toBe('- -0\n+ 0');
  });

  test('booleans', () => {
    expect(formatter(deepDiff(false, true))).toBe('- false\n+ true');
  });
});

describe('multiline strings', () => {
  const a = `line 1
line 2
line 3
line 4`;
  const b = `line 1
line  2
line 3
line 4`;
  const expected = [
    '  line 1',
    '- line 2',
    '+ line  2',
    '  line 3',
    '  line 4',
  ].join('\n');

  test('(unexpanded)', () => {
    expect(formatter(deepDiff(a, b))).toBe(expected);
  });
});
