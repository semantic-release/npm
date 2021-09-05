const test = require('ava');
const {mergeErrors} = require('../lib/merge-errors');

test('Merge an array of errors to give list of errors', (t) => {
  const arrayOfErrors = ['error2', 'error3'];
  const errorsList = ['error1'];

  mergeErrors(errorsList, arrayOfErrors)

  t.deepEqual(errorsList, ['error1', 'error2', 'error3']);
});

test('Merge a single error to give list of errors', (t) => {
  const singleError = 'error2';
  const errorsList = ['error1'];

  mergeErrors(errorsList, singleError)

  t.deepEqual(errorsList, ['error1', 'error2']);
});