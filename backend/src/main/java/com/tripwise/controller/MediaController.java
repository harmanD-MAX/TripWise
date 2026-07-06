package com.tripwise.controller;

import com.tripwise.model.Trip;
import com.tripwise.model.TripMedia;
import com.tripwise.repository.TripMediaRepository;
import com.tripwise.service.S3Service;
import com.tripwise.service.TripService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/trips/{tripId}/media")
public class MediaController {

    @Autowired
    private S3Service s3Service;

    @Autowired
    private TripMediaRepository mediaRepository;

    @Autowired
    private TripService tripService;

    @GetMapping
    public ResponseEntity<List<TripMedia>> getTripMedia(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId) {
        String clerkUserId = jwt.getSubject();
        try {
            tripService.getTripById(tripId, clerkUserId).orElseThrow(() -> new RuntimeException("Unauthorized"));
            return ResponseEntity.ok(mediaRepository.findByTripId(tripId));
        } catch (Exception e) {
            return ResponseEntity.status(403).build();
        }
    }

    @PostMapping
    public ResponseEntity<TripMedia> uploadMedia(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @RequestParam("file") MultipartFile file) {
        String clerkUserId = jwt.getSubject();
        try {
            Trip trip = tripService.getTripById(tripId, clerkUserId).orElseThrow(() -> new RuntimeException("Unauthorized"));
            String url = s3Service.uploadFile(file);
            
            TripMedia media = new TripMedia();
            media.setTrip(trip);
            media.setUrl(url);
            media.setFileName(file.getOriginalFilename());
            
            return ResponseEntity.ok(mediaRepository.save(media));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{mediaId}")
    public ResponseEntity<Void> deleteMedia(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @PathVariable UUID mediaId) {
        String clerkUserId = jwt.getSubject();
        try {
            tripService.getTripById(tripId, clerkUserId).orElseThrow(() -> new RuntimeException("Unauthorized"));
            TripMedia media = mediaRepository.findById(mediaId).orElseThrow(() -> new RuntimeException("Media not found"));
            
            if (!media.getTrip().getId().equals(tripId)) {
                return ResponseEntity.status(403).build();
            }

            s3Service.deleteFile(media.getUrl());
            mediaRepository.delete(media);
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
