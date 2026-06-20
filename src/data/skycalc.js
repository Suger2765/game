// Astronomical calculations for star visibility

// Convert equatorial (RA hours, Dec degrees) to 3D Cartesian
export function eqToCart(raH, decDeg, radius = 500) {
  const ra = raH * Math.PI / 12;
  const dec = decDeg * Math.PI / 180;
  return [
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.sin(dec),
    radius * Math.cos(dec) * Math.sin(ra)
  ];
}

// Convert star catalog entry to 3D position
export function starToPos(star, radius = 500) {
  return eqToCart(star.ra, star.dec, radius);
}

// Get visible constellations for current time/location
// Uses simple horizon-based calculation
export function getVisibleConstellations(constellations, stars, latDeg, lonDeg, date = new Date()) {
  if (latDeg === undefined) return constellations; // Show all if no location

  const lst = localSiderealTime(date, lonDeg);
  const latRad = latDeg * Math.PI / 180;
  const visible = [];

  for (const con of constellations) {
    let visibleCount = 0;
    for (const si of con.stars) {
      const star = stars[si];
      if (!star) continue;
      const ha = (lst - star.ra * 15) * Math.PI / 180;
      const decRad = star.dec * Math.PI / 180;
      const alt = Math.asin(
        Math.sin(latRad) * Math.sin(decRad) +
        Math.cos(latRad) * Math.cos(decRad) * Math.cos(ha)
      );
      if (alt > 0) visibleCount++;
    }
    if (visibleCount >= Math.ceil(con.stars.length * 0.3)) {
      visible.push(con.id);
    }
  }
  return visible;
}

// Local Sidereal Time (simplified)
function localSiderealTime(date, lonDeg) {
  const jd = julianDay(date);
  const gmst = greenwichSiderealTime(jd);
  return (gmst + lonDeg / 15 + 24) % 24;
}

function julianDay(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + (date.getUTCHours() + date.getUTCMinutes()/60 + date.getUTCSeconds()/3600) / 24;
  const jd = (1461 * (y + 4800 + (m - 14) / 12)) / 4 +
    (367 * (m - 2 - 12 * ((m - 14) / 12))) / 12 -
    (3 * ((y + 4900 + (m - 14) / 12) / 100)) / 4 + d - 32075;
  return Math.floor(jd);
}

function greenwichSiderealTime(jd) {
  const t = (jd - 2451545.0) / 36525;
  return (280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - t * t * t / 38710000) % 360;
}

// Get user's approximate location via browser
export function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 40, lon: 116 }); // Default to Beijing
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: 40, lon: 116 })
    );
  });
}
