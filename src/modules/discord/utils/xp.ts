export function getLevelFromGeneralXp(xp: number) {
  const approxLevel = 1 + (Math.pow(xp, 13 / 20) * 7) / 125;
  return Math.floor(Math.round(approxLevel * 100) / 100);
}

export function getXpFromGeneralLevel(level: number) {
  return Math.ceil(Math.pow(((level - 1) * 125) / 7, 20 / 13));
}

export function getLevelFromMEE6Xp(xp: number) {
  let level = 0;
  let levelXp = 0;
  while (xp >= levelXp) {
    levelXp += 5 * Math.pow(level, 2) + 50 * level + 100;
    level++;
  }
  return level - 1;
}

export function getXpFromMEE6Level(level: number) {
  const approxXp = (5 / 3) * Math.pow(level, 3) + 22.5 * Math.pow(level, 2) + (151515 / 1998) * level;
  return Math.floor(Math.round(approxXp * 100) / 100);
}
