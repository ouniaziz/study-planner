package com.studyplanner.controller;

import com.studyplanner.dto.request.SubjectRequest;
import com.studyplanner.dto.response.SubjectResponse;
import com.studyplanner.model.User;
import com.studyplanner.service.SubjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @PostMapping
    public ResponseEntity<SubjectResponse> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody SubjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(subjectService.create(user.getId(), request));
    }

    @GetMapping
    public ResponseEntity<List<SubjectResponse>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(subjectService.getAll(user.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubjectResponse> update(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody SubjectRequest request) {
        return ResponseEntity.ok(subjectService.update(user.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        subjectService.delete(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
