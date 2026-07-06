package com.tripwise.repository;

import com.tripwise.model.TripMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TripMediaRepository extends JpaRepository<TripMedia, UUID> {
    List<TripMedia> findByTripId(UUID tripId);
}
