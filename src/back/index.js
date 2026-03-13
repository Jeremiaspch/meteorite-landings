// Importamos vuestras 3 APIs (las que usan express.Router)
const spaceLaunchesAPI = require("./api/spaceLaunches.js");
const meteoriteLandingsAPI = require("./api/meteorite-landings.js");
const satellitesAPI = require("./api/active-satellites.js");

function loadBackend(app) {
    const BASE_URL_API = "/api/v1";

    // --- Enchufamos las APIs ---
    app.use(BASE_URL_API + "/space-launches", spaceLaunchesAPI);
    app.use(BASE_URL_API + "/meteorite-landings", meteoriteLandingsAPI);
    app.use(BASE_URL_API + "/active-satellites", satellitesAPI);
}

module.exports = { loadBackend };