package com.tripwise.service;

import com.tripwise.model.Trip;
import com.tripwise.model.User;
import com.tripwise.repository.TripRepository;
import com.tripwise.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;
import com.tripwise.repository.ItineraryDayRepository;

@Service
@Transactional
public class TripService {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItineraryDayRepository itineraryDayRepository;

    public List<Trip> getUserTrips(String clerkUserId) {
        return tripRepository.findByUserIdOrderByCreatedAtDesc(clerkUserId);
    }

    public Trip createTrip(String clerkUserId, Trip tripData) {
        // Ensure user exists, if not, create a basic record
        User user = userRepository.findById(clerkUserId)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setId(clerkUserId);
                    newUser.setEmail("unknown@clerk.user"); // Typically synced via webhooks in a real app
                    return userRepository.save(newUser);
                });

        tripData.setUser(user);
        return tripRepository.save(tripData);
    }

    public Optional<Trip> getTripById(UUID tripId, String clerkUserId) {
        return tripRepository.findById(tripId)
                .filter(trip -> trip.getUser().getId().equals(clerkUserId));
    }

    public Optional<Trip> getPublicTripById(UUID tripId) {
        return tripRepository.findById(tripId)
                .filter(trip -> Boolean.TRUE.equals(trip.getIsPublic()));
    }

    public List<Trip> getTemplates() {
        return tripRepository.findByIsTemplateTrue();
    }

    public Trip updateTripVisibility(UUID tripId, String clerkUserId, boolean isPublic) {
        Trip trip = getTripById(tripId, clerkUserId)
                .orElseThrow(() -> new RuntimeException("Trip not found or unauthorized"));
        trip.setIsPublic(isPublic);
        return tripRepository.save(trip);
    }

    public Trip duplicateTrip(UUID tripId, String clerkUserId) {
        // Find the trip to duplicate (could be a template or a user's own trip)
        Trip originalTrip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (!Boolean.TRUE.equals(originalTrip.getIsTemplate()) && !originalTrip.getUser().getId().equals(clerkUserId)) {
             throw new RuntimeException("Unauthorized to duplicate this trip");
        }

        Trip newTrip = new Trip();
        newTrip.setDestination(originalTrip.getDestination());
        newTrip.setStartDate(originalTrip.getStartDate());
        newTrip.setEndDate(originalTrip.getEndDate());
        newTrip.setBudget(originalTrip.getBudget());
        newTrip.setTravelers(originalTrip.getTravelers());
        newTrip.setTravelStyle(originalTrip.getTravelStyle());
        newTrip.setIsPublic(false);
        newTrip.setIsTemplate(false);

        // Copy itinerary days and activities
        if (originalTrip.getItineraryDays() != null) {
            List<com.tripwise.model.ItineraryDay> clonedDays = originalTrip.getItineraryDays().stream().map(day -> {
                com.tripwise.model.ItineraryDay newDay = new com.tripwise.model.ItineraryDay();
                newDay.setDayNumber(day.getDayNumber());
                newDay.setDate(day.getDate());
                
                if (day.getActivities() != null) {
                    List<com.tripwise.model.Activity> clonedActivities = day.getActivities().stream().map(act -> {
                        com.tripwise.model.Activity newAct = new com.tripwise.model.Activity();
                        newAct.setName(act.getName());
                        newAct.setType(act.getType());
                        newAct.setTime(act.getTime());
                        newAct.setCostEstimate(act.getCostEstimate());
                        newAct.setNotes(act.getNotes());
                        newAct.setCoordinates(act.getCoordinates());
                        newAct.setItineraryDay(newDay);
                        return newAct;
                    }).toList();
                    newDay.setActivities(new ArrayList<>(clonedActivities));
                }
                return newDay;
            }).toList();
            // We can just set them and let cascade take care of it, but we need to ensure the bidirectional relationship is set
            for (com.tripwise.model.ItineraryDay day : clonedDays) {
                day.setTrip(newTrip);
            }
            newTrip.setItineraryDays(new ArrayList<>(clonedDays));
        }
        
        return createTrip(clerkUserId, newTrip);
    }

    public Trip saveItinerary(UUID tripId, String clerkUserId, List<com.tripwise.model.ItineraryDay> itineraryDays) {
        Trip trip = getTripById(tripId, clerkUserId)
                .orElseThrow(() -> new RuntimeException("Trip not found or unauthorized"));
        
        // Clear existing to avoid duplicates if regenerating
        if (trip.getItineraryDays() != null && !trip.getItineraryDays().isEmpty()) {
            itineraryDayRepository.deleteAll(trip.getItineraryDays());
            trip.getItineraryDays().clear();
        }
        
        // Link bidirectional mapping
        for (com.tripwise.model.ItineraryDay day : itineraryDays) {
            day.setTrip(trip);
            if (day.getActivities() != null) {
                for (com.tripwise.model.Activity act : day.getActivities()) {
                    act.setItineraryDay(day);
                }
            }
        }
        
        trip.getItineraryDays().addAll(itineraryDays);
        return tripRepository.save(trip);
    }

    public void deleteTrip(UUID tripId, String clerkUserId) {
        Trip trip = getTripById(tripId, clerkUserId)
                .orElseThrow(() -> new RuntimeException("Trip not found or unauthorized"));
        
        // Execute bulk deletes for all associated child entities to solve the N+1 delete latency problem
        tripRepository.deleteActivitiesByTripId(tripId);
        tripRepository.deleteItineraryDaysByTripId(tripId);
        tripRepository.deleteExpensesByTripId(tripId);
        tripRepository.deleteTripMediaByTripId(tripId);
        
        // Finally, delete the trip itself
        tripRepository.deleteTripByTripId(tripId);
    }
}
