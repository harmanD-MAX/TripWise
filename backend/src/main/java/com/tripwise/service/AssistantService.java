package com.tripwise.service;

import com.tripwise.model.Trip;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.cache.annotation.Cacheable;

import com.tripwise.repository.TripRepository;
import java.util.List;
import com.fasterxml.jackson.core.type.TypeReference;
import com.tripwise.model.ItineraryDay;

@Service
public class AssistantService {

    private final ChatClient chatClient;
    private final TripRepository tripRepository;
    private final TripService tripService;

    public AssistantService(ChatClient.Builder chatClientBuilder, TripRepository tripRepository, TripService tripService) {
        this.chatClient = chatClientBuilder.build();
        this.tripRepository = tripRepository;
        this.tripService = tripService;
    }

    @Transactional
    public Trip generateItinerary(Trip tripDetails, String userId) {
        String prompt = String.format(
            "Create a day-by-day itinerary and a budget prediction for a trip to %s from %s to %s. " +
            "The intended budget is %s, there are %d travelers, and the travel style is %s. " +
            "Please provide a unified JSON object with TWO keys: 'itinerary' and 'budget_prediction'.\n\n" +
            "1. 'itinerary' must be a JSON array of days. Each day should have a 'day_number', 'date', " +
            "and an array of 'activities'. Each activity should have 'name', 'type' (Restaurant, Attraction, Hotel), " +
            "'time', 'cost_estimate' (string, in local currency), 'notes', and 'coordinates' (a string in 'lat,lng' format).\n\n" +
            "2. 'budget_prediction' must be a JSON object containing: 'expected_spend' (number), " +
            "'confidence' (number between 0 and 100), 'explanation' (string), and 'currency_symbol' (string, the local currency symbol for the destination, e.g. '$', '₹', '€', '£').\n\n" +
            "IMPORTANT: Use the local currency of the destination for all monetary values and cost estimates!\n\n" +
            "Respond ONLY with valid JSON.",
            tripDetails.getDestination(), tripDetails.getStartDate(), tripDetails.getEndDate(),
            tripDetails.getBudget(), tripDetails.getTravelers(), tripDetails.getTravelStyle()
        );

        String response = chatClient.prompt()
                .user(prompt)
                .call()
                .content();
                
        Trip updatedTrip = tripDetails;
        // Extract budget prediction and itinerary, save them, and return updated trip
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            String cleanResponse = response;
            if (response.contains("```json")) {
                int start = response.indexOf("{");
                int end = response.lastIndexOf("}");
                if (start != -1 && end != -1) {
                    cleanResponse = response.substring(start, end + 1);
                }
            }
            JsonNode root = mapper.readTree(cleanResponse);
            
            String budgetJson = null;
            if (root.has("budget_prediction") && tripDetails.getId() != null) {
                budgetJson = mapper.writeValueAsString(root.get("budget_prediction"));
            }
            
            if (root.has("itinerary") && tripDetails.getId() != null) {
                List<ItineraryDay> days = mapper.convertValue(root.get("itinerary"), new TypeReference<List<ItineraryDay>>() {});
                updatedTrip = tripService.saveItineraryAndBudget(tripDetails.getId(), userId, days, budgetJson);
                System.out.println("Saved unified itinerary and budget for trip: " + tripDetails.getId());
            } else if (budgetJson != null && tripDetails.getId() != null) {
                // If only budget was returned
                updatedTrip = tripService.saveItineraryAndBudget(tripDetails.getId(), userId, null, budgetJson);
                System.out.println("Saved unified budget prediction for trip: " + tripDetails.getId());
            }
        } catch (Exception e) {
            System.err.println("Failed to parse and save unified response: " + e.getMessage());
            e.printStackTrace();
        }
        
        return updatedTrip;
    }

    public String askTravelQuestion(String question) {
        return chatClient.prompt()
                .system("You are TripWise, an AI travel assistant. Answer the user's travel-related question accurately and concisely.")
                .user(question)
                .call()
                .content();
    }

    public String recommendTrips(String userPrompt) {
        String systemPrompt = "You are an expert AI travel planner. Based on the user's request, recommend a few trip destinations. " +
            "Respond ONLY with a JSON array of objects. Each object should have: 'destination' (string), " +
            "'estimated_budget' (string, e.g., 'Moderate', 'Budget', 'Luxury'), 'best_season' (string), " +
            "'suggested_duration_days' (integer), and 'short_explanation' (string).";
        return chatClient.prompt()
                .system(systemPrompt)
                .user(userPrompt)
                .call()
                .content();
    }

    public String optimizeItinerary(Trip trip) {
        String systemPrompt = "You are an AI Travel Optimizer. The user has a trip to " + trip.getDestination() + 
            " for " + trip.getTravelers() + " travelers with a " + trip.getBudget() + " budget. " +
            "Analyze the general trip parameters and suggest improvements for the itinerary. " +
            "Respond ONLY with a JSON array of objects. Each object should have: " +
            "'suggestion_type' (string, e.g., 'Routing', 'Budget', 'Time Management'), " +
            "'description' (string, the actual suggestion), and 'impact' (string, e.g., 'High', 'Medium', 'Low').";
        return chatClient.prompt()
                .system(systemPrompt)
                .user("Please optimize my trip to " + trip.getDestination() + ".")
                .call()
                .content();
    }

    @Transactional
    public String predictBudget(java.util.UUID tripId, Trip tripDetails) {
        if (tripId != null) {
            Trip trip = tripRepository.findById(tripId).orElse(tripDetails);
            if (trip.getBudgetPredictionJson() != null && !trip.getBudgetPredictionJson().trim().isEmpty()) {
                return trip.getBudgetPredictionJson();
            }
        }
        
        String systemPrompt = "You are an AI Travel Finance Analyst. Based on the trip details, predict the expected spend. " +
            "Respond ONLY with a JSON object containing: " +
            "'expected_spend' (number, the total estimated cost in USD), " +
            "'confidence' (number, between 0 and 100 representing confidence percentage), and " +
            "'explanation' (string, a brief 1-2 sentence explanation of the prediction, e.g. 'Restaurants in Tokyo are currently 15% more expensive than average.').";
        String userMessage = String.format("Predict budget for: Destination: %s, Travelers: %d, Duration: %s to %s, Travel Style: %s.",
            tripDetails.getDestination(), tripDetails.getTravelers(), tripDetails.getStartDate(), tripDetails.getEndDate(), tripDetails.getTravelStyle());
            
        String prediction = chatClient.prompt()
                .system(systemPrompt)
                .user(userMessage)
                .call()
                .content();
                
        if (tripId != null) {
            System.out.println("Saving budget prediction for tripId: " + tripId);
            Trip trip = tripRepository.findById(tripId).orElse(null);
            if (trip != null) {
                trip.setBudgetPredictionJson(prediction);
                tripRepository.save(trip);
                System.out.println("Successfully saved trip with new prediction");
            }
        } else {
            System.out.println("tripId is null, not saving");
        }
        
        return prediction;
    }
}
