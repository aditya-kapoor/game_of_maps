const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST);

module.exports = {
  async checkResponseCache(ctx, next) {
    const cachedResponse = await redis.get(ctx.path)
    if (cachedResponse) {
      ctx.body = JSON.parse(cachedResponse)
    } else {
      await next()
    }
  },

  async addResponseToCache (ctx, next) {
    await next()
    if (ctx.body && ctx.status === 200) {
      await redis.set(ctx.path, JSON.stringify(ctx.body))
    }
  }
}
