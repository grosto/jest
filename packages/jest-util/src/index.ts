/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO: Remove this export in the next major
import {JestFakeTimers as FakeTimers} from '@jest/fake-timers';
import BufferedConsole from './BufferedConsole';
import clearLine from './clearLine';
import CustomConsole from './CustomConsole';
import createDirectory from './createDirectory';
import ErrorWithStack from './ErrorWithStack';
import formatTestResults from './formatTestResults';
import getFailedSnapshotTests from './getFailedSnapshotTests';
import getConsoleOutput from './getConsoleOutput';
import installCommonGlobals from './installCommonGlobals';
import NullConsole from './NullConsole';
import isInteractive from './isInteractive';
import getCallsite from './getCallsite';
import setGlobal from './setGlobal';
import deepCyclicCopy from './deepCyclicCopy';
import convertDescriptorToString from './convertDescriptorToString';
import * as specialChars from './specialChars';
import replacePathSepForGlob from './replacePathSepForGlob';
import testPathPatternToRegExp from './testPathPatternToRegExp';
import * as preRunMessage from './preRunMessage';
import pluralize from './pluralize';

export = {
  BufferedConsole,
  Console: CustomConsole,
  ErrorWithStack,
  FakeTimers,
  NullConsole,
  clearLine,
  convertDescriptorToString,
  createDirectory,
  deepCyclicCopy,
  formatTestResults,
  getCallsite,
  getConsoleOutput,
  getFailedSnapshotTests,
  installCommonGlobals,
  isInteractive,
  pluralize,
  preRunMessage,
  replacePathSepForGlob,
  setGlobal,
  specialChars,
  testPathPatternToRegExp,
};
