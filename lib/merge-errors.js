const mergeErrors = (listOfErrors, errors) => {
  if (Array.isArray(errors)) {
    listOfErrors.push(...errors);
  } else {
    listOfErrors.push(errors);
  }
};

module.exports = {mergeErrors};