export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export const hasPath = (obj, path) => {
  return path.split('.').reduce((acc, key) => {
    return acc && acc[key] !== undefined ? acc[key] : undefined;
  }, obj) !== undefined;
};