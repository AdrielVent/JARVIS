from __future__ import annotations

from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_URL = "http://127.0.0.1:8787/"
OUT_DIR = ROOT / "assets"
PNG_PATH = OUT_DIR / "jarvis-local-qr.png"
SVG_PATH = OUT_DIR / "jarvis-local-qr.svg"


def gf_multiply(x: int, y: int) -> int:
    z = 0
    for i in range(8):
        if (y >> i) & 1:
            z ^= x << i
    for i in range(14, 7, -1):
        if (z >> i) & 1:
            z ^= 0x11D << (i - 8)
    return z & 0xFF


def rs_generator(degree: int) -> list[int]:
    result = [0] * degree
    result[-1] = 1
    root = 1
    for _ in range(degree):
        for j in range(degree):
            result[j] = gf_multiply(result[j], root)
            if j + 1 < degree:
                result[j] ^= result[j + 1]
        root = gf_multiply(root, 0x02)
    return result


def rs_remainder(data: list[int], degree: int) -> list[int]:
    generator = rs_generator(degree)
    result = [0] * degree
    for byte in data:
        factor = byte ^ result.pop(0)
        result.append(0)
        for i, coefficient in enumerate(generator):
            result[i] ^= gf_multiply(coefficient, factor)
    return result


def append_bits(bits: list[int], value: int, width: int) -> None:
    for i in range(width - 1, -1, -1):
        bits.append((value >> i) & 1)


def bytes_to_codewords(data: bytes) -> list[int]:
    # Version 2-L: 34 data codewords, 10 error-correction codewords.
    bits: list[int] = []
    append_bits(bits, 0b0100, 4)  # Byte mode
    append_bits(bits, len(data), 8)
    for byte in data:
        append_bits(bits, byte, 8)
    append_bits(bits, 0, min(4, 34 * 8 - len(bits)))
    while len(bits) % 8:
        bits.append(0)

    data_codewords = [
        sum(bits[i + j] << (7 - j) for j in range(8))
        for i in range(0, len(bits), 8)
    ]
    pad = [0xEC, 0x11]
    pad_index = 0
    while len(data_codewords) < 34:
        data_codewords.append(pad[pad_index % 2])
        pad_index += 1
    return data_codewords


def format_bits(mask: int) -> int:
    data = (0b01 << 3) | mask  # Error correction level L.
    rem = data << 10
    generator = 0x537
    for i in range(14, 9, -1):
        if (rem >> i) & 1:
            rem ^= generator << (i - 10)
    return ((data << 10) | rem) ^ 0x5412


