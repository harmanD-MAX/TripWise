package com.tripwise.repository;

import com.tripwise.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface TripRepository extends JpaRepository<Trip, UUID> {
    List<Trip> findByUserId(String userId);
    List<Trip> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Trip> findByIsTemplateTrue();

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Activity a WHERE a.itineraryDay.trip.id = :tripId")
    void deleteActivitiesByTripId(@Param("tripId") UUID tripId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ItineraryDay d WHERE d.trip.id = :tripId")
    void deleteItineraryDaysByTripId(@Param("tripId") UUID tripId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Expense e WHERE e.trip.id = :tripId")
    void deleteExpensesByTripId(@Param("tripId") UUID tripId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM TripMedia m WHERE m.trip.id = :tripId")
    void deleteTripMediaByTripId(@Param("tripId") UUID tripId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Trip t WHERE t.id = :tripId")
    void deleteTripByTripId(@Param("tripId") UUID tripId);
}
