function normalize(str) {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

module.exports = { normalize };