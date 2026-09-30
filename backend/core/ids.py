def _to_int32(x: int) -> int:
    x &= 0xFFFFFFFF
    return x - 0x100000000 if x >= 0x80000000 else x


def member_uuid(value: str) -> str:
    # Exact port of frontend getDeterministicUuid(): JS wraps only the shift to 32 bits, not the running sum
    h = 0
    for ch in value:
        h = ord(ch) + (_to_int32(_to_int32(h) * 32) - h)
    return "00000000-0000-0000-0000-" + format(abs(h), "x").rjust(12, "0")
