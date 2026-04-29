package com.studyplanner.service;

import com.studyplanner.dto.response.StudySessionResponse;
import com.studyplanner.exception.StudyPlannerException;
import com.studyplanner.model.SessionStatus;
import com.studyplanner.model.StudySession;
import com.studyplanner.repository.StudySessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionService {

    private final StudySessionRepository sessionRepository;
    private final StudyPlannerService plannerService;

    public StudySessionResponse markComplete(UUID userId, UUID sessionId) {
        StudySession session = getOwnedSession(userId, sessionId);
        session.setStatus(SessionStatus.COMPLETED);
        return plannerService.toResponse(sessionRepository.save(session));
    }

    public StudySessionResponse markMissed(UUID userId, UUID sessionId) {
        StudySession session = getOwnedSession(userId, sessionId);
        session.setStatus(SessionStatus.MISSED);
        return plannerService.toResponse(sessionRepository.save(session));
    }

    public void deleteSession(UUID userId, UUID sessionId) {
        StudySession session = getOwnedSession(userId, sessionId);
        sessionRepository.delete(session);
    }

    private StudySession getOwnedSession(UUID userId, UUID sessionId) {
        return sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> StudyPlannerException.notFound("Session not found"));
    }
}