def mask_bit(mask: int, x: int, y: int) -> bool:
    if mask == 0:
        return (x + y) % 2 == 0
    if mask == 1:
        return y % 2 == 0
    if mask == 2:
        return x % 3 == 0
    if mask == 3:
        return (x + y) % 3 == 0
    if mask == 4:
        return (y // 2 + x // 3) % 2 == 0
    if mask == 5:
        return (x * y) % 2 + (x * y) % 3 == 0
    if mask == 6:
        return ((x * y) % 2 + (x * y) % 3) % 2 == 0
    return ((x + y) % 2 + (x * y) % 3) % 2 == 0


def add_finder(modules: list[list[bool]], function: list[list[bool]], x: int, y: int) -> None:
    size = len(modules)
    for yy in range(y - 1, y + 8):
        for xx in range(x - 1, x + 8):
            if 0 <= xx < size and 0 <= yy < size:
                function[yy][xx] = True
                modules[yy][xx] = False
    for dy in range(7):
        for dx in range(7):
            distance = max(abs(dx - 3), abs(dy - 3))
            modules[y + dy][x + dx] = distance in {0, 1, 3}


def add_alignment(modules: list[list[bool]], function: list[list[bool]], cx: int, cy: int) -> None:
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            modules[cy + dy][cx + dx] = max(abs(dx), abs(dy)) == 2 or (dx == 0 and dy == 0)
            function[cy + dy][cx + dx] = True


def add_function_patterns(modules: list[list[bool]], function: list[list[bool]]) -> None:
    size = len(modules)
    add_finder(modules, function, 0, 0)
    add_finder(modules, function, size - 7, 0)
    add_finder(modules, function, 0, size - 7)

    for i in range(8, size - 8):
        modules[6][i] = i % 2 == 0
        modules[i][6] = i % 2 == 0
        function[6][i] = True
        function[i][6] = True

    add_alignment(modules, function, 18, 18)

    for i in range(9):
        if i != 6:
            function[8][i] = True
            function[i][8] = True
    for i in range(8):
        function[8][size - 1 - i] = True
        function[size - 1 - i][8] = True
    modules[size - 8][8] = True
    function[size - 8][8] = True


def place_format(modules: list[list[bool]], mask: int) -> None:
    size = len(modules)
    bits = format_bits(mask)

    def bit(i: int) -> bool:
        return ((bits >> i) & 1) != 0

    for i in range(6):
        modules[8][i] = bit(i)
    modules[8][7] = bit(6)
    modules[8][8] = bit(7)
    modules[7][8] = bit(8)
    for i in range(9, 15):
        modules[14 - i][8] = bit(i)

    for i in range(8):
        modules[size - 1 - i][8] = bit(i)
    for i in range(8, 15):
        modules[8][size - 15 + i] = bit(i)
    modules[size - 8][8] = True


def draw_codewords(
    base_modules: list[list[bool]],
    function: list[list[bool]],
    codewords: list[int],
    mask: int,
) -> list[list[bool]]:
    size = len(base_modules)
    modules = [row[:] for row in base_modules]
    bits = [(byte >> i) & 1 for byte in codewords for i in range(7, -1, -1)]
    bit_index = 0
    upward = True
    x = size - 1
    while x > 0:
        if x == 6:
            x -= 1
        rows = range(size - 1, -1, -1) if upward else range(size)
        for y in rows:
            for dx in range(2):
                xx = x - dx
                if function[y][xx]:
                    continue
                value = bit_index < len(bits) and bits[bit_index] == 1
                bit_index += 1
                modules[y][xx] = value ^ mask_bit(mask, xx, y)
        upward = not upward
        x -= 2
    place_format(modules, mask)
    return modules


def penalty(modules: list[list[bool]]) -> int:
    size = len(modules)
    total = 0

    for rows in (modules, [[modules[y][x] for y in range(size)] for x in range(size)]):
        for row in rows:
            run_color = row[0]
            run_len = 1
            for color in row[1:]:
                if color == run_color:
                    run_len += 1
                else:
                    if run_len >= 5:
                        total += 3 + run_len - 5
                    run_color = color
                    run_len = 1
            if run_len >= 5:
                total += 3 + run_len - 5

    for y in range(size - 1):
        for x in range(size - 1):
            color = modules[y][x]
            if modules[y][x + 1] == color and modules[y + 1][x] == color and modules[y + 1][x + 1] == color:
                total += 3

    pattern_a = [True, False, True, True, True, False, True, False, False, False, False]
    pattern_b = list(reversed(pattern_a))
    for y in range(size):
        row = modules[y]
        for x in range(size - 10):
            if row[x : x + 11] in (pattern_a, pattern_b):
                total += 40
    for x in range(size):
        col = [modules[y][x] for y in range(size)]
        for y in range(size - 10):
            if col[y : y + 11] in (pattern_a, pattern_b):
                total += 40

    black = sum(1 for row in modules for value in row if value)
    percent = black * 100 // (size * size)
    total += abs(percent - 50) // 5 * 10
    return total


def make_qr_matrix(text: str) -> list[list[bool]]:
    data = text.encode("utf-8")
    if len(data) > 32:
        raise ValueError("This generator uses QR version 2-L and supports up to 32 bytes.")
    data_codewords = bytes_to_codewords(data)
    all_codewords = data_codewords + rs_remainder(data_codewords, 10)
    size = 25
    base_modules = [[False] * size for _ in range(size)]
    function = [[False] * size for _ in range(size)]
    add_function_patterns(base_modules, function)

    candidates = [draw_codewords(base_modules, function, all_codewords, mask) for mask in range(8)]
    return min(candidates, key=penalty)


def write_png(matrix: list[list[bool]], path: Path, scale: int = 18, border: int = 4) -> None:
    size = len(matrix)
    pixels = (size + border * 2) * scale
    image = Image.new("RGB", (pixels, pixels), "#061014")
    draw = ImageDraw.Draw(image)
    accent = "#65e6f7"
    panel = "#e9fbff"
    for y, row in enumerate(matrix):
        for x, value in enumerate(row):
            if value:
                color = panel if (x + y) % 5 else accent
                draw.rectangle(
                    [
                        (x + border) * scale,
                        (y + border) * scale,
                        (x + border + 1) * scale - 1,
                        (y + border + 1) * scale - 1,
                    ],
                    fill=color,
                )
    image.save(path)


def write_svg(matrix: list[list[bool]], path: Path, border: int = 4) -> None:
    size = len(matrix)
    view_size = size + border * 2
    rects = []
    for y, row in enumerate(matrix):
        for x, value in enumerate(row):
            if value:
                color = "#e9fbff" if (x + y) % 5 else "#65e6f7"
                rects.append(f'<rect x="{x + border}" y="{y + border}" width="1" height="1" fill="{color}"/>')
    svg = "\n".join(
        [
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {view_size} {view_size}" shape-rendering="crispEdges">',
            '<rect width="100%" height="100%" fill="#061014"/>',
            *rects,
            "</svg>",
        ]
    )
    path.write_text(svg, encoding="utf-8")


def main() -> int:
    OUT_DIR.mkdir(exist_ok=True)
    matrix = make_qr_matrix(DEFAULT_URL)
    write_png(matrix, PNG_PATH)
    write_svg(matrix, SVG_PATH)
    print(f"Wrote {PNG_PATH.relative_to(ROOT)}")
    print(f"Wrote {SVG_PATH.relative_to(ROOT)}")
    print(f"Encoded URL: {DEFAULT_URL}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
