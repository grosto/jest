import formatter from '../formatter';
import {DiffResult, ValuesDiff} from '../diff';
import diff from '../../../jest-diff';

describe('formatter', () => {
  test('should format basic object diff', () => {
    const obj1 = {
      key1: 1,
      key2: 2,
    };

    const obj2 = {
      key1: 1,
      key2: 3,
    };

    const diffObj: ValuesDiff = {
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
    // console.log(diff(obj1, obj2).split('\n'));
    const result = [
      'Object {',
      '    "key1": 1',
      '-   "key2": 2',
      '+   "key2": 3',
      ' }',
    ].join('\n');
    expect(formatter(diffObj)).toEqual(result);
  });
});
