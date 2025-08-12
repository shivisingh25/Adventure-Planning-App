import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Milestone, OptimizedRoute, ActiveRoute, PlaceSearchResult, RouteTemplate } from '@/types';

interface RouteState {

  // Search and milestone management
  searchResults: PlaceSearchResult[];
  selectedMilestones: Milestone[];
  
  // Route optimization
  optimizedRoute: OptimizedRoute | null;
  isOptimizing: boolean;
  
  // Active route tracking
  activeRoute: ActiveRoute | null;
  isNavigating: boolean;
  
  // Route templates
  savedRoutes: OptimizedRoute[];
  routeTemplates: RouteTemplate[];
  
  // Actions
  setSearchResults: (results: PlaceSearchResult[]) => void;
  addMilestone: (place: PlaceSearchResult, estimatedDuration: number) => void;
  removeMilestone: (milestoneId: string) => void;
  reorderMilestones: (milestones: Milestone[]) => void;
  updateMilestoneEstimatedTime: (milestoneId: string, duration: number) => void;
  
  optimizeRoute: (milestones: Milestone[]) => Promise<OptimizedRoute>;
  setOptimizedRoute: (route: OptimizedRoute) => void;
  
  startNavigation: (route: OptimizedRoute) => void;
  stopNavigation: () => void;
  markMilestoneCompleted: (milestoneId: string) => void;
  updateCurrentMilestone: (index: number) => void;
  
  saveRoute: (route: OptimizedRoute, name: string) => void;
  loadSavedRoute: (routeId: string) => OptimizedRoute | null;
  deleteRoute: (routeId: string) => void;
  
  clearAll: () => void;
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set, get) => ({
      searchResults: [],
      selectedMilestones: [],
      optimizedRoute: null,
      isOptimizing: false,
      activeRoute: null,
      isNavigating: false,
      savedRoutes: [],
      routeTemplates: [],

      setSearchResults: (results) => set({ searchResults: results }),

      addMilestone: (place, estimatedDuration) => {
        const newMilestone: Milestone = {
          id: `milestone_${Date.now()}`,
          name: place.name,
          address: place.address,
          coordinates: place.coordinates,
          estimatedDuration,
          order: get().selectedMilestones.length,
          completed: false,
        };
        
        set(state => ({
          selectedMilestones: [...state.selectedMilestones, newMilestone]
        }));
      },

      removeMilestone: (milestoneId) => {
        set(state => ({
          selectedMilestones: state.selectedMilestones
            .filter(m => m.id !== milestoneId)
            .map((m, index) => ({ ...m, order: index }))
        }));
      },

      reorderMilestones: (milestones) => {
        const reorderedMilestones = milestones.map((m, index) => ({ ...m, order: index }));
        set({ selectedMilestones: reorderedMilestones });
      },

      updateMilestoneEstimatedTime: (milestoneId, duration) => {
        set(state => ({
          selectedMilestones: state.selectedMilestones.map(m =>
            m.id === milestoneId ? { ...m, estimatedDuration: duration } : m
          )
        }));
      },

      optimizeRoute: async (milestones) => {
        set({ isOptimizing: true });
        
        try {
          // Import optimization algorithms
          const { optimizeRouteWithTSP } = await import('@/utils/routeOptimization');
          const optimizedRoute = await optimizeRouteWithTSP(milestones);
          
          set({ optimizedRoute, isOptimizing: false });
          return optimizedRoute;
        } catch (error) {
          console.error('Route optimization failed:', error);
          set({ isOptimizing: false });
          throw error;
        }
      },

      setOptimizedRoute: (route) => set({ optimizedRoute: route }),

      startNavigation: (route) => {
        const activeRoute: ActiveRoute = {
          id: `route_${Date.now()}`,
          name: `Adventure ${new Date().toLocaleDateString()}`,
          route,
          startTime: new Date(),
          currentMilestoneIndex: 0,
          isActive: true,
          completedMilestones: [],
        };
        
        set({ activeRoute, isNavigating: true });
      },

      stopNavigation: () => {
        set({ activeRoute: null, isNavigating: false });
      },

      markMilestoneCompleted: (milestoneId) => {
        set(state => {
          if (!state.activeRoute) return state;
          
          const updatedCompletedMilestones = [...state.activeRoute.completedMilestones, milestoneId];
          const currentIndex = state.activeRoute.currentMilestoneIndex;
          const nextIndex = currentIndex + 1;
          
          return {
            activeRoute: {
              ...state.activeRoute,
              completedMilestones: updatedCompletedMilestones,
              currentMilestoneIndex: nextIndex < state.activeRoute.route.milestones.length ? nextIndex : currentIndex,
            }
          };
        });
      },

      updateCurrentMilestone: (index) => {
        set(state => {
          if (!state.activeRoute) return state;
          
          return {
            activeRoute: {
              ...state.activeRoute,
              currentMilestoneIndex: index,
            }
          };
        });
      },

      saveRoute: (route, name) => {
        const savedRoute = {
          ...route,
          id: `saved_${Date.now()}`,
          name,
        } as any;
        
        set(state => ({
          savedRoutes: [...state.savedRoutes, savedRoute]
        }));
      },

      loadSavedRoute: (routeId) => {
        const route = get().savedRoutes.find(r => (r as any).id === routeId);
        return route || null;
      },

      deleteRoute: (routeId) => {
        set(state => ({
          savedRoutes: state.savedRoutes.filter(r => (r as any).id !== routeId)
        }));
      },

      clearAll: () => {
        set({
          searchResults: [],
          selectedMilestones: [],
          optimizedRoute: null,
          activeRoute: null,
          isNavigating: false,
        });
      },
    }),
    {
      name: 'adventure-route-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        savedRoutes: state.savedRoutes,
        routeTemplates: state.routeTemplates,
      }),
    }
  )
);