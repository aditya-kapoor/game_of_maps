const Router = require('koa-router');
const database = require('./database');
const cache = require('./cache');
const joi = require('joi');
const validate = require('koa-joi-validate');

const router = new Router();

const idValidator = validate({
  params: { id: joi.number().min(0).max(1000).required() }
})

const typeValidator = validate({
  params: { type: joi.string().valid(['castle', 'city', 'town', 'ruin', 'landmark', 'region']).required() }
})

router.use(cache.checkResponseCache);
router.use(cache.addResponseToCache);

router.get('/hello', async ctx => {
  ctx.body = 'Hello World'
})

router.get('/time', async(ctx) => {
  const result = await database.queryTime();
  ctx.body = result;
})

router.get('/locations/:type', typeValidator, async(ctx) => {
  const type = ctx.params.type;
  const results = await database.getLocations(type);

  const locations = results.map((row) => {
    let geojson = JSON.parse(row.st_asgeojson);
    geojson.properties = {name: row.name, type: row.type, id: row.gid};
    return geojson;
  })

  ctx.body = locations;
})

router.get('/kingdoms', async(ctx) => {
  const results = await database.getKingdomBoundaries();

  if(results.length == 0) { ctx.throw(404); }

  const boundaries = results.map((row) => {
    let geojson = JSON.parse(row.st_asgeojson);
    geojson.properties = { name: row.name, id: row.gid };
    return geojson;
  })
  ctx.body = boundaries;
})

router.get('/kingdoms/:id/size', idValidator, async(ctx) => {
  const id = ctx.params.id;
  const result = await database.getRegionSize(id);

  if(!result) { ctx.throw(404); }

  const sqKm = result.size * (10 ** -6);
  ctx.body = sqKm;
})

router.get('/kingdoms/:id/castles', idValidator, async(ctx) => {
  const regionId = ctx.params.id;
  const result = await database.countCastles(id);
  ctx.body = result || ctx.throw(404);
})

router.get('/kingdoms/:id/summary', idValidator, async(ctx) => {
  const kingdomId = ctx.params.id;
  const result = await database.getSummary('kingdoms', kingdomId);
  ctx.body = result || ctx.throw(404);
})

router.get('/locations/:id/summary', idValidator, async(ctx) => {
  const locationId = ctx.params.id;
  const result = await database.getSummary('locations', locationId);
  ctx.body = result || ctx.throw(404);
})

module.exports = router;
