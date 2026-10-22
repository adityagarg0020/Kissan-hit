const app = require('../backend/src/server');
const dataService = require('../backend/src/services/dataService');

let initialized = false;

module.exports = async (req, res) => {
  if (!initialized) {
    await dataService.initialize();
    initialized = true;
  }
  return app(req, res);
};
