"""Direct handler test - bypasses the socket transport to isolate the ack bug."""
import sys, asyncio, time
sys.path.insert(0, '.')

from realtime.gateway import Gateway
from core.config import settings


async def main():
    gw = Gateway(settings.REDIS_URL)
    await gw.store.connect()

    identity = type('I', (), {
        'member_id': '00000000-0000-0000-0000-00000000000f',
        'firebase_uid': 'f' * 28, 'email': 't@t.in', 'role': 'rider', 'user_id': 0,
    })()

    # 1. membership check directly
    info = await gw.rooms.check_ride_membership(identity, '00000000-0000-0000-0000-000000000000')
    print('membership result:', info)

    # 2. on_ride_join with a fake ack
    ack_result = {}
    async def fake_ack(payload=None):
        ack_result.update(payload or {'NO_PAYLOAD': True})

    # simulate python-socketio: handler registered, call with sid/data/ack
    handler = gw.sio.handlers['/']['ride:join']
    print('handler is:', handler)
    await handler('test-sid', {'ride': '00000000-0000-0000-0000-000000000000'}, fake_ack)
    print('ack received:', ack_result)

    # 3. loc:p unauthorized
    await handler_loc(gw, fake_ack)
    await gw.store.close()


async def handler_loc(gw, fake_ack):
    loc_handler = gw.sio.handlers['/']['loc:p']
    await loc_handler('test-sid', {'ride': '00000000-0000-0000-0000-000000000000',
                                   'p': [[17.38, 78.48, 30, 90, int(time.time() * 1000)]]}, fake_ack)
    print('loc ack received:', fake_ack.__dict__ if hasattr(fake_ack, '__dict__') else 'see above')


asyncio.run(main())
