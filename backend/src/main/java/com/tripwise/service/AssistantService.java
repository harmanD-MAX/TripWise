package com.tripwise.service;

import com.tripwise.model.Trip;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import org.springframework.cache.annotation.Cacheable;

@Service
public class AssistantService {

    private final ChatClient chatClient;

    public AssistantService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @Cacheable(value = "itineraries", key = "#tripDetails.id")
    public String generateItinerary(Trip tripDetails) {
        String prompt = String.format(
            "Create a day-by-day itinerary for a trip to %s from %s to %s. " +
            "The budget is %s, there are %d travelers, and the travel style is %s. " +
            "Please provide a JSON array of days. Each day should have a 'day_number', 'date', " +
            "and an array of 'activities'. Each activity should have 'name', 'type' (Restaurant, Attraction, Hotel), " +
            "'time', 'cost_estimate', 'notes', and 'coordinates' (a string in 'lat,lng' format). Respond ONLY with valid JSON.",
            tripDetails.getDestination(), tripDetails.getStartDate(), tripDetails.getEndDate(),
            tripDetails.getBudget(), tripDetails.getTravelers(), tripDetails.getTravelStyle()
        );

        // In a real application, we might want to map the JSON directly to ItineraryDay entities.
        // For now, we return the JSON string to the frontend to parse and display.
        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
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
        // In a real app we would pass the actual itinerary JSON. Here we just prompt for optimization.
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
}
