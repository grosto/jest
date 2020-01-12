import prettyFormat = require('pretty-format');
import {DiffResult, ValuesDiff} from './deepDiff';

const DEFAULT_INDENT = '  ';

// printers
function printValue(path: ValuesDiff['path'], value: unknown) {
  return `${path ? prettyFormat(path) + ': ' : ''}${prettyFormat(value)}`;
}

const printEqual = (diff: ValuesDiff, indent: string) =>
  ' ' + indent + printValue(diff.path, diff.a);

const printInserted = (diff: ValuesDiff, indent: string) =>
  '-' + indent + printValue(diff.path, diff.b);

const printDeleted = (diff: ValuesDiff, indent: string) =>
  '+' + indent + printValue(diff.path, diff.a);

const printUpdated = (diff: ValuesDiff, indent: string) =>
  printInserted(diff, indent) +
  (diff.path ? ',' : '') +
  '\n' +
  printDeleted(diff, indent);

// formatters
const getConstructorName = (val: new (...args: Array<any>) => any) =>
  (typeof val.constructor === 'function' && val.constructor.name) || 'Object';

function formatObjectProperties(
  propertyDiffs: Array<ValuesDiff>,
  indent: string,
  formatter: Formater,
): string {
  const nextIndent = indent + DEFAULT_INDENT;
  const result = propertyDiffs
    .map(diff => formatter(diff, nextIndent))
    .join(',\n');

  return `\n${result},\n${indent}`;
}

function formatObject(diff: ValuesDiff, indent: string) {
  const firstLine =
    (diff.path ? indent + ' ' + prettyFormat(diff.path) + ': ' : '') +
    getConstructorName(diff.a as any) +
    ' {';

  const formattedPropertyDiffsResults = diff.propertyDiffs
    ? formatObjectProperties(diff.propertyDiffs, indent, formatter)
    : ' ';

  const lastLine = diff.path ? ' }' : '}';

  return firstLine + formattedPropertyDiffsResults + lastLine;
}

type Formater = (diff: ValuesDiff, indent?: string) => string;

const formatter: Formater = (diff, indent = '') => {
  if (diff.diffResult === DiffResult.EQUAL) {
    if (typeof diff.path !== 'undefined') {
      return printEqual(diff, indent);
    }
    return 'no differences';
  }

  if (diff.propertyDiffs) {
  }

  if (diff.diffResult === DiffResult.INSERTED) {
    return printInserted(diff, indent);
  }

  if (diff.diffResult === DiffResult.DELETED) {
    return printDeleted(diff, indent);
  }

  if (diff.diffResult === DiffResult.UPDATED) {
    if (typeof diff.propertyDiffs === 'undefined') {
      return printUpdated(diff, indent);
    }

    return formatObject(diff, indent);
  }

  return '';
};

export default formatter;
