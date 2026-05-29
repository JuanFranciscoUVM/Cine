const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data.json');

function readData() {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
}

function writeData(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Generate an ID
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

module.exports = {
  readData,
  writeData,
  generateId
};
