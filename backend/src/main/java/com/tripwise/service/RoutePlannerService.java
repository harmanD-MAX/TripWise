package com.tripwise.service;

import com.tripwise.model.Activity;
import com.tripwise.model.ItineraryDay;
import com.tripwise.repository.ItineraryDayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class RoutePlannerService {

    @Autowired
    private ItineraryDayRepository itineraryDayRepository;

    @Autowired
    private TripService tripService;

    public ItineraryDay optimizeDayRoute(UUID tripId, UUID dayId, String clerkUserId) {
        // Validate trip ownership
        tripService.getTripById(tripId, clerkUserId)
                .orElseThrow(() -> new RuntimeException("Trip not found or unauthorized"));
                
        ItineraryDay day = itineraryDayRepository.findById(dayId)
                .orElseThrow(() -> new RuntimeException("Day not found"));

        if (!day.getTrip().getId().equals(tripId)) {
            throw new RuntimeException("Day does not belong to trip");
        }

        List<Activity> activities = day.getActivities();
        if (activities == null || activities.size() <= 2) {
            return day; // Nothing to optimize
        }

        // Try starting from every possible activity to find the absolute best route
        List<Activity> bestRoute = null;
        double bestDistance = Double.MAX_VALUE;

        for (int i = 0; i < activities.size(); i++) {
            List<Activity> currentRoute = new ArrayList<>();
            List<Activity> unvisited = new ArrayList<>(activities);
            
            Activity current = unvisited.remove(i);
            currentRoute.add(current);
            double currentDistance = 0.0;

            while (!unvisited.isEmpty()) {
                Activity nearest = null;
                double minDistance = Double.MAX_VALUE;

                for (Activity candidate : unvisited) {
                    double dist = calculateDistance(current.getCoordinates(), candidate.getCoordinates());
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearest = candidate;
                    }
                }

                currentRoute.add(nearest);
                unvisited.remove(nearest);
                currentDistance += minDistance;
                current = nearest;
            }

            if (currentDistance < bestDistance) {
                bestDistance = currentDistance;
                bestRoute = currentRoute;
            }
        }

        // Save the new order
        for (int i = 0; i < bestRoute.size(); i++) {
            bestRoute.get(i).setDisplayOrder(i);
        }
        
        day.getActivities().clear();
        day.getActivities().addAll(bestRoute);
        return itineraryDayRepository.save(day);
    }

    private double calculateDistance(String coords1, String coords2) {
        if (coords1 == null || coords2 == null) return Double.MAX_VALUE;
        try {
            String[] p1 = coords1.split(",");
            String[] p2 = coords2.split(",");
            double lat1 = Double.parseDouble(p1[0].trim());
            double lon1 = Double.parseDouble(p1[1].trim());
            double lat2 = Double.parseDouble(p2[0].trim());
            double lon2 = Double.parseDouble(p2[1].trim());

            // Simple euclidean distance for demo purposes (Haversine is better but this works for local sorting)
            return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
        } catch (Exception e) {
            return Double.MAX_VALUE; // Put invalid coords at the end
        }
    }
}
