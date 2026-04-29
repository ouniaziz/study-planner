package com.studyplanner.service;

import com.studyplanner.dto.request.SubjectRequest;
import com.studyplanner.dto.response.SubjectResponse;
import com.studyplanner.exception.StudyPlannerException;
import com.studyplanner.model.Subject;
import com.studyplanner.model.User;
import com.studyplanner.repository.SubjectRepository;
import com.studyplanner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public SubjectResponse create(UUID userId, SubjectRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> StudyPlannerException.notFound("User not found"));

        Subject subject = Subject.builder()
                .user(user)
                .name(request.getName())
                .difficulty(request.getDifficulty())
                .importance(request.getImportance())
                .examDate(request.getExamDate())
                .build();

        return toResponse(subjectRepository.save(subject));
    }

    @Transactional(readOnly = true)
    public List<SubjectResponse> getAll(UUID userId) {
        return subjectRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public SubjectResponse update(UUID userId, UUID subjectId, SubjectRequest request) {
        Subject subject = subjectRepository.findByIdAndUserId(subjectId, userId)
                .orElseThrow(() -> StudyPlannerException.notFound("Subject not found"));

        subject.setName(request.getName());
        subject.setDifficulty(request.getDifficulty());
        subject.setImportance(request.getImportance());
        subject.setExamDate(request.getExamDate());

        return toResponse(subjectRepository.save(subject));
    }

    public void delete(UUID userId, UUID subjectId) {
        if (!subjectRepository.existsByIdAndUserId(subjectId, userId)) {
            throw StudyPlannerException.notFound("Subject not found");
        }
        subjectRepository.deleteById(subjectId);
    }

    // ── Mapper ──────────────────────────────────────────────────────────────

    public SubjectResponse toResponse(Subject subject) {
        long daysUntilExam = ChronoUnit.DAYS.between(LocalDate.now(), subject.getExamDate());
        double urgency = 1.0 / (daysUntilExam + 1);
        double priorityScore = (subject.getImportance() * 0.5)
                + (subject.getDifficulty() * 0.3)
                + (urgency * 0.2);

        return SubjectResponse.builder()
                .id(subject.getId())
                .name(subject.getName())
                .difficulty(subject.getDifficulty())
                .importance(subject.getImportance())
                .examDate(subject.getExamDate())
                .daysUntilExam(Math.max(0, daysUntilExam))
                .priorityScore(Math.round(priorityScore * 100.0) / 100.0)
                .build();
    }
}
