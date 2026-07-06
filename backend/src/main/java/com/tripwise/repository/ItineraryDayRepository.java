package com.tripwise.repository;

import com.tripwise.model.ItineraryDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ItineraryDayRepository extends JpaRepository<ItineraryDay, UUID> {
}
