const redis = require('./config/redis');

redis.del('feed:first-page')
    .then(() => { console.log('✅ Cache cleared'); process.exit(0); })
    .catch((err) => { console.error(err); process.exit(1); });