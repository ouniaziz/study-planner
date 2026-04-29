package com.studyplanner.controller;

import com.studyplanner.dto.response.StudySessionResponse;
import com.studyplanner.model.User;
import com.studyplanner.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @PutMapping("/{id}/complete")
    public ResponseEntity<StudySessionResponse> markComplete(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.markComplete(user.getId(), id));
    }

    @PutMapping("/{id}/miss")
    public ResponseEntity<StudySessionResponse> markMissed(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.markMissed(user.getId(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        sessionService.deleteSession(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
