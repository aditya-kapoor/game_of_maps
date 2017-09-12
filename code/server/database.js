const postgres = require('pg');
const log = require('./logger');
const connectionString = process.env.DATABASE_URL

const client = new postgres.Client({connectionString})

client.connect().then(() => {
  log.info(`Connected to ${client.database} at ${client.host}:${client.port}`)
}).catch(log.error)

module.exports = {
  queryTime: async() => {
    const result = await client.query("select now() as now");
    return result.rows[0];
  },

  getLocations: async(type) => {
    const locationQuery = `
      select ST_AsGeoJSON(geog), name, type, gid
      from locations
      where upper(type) = upper($1);
    `
    const result = await client.query(locationQuery, [ type ]);
    return result.rows;
  },

  getKingdomBoundaries: async() => {
    const boundaryQuery = `
      select ST_AsGeoJSON(geog), name, gid
      from kingdoms;
    `
    const result = await client.query(boundaryQuery);
    return result.rows;
  },

  getRegionSize: async(id) => {
    const sizeQuery = `
      select ST_AREA(geog) as size
      from kingdoms
      where gid = $1
      limit (1)
    `
    const result = await client.query(sizeQuery, [ id ]);
    return result.rows[0]
  },

  countCastles: async(kingdomId) => {
    const query = `
      select count(*)
      from kingdoms, locations
      where ST_intersects(kingdoms.geog, locations.geog)
      and kingdoms.gid = $1
      and locations.type = 'Castle';
    `
    const result = await client.quert(query, [ kingdomId ])
    return result.rows[0]
  },

  getSummary: async(table, id) => {
    if (table !== 'kingdoms' && table !== 'locations') {
      throw new Error(`Invalid Table - ${table}`)
    }

  const summaryQuery = `
    SELECT summary, url
    FROM ${table}
    WHERE gid = $1
    LIMIT(1);`
  const result = await client.query(summaryQuery, [ id ])
  return result.rows[0]
  }
}
