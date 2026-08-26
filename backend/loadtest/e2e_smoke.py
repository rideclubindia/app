"""End-to-end gateway smoke test (run against a locally started server)."""
import sys, asyncio, time, json
sys.path.insert(0, '.')
from core.config import settings
import jwt as pyjwt, socketio

URL = 'http://localhost:8901'
token = pyjwt.encode(
    {'sub': 'e2e-test@rideclub.in', 'role': 'rider', 'uid': 'a' * 28, 'exp': int(time.time()) + 600},
    settings.JWT_SECRET, algorithm='HS256')

results = {}


async def test_unauthenticated():
    c = socketio.AsyncClient(logger=False, engineio_logger=False)
    rejected = asyncio.Event()

    @c.event
    async def connect():
        results['unauth'] = 'ACCEPTED (BAD!)'
        rejected.set()
    try:
        await c.connect(URL, transports=['websocket'])
        await asyncio.wait_for(rejected.wait(), timeout=6)
        await c.disconnect()
    except Exception as e:
        results['unauth'] = 'rejected as expected (%s)' % type(e).__name__


async def test_authenticated():
    c = socketio.AsyncClient(logger=False, engineio_logger=False)
    connected = asyncio.Event()
    server_env = {}

    @c.event
    async def connect():
        connected.set()

    @c.on('server')
    async def on_server(env):
        server_env.update(env.get('p', {}))
    try:
        await c.connect(URL, auth={'token': token, 'sessionId': 'e2e-session-1'}, transports=['websocket'])
        await asyncio.wait_for(connected.wait(), timeout=6)
        await asyncio.sleep(0.5)
        sid = str(server_env.get('sessionId', 'MISSING'))[:8]
        results['auth'] = 'connected, sessionId=%s...' % sid

        t0 = time.perf_counter()
        await c.call('echo', {'t': t0}, timeout=5)
        results['echo_rtt_ms'] = round((time.perf_counter() - t0) * 1000, 1)

        ack = await c.call('ride:join', {'ride': '00000000-0000-0000-0000-000000000000'}, timeout=8)
        results['join_nonexistent'] = 'ok=%s code=%s' % (ack.get('ok'), ack.get('code'))

        ack2 = await c.call('loc:p', {'ride': '00000000-0000-0000-0000-000000000000',
                                      'p': [[17.38, 78.48, 30, 90, int(time.time() * 1000)]]}, timeout=8)
        results['loc_unauthorized'] = 'ok=%s code=%s' % (ack2.get('ok'), ack2.get('code'))

        ack3 = await c.call('auth:refresh', {'token': 'garbage'}, timeout=5)
        results['bad_refresh'] = 'ok=%s code=%s' % (ack3.get('ok'), ack3.get('code'))
        await c.disconnect()
    except Exception as e:
        results['auth'] = 'FAILED: %s %s' % (type(e).__name__, e)


async def main():
    await test_unauthenticated()
    await test_authenticated()
    print(json.dumps(results, indent=2))

asyncio.run(main())
