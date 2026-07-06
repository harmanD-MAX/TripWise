package com.tripwise.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class WeatherService {

    @Cacheable(value = "weather", key = "#destination.toLowerCase()")
    public Map<String, Object> getWeatherForecast(String destination) {
        try { Thread.sleep(500); } catch (InterruptedException e) {}

        Map<String, Object> response = new HashMap<>();
        Random rand = new Random(destination.hashCode());

        int currentTemp = 15 + rand.nextInt(15);
        String[] conditions = {"Sunny", "Partly Cloudy", "Cloudy", "Rainy", "Clear"};
        String currentCondition = conditions[rand.nextInt(conditions.length)];

        response.put("destination", destination);
        response.put("current_temperature", currentTemp);
        response.put("current_condition", currentCondition);

        List<Map<String, Object>> forecast = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            Map<String, Object> day = new HashMap<>();
            day.put("day", "Day " + i);
            day.put("temperature", currentTemp + rand.nextInt(6) - 3);
            day.put("condition", conditions[rand.nextInt(conditions.length)]);
            forecast.add(day);
        }
        
        response.put("forecast", forecast);
        return response;
    }
}
