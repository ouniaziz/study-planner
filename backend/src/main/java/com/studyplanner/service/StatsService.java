package com.studyplanner.service;

import com.studyplanner.dto.response.StatsResponse;
import com.studyplanner.model.SessionStatus;
import com.studyplanner.model.StudySession;
import com.studyplanner.model.Subject;
import com.studyplanner.repository.StudySessionRepository;
import com.studyplanner.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {

    private final StudySessionRepository sessionRepository;
    private final SubjectRepository subjectRepository;

    public StatsResponse getStats(UUID userId) {
        List<StudySession> allSessions = sessionRepository.findByUserIdOrderByDateAscStartTimeAsc(userId);
        List<Subject> allSubjects = subjectRepository.findByUserId(userId);

        long completed = allSessions.stream().filter(s -> s.getStatus() == SessionStatus.COMPLETED).count();
        long missed    = allSessions.stream().filter(s -> s.getStatus() == SessionStatus.MISSED).count();
        long finished  = completed + missed;

        int completionRate = finished == 0 ? 0 : (int) ((completed * 100) / finished);

        long totalStudyTime = allSessions.stream()
                .filter(s -> s.getStatus() == SessionStatus.COMPLETED)
                .mapToLong(StudySession::getDuration)
                .sum();

        int streak = calculateStreak(userId);

        // Per-subject breakdown
        Map<UUID, List<StudySession>> bySubject = allSessions.stream()
                .collect(Collectors.groupingBy(s -> s.getSubject().getId()));

        List<StatsResponse.SubjectProgress> progress = allSubjects.stream()
                .map(sub -> {
                    List<StudySession> subjectSessions = bySubject.getOrDefault(sub.getId(), Collections.emptyList());
                    long comp  = subjectSessions.stream().filter(s -> s.getStatus() == SessionStatus.COMPLETED).count();
                    long total = subjectSessions.size();
                    int pct    = total == 0 ? 0 : (int) ((comp * 100) / total);
                    return StatsResponse.SubjectProgress.builder()
                            .subjectId(sub.getId())
                            .subjectName(sub.getName())
                            .completedSessions(comp)
                            .totalSessions(total)
                            .progressPercent(pct)
                            .build();
                })
                .sorted(Comparator.comparing(StatsResponse.SubjectProgress::getSubjectName))
                .collect(Collectors.toList());

        return StatsResponse.builder()
                .completionRate(completionRate)
                .totalStudyTimeMinutes(totalStudyTime)
                .streak(streak)
                .subjectsProgress(progress)
                .build();
    }

    // ── Streak Calculation ────────────────────────────────────────────────────

    private int calculateStreak(UUID userId) {
        List<LocalDate> completedDates = sessionRepository.findCompletedDatesByUserId(userId);
        if (completedDates.isEmpty()) return 0;

        Set<LocalDate> completedSet = new HashSet<>(completedDates);
        int streak = 0;
        LocalDate cursor = LocalDate.now();

        // Allow today to not have a completed session yet (count from yesterday if needed)
        if (!completedSet.contains(cursor)) {
            cursor = cursor.minusDays(1);
        }

        while (completedSet.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }

        return streak;
    }
}
