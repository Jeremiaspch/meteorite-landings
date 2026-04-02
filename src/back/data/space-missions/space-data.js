const path = require('path');
const Datastore = require('@seald-io/nedb');

const db = new Datastore({
    filename: path.join(process.cwd(), "data", "space-launches.db"),
    autoload: true
});

module.exports = db;