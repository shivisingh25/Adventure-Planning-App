import { Milestone, OptimizedRoute, RouteSegment } from '@/types';

// Haversine formula for calculating distance between two points
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Distance in kilometers
}

// Calculate distance matrix between all milestones
function calculateDistanceMatrix(milestones: Milestone[]): number[][] {
  const matrix: number[][] = [];
  
  for (let i = 0; i < milestones.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < milestones.length; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        const distance = calculateDistance(
          milestones[i].coordinates.latitude,
          milestones[i].coordinates.longitude,
          milestones[j].coordinates.latitude,
          milestones[j].coordinates.longitude
        );
        matrix[i][j] = distance;
      }
    }
  }
  
  return matrix;
}

// Nearest Neighbor TSP algorithm
function nearestNeighborTSP(distanceMatrix: number[], startIndex: number = 0): number[] {
  const n = Math.sqrt(distanceMatrix.length);
  const visited = new Set<number>();
  const route = [startIndex];
  visited.add(startIndex);
  
  let currentCity = startIndex;
  
  while (visited.size < n) {
    let nearestCity = -1;
    let nearestDistance = Infinity;
    
    for (let i = 0; i < n; i++) {
      if (!visited.has(i)) {
        const distance = distanceMatrix[currentCity * n + i];
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestCity = i;
        }
      }
    }
    
    if (nearestCity !== -1) {
      route.push(nearestCity);
      visited.add(nearestCity);
      currentCity = nearestCity;
    }
  }
  
  return route;
}

// 2-opt optimization algorithm
function twoOptOptimization(route: number[], distanceMatrix: number[]): number[] {
  const n = Math.sqrt(distanceMatrix.length);
  let bestRoute = [...route];
  let improved = true;
  
  while (improved) {
    improved = false;
    
    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length; j++) {
        if (j - i === 1) continue;
        
        const newRoute = [...bestRoute];
        // Reverse the segment between i and j
        newRoute.splice(i, j - i + 1, ...bestRoute.slice(i, j + 1).reverse());
        
        if (calculateRouteDistance(newRoute, distanceMatrix) < calculateRouteDistance(bestRoute, distanceMatrix)) {
          bestRoute = newRoute;
          improved = true;
        }
      }
    }
  }
  
  return bestRoute;
}

// Calculate total distance for a route
function calculateRouteDistance(route: number[], distanceMatrix: number[]): number {
  const n = Math.sqrt(distanceMatrix.length);
  let totalDistance = 0;
  
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += distanceMatrix[route[i] * n + route[i + 1]];
  }
  
  return totalDistance;
}

// Find optimal starting point based on current user location
export function findOptimalStartingPoint(
  milestones: Milestone[],
  currentLocation?: { latitude: number; longitude: number }
): number {
  if (!currentLocation || milestones.length === 0) return 0;
  
  let nearestIndex = 0;
  let nearestDistance = Infinity;
  
  milestones.forEach((milestone, index) => {
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      milestone.coordinates.latitude,
      milestone.coordinates.longitude
    );
    
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  
  return nearestIndex;
}

// Main route optimization function
export async function optimizeRouteWithTSP(
  milestones: Milestone[],
  currentLocation?: { latitude: number; longitude: number }
): Promise<OptimizedRoute> {
  if (milestones.length < 2) {
    throw new Error('At least 2 milestones are required for route optimization');
  }
  
  if (milestones.length > 10) {
    throw new Error('Maximum 10 milestones allowed per route');
  }
  
  // Calculate distance matrix
  const distanceMatrix2D = calculateDistanceMatrix(milestones);
  const distanceMatrix1D = distanceMatrix2D.flat();
  
  // Find optimal starting point
  const startIndex = findOptimalStartingPoint(milestones, currentLocation);
  
  // Apply Nearest Neighbor algorithm
  const initialRoute = nearestNeighborTSP(distanceMatrix1D, startIndex);
  
  // Apply 2-opt optimization
  const optimizedIndices = twoOptOptimization(initialRoute, distanceMatrix1D);
  
  // Create optimized milestone sequence
  const optimizedMilestones = optimizedIndices.map((index, order) => ({
    ...milestones[index],
    order,
  }));
  
  // Calculate route segments
  const routeSegments: RouteSegment[] = [];
  let totalDistance = 0;
  let totalTime = 0;
  
  for (let i = 0; i < optimizedMilestones.length - 1; i++) {
    const from = optimizedMilestones[i];
    const to = optimizedMilestones[i + 1];
    const distance = calculateDistance(
      from.coordinates.latitude,
      from.coordinates.longitude,
      to.coordinates.latitude,
      to.coordinates.longitude
    );
    
    // Estimate travel time (assuming 5 km/h walking speed)
    const travelTime = (distance / 5) * 60; // minutes
    
    routeSegments.push({
      from,
      to,
      distance,
      estimatedTime: travelTime,
    });
    
    totalDistance += distance;
    totalTime += travelTime + to.estimatedDuration;
  }
  
  // Add time for the first milestone
  totalTime += optimizedMilestones[0].estimatedDuration;
  
  return {
    milestones: optimizedMilestones,
    totalDistance: Math.round(totalDistance * 100) / 100,
    estimatedTotalTime: Math.round(totalTime),
    startingPoint: optimizedMilestones[0],
    routeSegments,
  };
}

// Validate if route is walkable/accessible
export function validateRoute(route: OptimizedRoute): boolean {
  // Check if total distance is reasonable (max 20km)
  if (route.totalDistance > 20) return false;
  
  // Check if total time is reasonable (max 8 hours)
  if (route.estimatedTotalTime > 480) return false;
  
  // Check if individual segments are reasonable (max 5km between milestones)
  for (const segment of route.routeSegments) {
    if (segment.distance > 5) return false;
  }
  
  return true;
}