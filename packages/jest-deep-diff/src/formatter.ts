import {DiffResult, ValuesDiff} from './diff';

const getConstructorName = (val: new (...args: Array<any>) => any) =>
  (typeof val.constructor === 'function' && val.constructor.name) || 'Object';

function formatter(diff: ValuesDiff): string {
  if (diff.diffResult === DiffResult.EQUAL) return 'no differences';

  const firstLine = getConstructorName(diff.a as any) + ' {';

  const printPropertyDiffsResults = '';

  const lastLine = ' }';

  return firstLine + printPropertyDiffsResults + lastLine;
}

export default formatter;
