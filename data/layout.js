// Bring the two equipment banks towards the inspection gallery while preserving
// clear access to both sides of every machine and the entrance at the south wall.
export function galleryZ(z) {
  if (Math.abs(z) > 8.2) return z;
  return z - Math.sign(z) * Math.min(1.7, Math.abs(z) * 0.35);
}
