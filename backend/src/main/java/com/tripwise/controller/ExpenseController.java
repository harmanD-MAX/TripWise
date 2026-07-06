package com.tripwise.controller;

import com.tripwise.model.Expense;
import com.tripwise.service.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/trips/{tripId}/expenses")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<List<Expense>> getTripExpenses(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId) {
        String clerkUserId = jwt.getSubject();
        try {
            return ResponseEntity.ok(expenseService.getExpensesByTrip(tripId, clerkUserId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }

    @PostMapping
    public ResponseEntity<Expense> addExpense(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @RequestBody Expense expense) {
        String clerkUserId = jwt.getSubject();
        try {
            return ResponseEntity.ok(expenseService.addExpense(tripId, clerkUserId, expense));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> deleteExpense(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @PathVariable UUID expenseId) {
        String clerkUserId = jwt.getSubject();
        try {
            expenseService.deleteExpense(expenseId, clerkUserId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }
}
