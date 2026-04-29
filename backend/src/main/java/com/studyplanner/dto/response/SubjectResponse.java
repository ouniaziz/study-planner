package com.studyplanner.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectResponse {
    private UUID id;
    private String name;
    private int difficulty;
    private int importance;
    private LocalDate examDate;
    private long daysUntilExam;
    private double priorityScore;
}
