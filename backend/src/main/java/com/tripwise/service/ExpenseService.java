package com.tripwise.service;

import com.tripwise.model.Expense;
import com.tripwise.model.Trip;
import com.tripwise.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private TripService tripService;

    public List<Expense> getExpensesByTrip(UUID tripId, String clerkUserId) {
        // Validate trip ownership
        tripService.getTripById(tripId, clerkUserId)
                .orElseThrow(() -> new RuntimeException("Trip not found or unauthorized"));
        return expenseRepository.findByTripId(tripId);
    }

    public Expense addExpense(UUID tripId, String clerkUserId, Expense expense) {
        Trip trip = tripService.getTripById(tripId, clerkUserId)
                .orElseThrow(() -> new RuntimeException("Trip not found or unauthorized"));
        expense.setTrip(trip);
        return expenseRepository.save(expense);
    }

    public void deleteExpense(UUID expenseId, String clerkUserId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        
        // Validate trip ownership
        if (!expense.getTrip().getUser().getId().equals(clerkUserId)) {
            throw new RuntimeException("Unauthorized to delete this expense");
        }
        
        expenseRepository.delete(expense);
    }
}
