package com.studyplanner.exception;

import org.springframework.http.HttpStatus;

public class StudyPlannerException extends RuntimeException {

    private final HttpStatus status;

    public StudyPlannerException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    // ── Factory methods ──────────────────────────────────────────────────────

    public static StudyPlannerException notFound(String message) {
        return new StudyPlannerException(message, HttpStatus.NOT_FOUND);
    }

    public static StudyPlannerException forbidden(String message) {
        return new StudyPlannerException(message, HttpStatus.FORBIDDEN);
    }

    public static StudyPlannerException badRequest(String message) {
        return new StudyPlannerException(message, HttpStatus.BAD_REQUEST);
    }

    public static StudyPlannerException conflict(String message) {
        return new StudyPlannerException(message, HttpStatus.CONFLICT);
    }
}
