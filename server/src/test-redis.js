const redis = require('./config/redis');

async function testRedis() {
    try {
        await redis.set('test-key', 'hello-from-skillswap');
        const value = await redis.get('test-key');
        console.log('✅ Redis connected successfully. Value read back:', value);
        process.exit(0);
    } catch (err) {
        console.error('❌ Redis connection failed:', err.message);
        process.exit(1);
    }
}

testRedis();