package com.tripwise.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class SearchService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Cacheable(value = "search", key = "#query.toLowerCase()")
    public String searchLocation(String query) {
        try {
            String url = UriComponentsBuilder
                .fromHttpUrl("https://nominatim.openstreetmap.org/search")
                .queryParam("q", query)
                .queryParam("format", "json")
                .queryParam("limit", 5)
                .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "TripWise/1.0 (student-project)");
            headers.set("Accept", "application/json");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            return response.getBody();
        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }
    }
}
