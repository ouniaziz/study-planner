package com.studyplanner.repository;

import com.studyplanner.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, UUID> {
    List<Subject> findByUserId(UUID userId);
    Optional<Subject> findByIdAndUserId(UUID id, UUID userId);
    boolean existsByIdAndUserId(UUID id, UUID userId);
}
