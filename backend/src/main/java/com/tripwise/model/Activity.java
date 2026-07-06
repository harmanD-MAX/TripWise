package com.tripwise.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.UUID;

/**
 * Represents a single activity within an itinerary day.
 */
@Entity
@Table(name = "activities")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "day_id", nullable = false)
    @JsonIgnore
    private ItineraryDay itineraryDay;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "type")
    private String type;

    @Column(name = "time")
    private String time;

    @JsonProperty("cost_estimate")
    @Column(name = "cost_estimate")
    private String costEstimate;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "coordinates")
    private String coordinates;

    @Column(name = "display_order")
    private Integer displayOrder;

    public Activity() {}


    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public ItineraryDay getItineraryDay() { return itineraryDay; }
    public void setItineraryDay(ItineraryDay itineraryDay) { this.itineraryDay = itineraryDay; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getCostEstimate() { return costEstimate; }
    public void setCostEstimate(String costEstimate) { this.costEstimate = costEstimate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCoordinates() { return coordinates; }
    public void setCoordinates(String coordinates) { this.coordinates = coordinates; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}
