package com.studyplanner.service;

import com.studyplanner.dto.request.GeneratePlanRequest;
import com.studyplanner.dto.response.StudySessionResponse;
import com.studyplanner.exception.StudyPlannerException;
import com.studyplanner.model.*;
import com.studyplanner.repository.StudySessionRepository;
import com.studyplanner.repository.SubjectRepository;
import com.studyplanner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class StudyPlannerService {

    private static final int MAX_SESSIONS_PER_DAY = 4;
    private static final int MIN_SESSION_DURATION  = 30;   // minutes
    private static final int BREAK_BETWEEN_SESSIONS = 15; // minutes
    private static final LocalTime DAY_START_TIME  = LocalTime.of(9, 0);

    private final SubjectRepository subjectRepository;
    private final StudySessionRepository sessionRepository;
    private final UserRepository userRepository;

    // ── Generate Plan ────────────────────────────────────────────────────────

    public Map<String, List<StudySessionResponse>> generatePlan(UUID userId, GeneratePlanRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> StudyPlannerException.notFound("User not found"));

        // Remove any existing PLANNED sessions from the start date onwards
        sessionRepository.deleteByUserIdAndStatusAndDateGreaterThanEqual(
                userId, SessionStatus.PLANNED, request.getStartDate());

        // Fetch active subjects (exam date still in the future)
        List<Subject> subjects = subjectRepository.findByUserId(userId)
                .stream()
                .filter(s -> s.getExamDate().isAfter(LocalDate.now()))
                .collect(Collectors.toList());

        if (subjects.isEmpty()) {
            throw StudyPlannerException.badRequest(
                    "No active subjects found. Add subjects with future exam dates first.");
        }

        // ── Priority scoring ──────────────────────────────────────────────
        subjects.forEach(s -> {
            long daysUntilExam = ChronoUnit.DAYS.between(LocalDate.now(), s.getExamDate());
            double urgency     = 1.0 / (daysUntilExam + 1);
            double score       = (s.getImportance() * 0.5)
                               + (s.getDifficulty() * 0.3)
                               + (urgency * 0.2);
            s.setPriorityScore(score);
        });

        subjects.sort(Comparator.comparingDouble(Subject::getPriorityScore).reversed());

        // ── Session allocation ────────────────────────────────────────────
        int totalMinutesPerDay = request.getHoursPerDay() * 60;
        // Each session gets an equal share, minimum 30 min, no more than 120 min
        int sessionDuration = Math.max(MIN_SESSION_DURATION,
                Math.min(120, totalMinutesPerDay / Math.min(MAX_SESSIONS_PER_DAY, subjects.size())));

        List<StudySession> sessions = new ArrayList<>();
        int globalSubjectIndex = 0;

        for (int day = 0; day < request.getPlanDays(); day++) {
            final LocalDate currentDate = request.getStartDate().plusDays(day);
            int minutesUsed    = 0;
            int sessionsToday  = 0;
            LocalTime startTime = DAY_START_TIME;

            // Filter subjects whose exam hasn't passed yet for this day
            List<Subject> activeForDay = subjects.stream()
                    .filter(s -> s.getExamDate().isAfter(currentDate))
                    .collect(Collectors.toList());

            if (activeForDay.isEmpty()) continue;

            // We do not want to loop infinitely if there's time but we already scheduled all subjects today,
            // but standard constraint says max 4 sessions anyway, so we just do max sessions.
            int attempts = 0;
            while (minutesUsed + MIN_SESSION_DURATION <= totalMinutesPerDay
                    && sessionsToday < MAX_SESSIONS_PER_DAY
                    && attempts < activeForDay.size()) {

                Subject subject = activeForDay.get(globalSubjectIndex % activeForDay.size());

                int remainingMinutes = totalMinutesPerDay - minutesUsed;
                int duration = Math.min(sessionDuration, remainingMinutes);
                if (duration < MIN_SESSION_DURATION) break;

                sessions.add(StudySession.builder()
                        .user(user)
                        .subject(subject)
                        .date(currentDate)
                        .startTime(startTime)
                        .duration(duration)
                        .status(SessionStatus.PLANNED)
                        .build());

                minutesUsed += duration + BREAK_BETWEEN_SESSIONS;
                sessionsToday++;
                globalSubjectIndex++;
                attempts++;
                startTime = startTime.plusMinutes(duration + BREAK_BETWEEN_SESSIONS);
            }
        }

        sessionRepository.saveAll(sessions);
        return groupByDate(sessions);
    }

    // ── Get Sessions ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, List<StudySessionResponse>> getSessions(UUID userId) {
        List<StudySession> sessions = sessionRepository
                .findByUserIdOrderByDateAscStartTimeAsc(userId);
        return groupByDate(sessions);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Map<String, List<StudySessionResponse>> groupByDate(List<StudySession> sessions) {
        return sessions.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getDate().toString(),
                        LinkedHashMap::new,
                        Collectors.mapping(this::toResponse, Collectors.toList())
                ));
    }

    public StudySessionResponse toResponse(StudySession session) {
        return StudySessionResponse.builder()
                .id(session.getId())
                .subjectId(session.getSubject().getId())
                .subjectName(session.getSubject().getName())
                .date(session.getDate())
                .startTime(session.getStartTime())
                .duration(session.getDuration())
                .status(session.getStatus())
                .build();
    }
}
