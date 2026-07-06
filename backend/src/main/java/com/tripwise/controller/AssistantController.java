package com.tripwise.controller;

import com.tripwise.model.Trip;
import com.tripwise.service.AssistantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    @Autowired
    private AssistantService assistantService;

    @PostMapping("/generate-itinerary")
    public ResponseEntity<Trip> generateItinerary(@AuthenticationPrincipal Jwt jwt, @RequestBody Trip tripDetails) {
        return ResponseEntity.ok(assistantService.generateItinerary(tripDetails, jwt.getSubject()));
    }

    @PostMapping("/ask")
    public ResponseEntity<Map<String, String>> askQuestion(@AuthenticationPrincipal Jwt jwt, @RequestBody Map<String, String> request) {
        String question = request.get("question");
        String answer = assistantService.askTravelQuestion(question);
        return ResponseEntity.ok(Map.of("answer", answer));
    }

    @PostMapping("/recommend")
    public ResponseEntity<String> recommendTrips(@AuthenticationPrincipal Jwt jwt, @RequestBody Map<String, String> request) {
        String prompt = request.get("prompt");
        return ResponseEntity.ok(assistantService.recommendTrips(prompt));
    }

    @PostMapping("/optimize")
    public ResponseEntity<String> optimizeItinerary(@AuthenticationPrincipal Jwt jwt, @RequestBody Trip tripDetails) {
        return ResponseEntity.ok(assistantService.optimizeItinerary(tripDetails));
    }

    @PostMapping("/predict-budget/{tripId}")
    public ResponseEntity<String> predictBudget(@AuthenticationPrincipal Jwt jwt, @PathVariable java.util.UUID tripId, @RequestBody Trip tripDetails) {
        return ResponseEntity.ok(assistantService.predictBudget(tripId, tripDetails));
    }
}
