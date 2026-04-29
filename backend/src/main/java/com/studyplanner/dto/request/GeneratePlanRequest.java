package com.studyplanner.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class GeneratePlanRequest {

    @NotNull(message = "Hours per day is required")
    @Min(value = 1, message = "Must study at least 1 hour per day")
    @Max(value = 16, message = "Cannot study more than 16 hours per day")
    private Integer hoursPerDay;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "Plan duration is required")
    @Min(value = 1, message = "Plan must be at least 1 day")
    @Max(value = 90, message = "Plan cannot exceed 90 days")
    private Integer planDays;
}
