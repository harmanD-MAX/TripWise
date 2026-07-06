package com.tripwise.controller;

import com.tripwise.service.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @Autowired
    private SearchService searchService;

    @GetMapping
    public ResponseEntity<String> search(@RequestParam String q) {
        return ResponseEntity.ok(searchService.searchLocation(q));
    }
}
