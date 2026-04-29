package com.studyplanner.dto.response;

import com.studyplanner.model.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudySessionResponse {
    private UUID id;
    private UUID subjectId;
    private String subjectName;
    private LocalDate date;
    private LocalTime startTime;
    private int duration;
    private SessionStatus status;
}
