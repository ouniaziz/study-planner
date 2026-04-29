package com.studyplanner.controller;

import com.studyplanner.dto.request.GeneratePlanRequest;
import com.studyplanner.dto.response.StudySessionResponse;
import com.studyplanner.model.User;
import com.studyplanner.service.StudyPlannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/planner")
@RequiredArgsConstructor
public class PlannerController {

    private final StudyPlannerService plannerService;

    @PostMapping("/generate")
    public ResponseEntity<Map<String, List<StudySessionResponse>>> generate(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody GeneratePlanRequest request) {
        return ResponseEntity.ok(plannerService.generatePlan(user.getId(), request));
    }

    @GetMapping
    public ResponseEntity<Map<String, List<StudySessionResponse>>> getSessions(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(plannerService.getSessions(user.getId()));
    }
}
