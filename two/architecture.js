// Measurements in the building's local frame. The entrance faces positive Z.
export function roomPlan(b) {
  const pagoda = b.kind === 'pagoda';
  const width = b.w * (pagoda ? 0.73 : 1);
  const depth = b.d * (pagoda ? 0.73 : 1);
  const door = Math.min(width * 0.46, 3.25);
  const panel = (width - door) / 2;
  const floor = 0.48;
  const ceiling = pagoda ? 3.05 : b.wall + 0.1;
  const walls = [
    { u: 0, v: -depth / 2, width, depth: 0.18 },
    ...[-1, 1].flatMap((sign) => [
      { u: (sign * (door + panel)) / 2, v: depth / 2, width: panel, depth: 0.18 },
      { u: (sign * width) / 2, v: 0, width: 0.18, depth },
    ]),
  ];
  return { width, depth, door, floor, ceiling, walls };
}
