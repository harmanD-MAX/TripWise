package com.tripwise.controller;

import com.tripwise.model.SavedPlace;
import com.tripwise.model.User;
import com.tripwise.repository.SavedPlaceRepository;
import com.tripwise.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/saved-places")
public class SavedPlaceController {

    @Autowired
    private SavedPlaceRepository savedPlaceRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<SavedPlace>> getUserSavedPlaces(@AuthenticationPrincipal Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        return ResponseEntity.ok(savedPlaceRepository.findByUserId(clerkUserId));
    }

    @PostMapping
    public ResponseEntity<SavedPlace> savePlace(@AuthenticationPrincipal Jwt jwt, @RequestBody SavedPlace place) {
        String clerkUserId = jwt.getSubject();
        User user = userRepository.findById(clerkUserId)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setId(clerkUserId);
                    newUser.setEmail("unknown@clerk.user");
                    return userRepository.save(newUser);
                });

        place.setUser(user);
        return ResponseEntity.ok(savedPlaceRepository.save(place));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSavedPlace(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        String clerkUserId = jwt.getSubject();
        return savedPlaceRepository.findById(id)
                .filter(place -> place.getUser().getId().equals(clerkUserId))
                .map(place -> {
                    savedPlaceRepository.delete(place);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
