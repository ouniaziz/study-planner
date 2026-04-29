package com.studyplanner.controller;

import com.studyplanner.dto.response.StatsResponse;
import com.studyplanner.model.User;
import com.studyplanner.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping
    public ResponseEntity<StatsResponse> getStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(statsService.getStats(user.getId()));
    }
}
