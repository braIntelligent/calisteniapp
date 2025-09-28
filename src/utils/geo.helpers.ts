// src/utils/geo.helpers.ts
/**
 * Utilidades para manejo de coordenadas GPS y cálculos geográficos
 */

// Validar si las coordenadas GPS son válidas
export const isValidCoordinates = (latitude: number, longitude: number): boolean => {
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Calcular distancia entre dos puntos GPS usando la fórmula de Haversine
 * @param lat1 Latitud del punto 1
 * @param lon1 Longitud del punto 1
 * @param lat2 Latitud del punto 2
 * @param lon2 Longitud del punto 2
 * @returns Distancia en kilómetros
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Redondear a 2 decimales
};

// Convertir grados a radianes
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Obtener los límites de un área rectangular alrededor de un punto
 * @param latitude Latitud central
 * @param longitude Longitud central  
 * @param radiusKm Radio en kilómetros
 * @returns Objeto con los límites norte, sur, este, oeste
 */
export const getBoundingBox = (
  latitude: number,
  longitude: number,
  radiusKm: number
) => {
  const radiusInDegrees = radiusKm / 111; // Aproximación: 1 grado ≈ 111 km

  return {
    north: latitude + radiusInDegrees,
    south: latitude - radiusInDegrees,
    east: longitude + radiusInDegrees,
    west: longitude - radiusInDegrees,
  };
};

/**
 * Formatear distancia para mostrar al usuario
 * @param distanceKm Distancia en kilómetros
 * @returns String formateado (ej: "1.2 km", "850 m")
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  } else {
    return `${distanceKm.toFixed(1)} km`;
  }
};

/**
 * Verificar si un punto está dentro de un radio específico
 * @param centerLat Latitud del centro
 * @param centerLon Longitud del centro
 * @param pointLat Latitud del punto a verificar
 * @param pointLon Longitud del punto a verificar
 * @param radiusKm Radio en kilómetros
 * @returns true si el punto está dentro del radio
 */
export const isWithinRadius = (
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusKm;
};

/**
 * Obtener el centro geográfico de un conjunto de puntos
 * @param points Array de objetos con latitude y longitude
 * @returns Objeto con la latitud y longitud promedio
 */
export const getCenterPoint = (
  points: Array<{ latitude: number; longitude: number }>
) => {
  if (points.length === 0) return null;

  const sum = points.reduce(
    (acc, point) => ({
      latitude: acc.latitude + point.latitude,
      longitude: acc.longitude + point.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: sum.latitude / points.length,
    longitude: sum.longitude / points.length,
  };
};

/**
 * Coordenadas de ciudades importantes de Chile (para testing)
 */
export const CHILE_CITIES = {
  santiago: { latitude: -33.4489, longitude: -70.6693 },
  valparaiso: { latitude: -33.0361, longitude: -71.6297 },
  concepcion: { latitude: -36.8201, longitude: -73.0444 },
  temuco: { latitude: -38.7359, longitude: -72.5904 },
  antofagasta: { latitude: -23.6509, longitude: -70.3975 },
  iquique: { latitude: -20.2141, longitude: -70.1522 },
} as const;