export interface Milestone {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  estimatedDuration: number; // in minutes
  order: number;
  completed: boolean;
  visitTime?: Date;
}

export interface OptimizedRoute {
  milestones: Milestone[];
  totalDistance: number;
  estimatedTotalTime: number;
  startingPoint: Milestone;
  routeSegments: RouteSegment[];
}

export interface RouteSegment {
  from: Milestone;
  to: Milestone;
  distance: number;
  estimatedTime: number;
  polyline?: string;
}

export interface PlaceSearchResult {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  rating?: number;
  types?: string[];
}

export interface ActiveRoute {
  id: string;
  name: string;
  route: OptimizedRoute;
  startTime: Date;
  currentMilestoneIndex: number;
  isActive: boolean;
  completedMilestones: string[];
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface RouteTemplate {
  id: string;
  name: string;
  description: string;
  milestones: Omit<Milestone, 'id' | 'completed'>[];
  category: string;
  estimatedDuration: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

