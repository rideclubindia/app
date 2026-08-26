import sys, asyncio, re, time
sys.path.insert(0, '.')
import redis.asyncio as aioredis

LUA = open('realtime/ratelimit.py').read()
lua = re.search(r'_TOKEN_BUCKET_LUA = """(.*?)"""', LUA, re.S).group(1)


async def main():
    r = aioredis.from_url('redis://localhost:6379/0', decode_responses=True)
    script = r.register_script(lua)
    res = await script(keys=['rl:msg:probe'], args=[40, 20, int(time.time() * 1000), 1])
    print('script result:', res, type(res))
    await r.delete('rl:msg:probe')

    from realtime.ratelimit import TokenBucketLimiter
    lim = TokenBucketLimiter(r, 40, 20, 'rl:test')
    results = [await lim.allow('probe1') for _ in range(5)]
    print('5 allows:', results)
    await r.aclose()

asyncio.run(main())
