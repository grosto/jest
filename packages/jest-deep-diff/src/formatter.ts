import prettyFormat = require('pretty-format');
import diffString from 'jest-diff';
import {DiffResult, ValuesDiff} from './deepDiff';

const DEFAULT_INDENT = '  ';

const COMMON_LINE_PREFIX = '  ';
const INSERTED_PREFIX = '+ ';
const DELETED_PREFIX = '- ';

// printers
function printValue(path: ValuesDiff['path'], value: unknown) {
  return `${path ? prettyFormat(path) + ': ' : ''}${prettyFormat(value)}`;
}

const printEqual = (diff: ValuesDiff, indent: string) =>
  COMMON_LINE_PREFIX + indent + printValue(diff.path, diff.a);

const printInserted = (diff: ValuesDiff, indent: string) =>
  INSERTED_PREFIX + indent + printValue(diff.path, diff.b);

const printDeleted = (diff: ValuesDiff, indent: string) =>
  DELETED_PREFIX + indent + printValue(diff.path, diff.a);

const printUpdated = (diff: ValuesDiff, indent: string) =>
  printDeleted(diff, indent) +
  (diff.path ? ',' : '') +
  '\n' +
  printInserted(diff, indent);

// formatters
const getConstructorName = (val: new (...args: Array<any>) => any) =>
  (typeof val.constructor === 'function' && val.constructor.name) || 'Object';

function formatObjectProperties(
  propertyDiffs: Array<ValuesDiff>,
  indent: string,
  formatter: Formatter,
): string {
  const nextIndent = indent + DEFAULT_INDENT;
  const result = propertyDiffs
    .map(diff => formatter(diff, nextIndent))
    .join(',\n');

  return `\n${result},\n${indent}`;
}

function formatObject(diff: ValuesDiff, indent: string) {
  const firstLine =
    COMMON_LINE_PREFIX +
    (diff.path ? indent + prettyFormat(diff.path) + ': ' : '') +
    getConstructorName(diff.a as any) +
    ' {';

  const formattedPropertyDiffsResults = diff.propertyDiffs
    ? formatObjectProperties(diff.propertyDiffs, indent, formatter)
    : ' ';

  const lastLine = COMMON_LINE_PREFIX + '}';

  return firstLine + formattedPropertyDiffsResults + lastLine;
}

type Formatter = (diff: ValuesDiff, indent?: string) => string;

const formatter: Formatter = (diff, indent = '') => {
  if (diff.diffResult === DiffResult.EQUAL) {
    if (typeof diff.path !== 'undefined') {
      return printEqual(diff, indent);
    }
    return 'no differences';
  }

  if (diff.diffResult === DiffResult.INSERTED) {
    return printInserted(diff, indent);
  }

  if (diff.diffResult === DiffResult.DELETED) {
    return printDeleted(diff, indent);
  }

  if (diff.diffResult === DiffResult.TYPE_UNEQUAL) {
    return printUpdated(diff, indent);
  }

  if (diff.diffResult === DiffResult.UPDATED) {
    if (typeof diff.propertyDiffs === 'undefined') {
      if (typeof diff.a === 'string') {
        // TODO
        const b = diff.b as string;
        const diffRs = diffString(diff.a, b, {
          aColor: (string: string) => string,
          bColor: (string: string) => string,
          commonColor: (string: string) => string,
          omitAnnotationLines: true,
        });
        if (diffRs) return printValue(diff.path, diffRs);
      }

      return printUpdated(diff, indent);
    }

    return formatObject(diff, indent);
  }

  return '';
};

export default formatter;
