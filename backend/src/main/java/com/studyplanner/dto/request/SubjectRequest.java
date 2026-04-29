package com.studyplanner.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SubjectRequest {

    @NotBlank(message = "Subject name is required")
    private String name;

    @NotNull(message = "Difficulty is required")
    @Min(value = 1, message = "Difficulty must be at least 1")
    @Max(value = 5, message = "Difficulty must be at most 5")
    private Integer difficulty;

    @NotNull(message = "Importance is required")
    @Min(value = 1, message = "Importance must be at least 1")
    @Max(value = 5, message = "Importance must be at most 5")
    private Integer importance;

    @NotNull(message = "Exam date is required")
    @Future(message = "Exam date must be in the future")
    private LocalDate examDate;
}
