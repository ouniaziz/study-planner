package com.studyplanner.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsResponse {

    /** Percentage of completed sessions out of all non-planned sessions */
    private int completionRate;

    /** Total study time in minutes (COMPLETED sessions only) */
    private long totalStudyTimeMinutes;

    /** Current consecutive-day streak */
    private int streak;

    private List<SubjectProgress> subjectsProgress;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubjectProgress {
        private UUID subjectId;
        private String subjectName;
        private long completedSessions;
        private long totalSessions;
        private int progressPercent;
    }
}
