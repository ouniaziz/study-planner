package com.studyplanner.repository;

import com.studyplanner.model.SessionStatus;
import com.studyplanner.model.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, UUID> {

    List<StudySession> findByUserIdOrderByDateAscStartTimeAsc(UUID userId);

    List<StudySession> findByUserIdAndDateBetweenOrderByDateAscStartTimeAsc(
            UUID userId, LocalDate start, LocalDate end);

    List<StudySession> findByUserIdAndStatus(UUID userId, SessionStatus status);

    Optional<StudySession> findByIdAndUserId(UUID id, UUID userId);

    long countByUserIdAndStatus(UUID userId, SessionStatus status);

    @Modifying
    @Query("DELETE FROM StudySession s WHERE s.user.id = :userId AND s.status = :status AND s.date >= :fromDate")
    void deleteByUserIdAndStatusAndDateGreaterThanEqual(UUID userId, SessionStatus status, LocalDate fromDate);

    @Query("SELECT DISTINCT s.date FROM StudySession s WHERE s.user.id = :userId AND s.status = 'COMPLETED' ORDER BY s.date DESC")
    List<LocalDate> findCompletedDatesByUserId(UUID userId);
}
