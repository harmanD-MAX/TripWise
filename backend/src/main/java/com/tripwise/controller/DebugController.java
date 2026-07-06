package com.tripwise.controller;

import com.tripwise.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @Autowired
    private TripRepository tripRepository;

    @GetMapping("/trip/{id}")
    public String getTripBudget(@PathVariable UUID id) {
        return tripRepository.findById(id).map(t -> t.getBudgetPredictionJson()).orElse("Not Found");
    }
}
