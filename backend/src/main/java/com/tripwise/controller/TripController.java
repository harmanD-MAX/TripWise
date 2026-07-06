package com.tripwise.controller;

import com.tripwise.model.Trip;
import com.tripwise.service.TripService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import com.tripwise.service.RoutePlannerService;
import com.tripwise.model.ItineraryDay;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    @Autowired
    private TripService tripService;

    @Autowired
    private RoutePlannerService routePlannerService;

    @GetMapping
    public ResponseEntity<List<Trip>> getUserTrips(@AuthenticationPrincipal Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        return ResponseEntity.ok(tripService.getUserTrips(clerkUserId));
    }

    @PostMapping
    public ResponseEntity<Trip> createTrip(@AuthenticationPrincipal Jwt jwt, @RequestBody Trip tripData) {
        String clerkUserId = jwt.getSubject();
        return ResponseEntity.ok(tripService.createTrip(clerkUserId, tripData));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trip> getTripById(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        String clerkUserId = jwt.getSubject();
        return tripService.getTripById(id, clerkUserId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        String clerkUserId = jwt.getSubject();
        try {
            tripService.deleteTrip(id, clerkUserId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(403).build();
        }
    }

    @PutMapping("/{id}/itinerary")
    public ResponseEntity<Trip> saveItinerary(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestBody List<com.tripwise.model.ItineraryDay> itineraryDays) {
        String clerkUserId = jwt.getSubject();
        try {
            return ResponseEntity.ok(tripService.saveItinerary(id, clerkUserId, itineraryDays));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }

    @PostMapping("/{tripId}/days/{dayId}/optimize")
    public ResponseEntity<ItineraryDay> optimizeDayRoute(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @PathVariable UUID dayId) {
        String clerkUserId = jwt.getSubject();
        try {
            return ResponseEntity.ok(routePlannerService.optimizeDayRoute(tripId, dayId, clerkUserId));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(403).build();
        }
    }

    @GetMapping("/templates")
    public ResponseEntity<List<Trip>> getTemplates() {
        return ResponseEntity.ok(tripService.getTemplates());
    }

    @PutMapping("/{id}/visibility")
    public ResponseEntity<Trip> updateVisibility(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestBody java.util.Map<String, Boolean> payload) {
        String clerkUserId = jwt.getSubject();
        boolean isPublic = payload.getOrDefault("isPublic", false);
        try {
            return ResponseEntity.ok(tripService.updateTripVisibility(id, clerkUserId, isPublic));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }

    @PutMapping("/{id}/budget")
    public ResponseEntity<Trip> updateBudget(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestBody java.util.Map<String, String> payload) {
        String clerkUserId = jwt.getSubject();
        String budget = payload.get("budget");
        try {
            return ResponseEntity.ok(tripService.updateTripBudget(id, clerkUserId, budget));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<Trip> duplicateTrip(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        String clerkUserId = jwt.getSubject();
        try {
            return ResponseEntity.ok(tripService.duplicateTrip(id, clerkUserId));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(403).build();
        }
    }
}
