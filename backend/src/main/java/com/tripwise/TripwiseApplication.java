package com.tripwise;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class TripwiseApplication {

	public static void main(String[] args) {
		SpringApplication.run(TripwiseApplication.class, args);
	}

}
