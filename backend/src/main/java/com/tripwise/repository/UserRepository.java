package com.tripwise.repository;

import com.tripwise.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    // Basic CRUD operations provided by JpaRepository
}
