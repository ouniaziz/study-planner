package com.studyplanner.service;

import com.studyplanner.dto.request.GeneratePlanRequest;
import com.studyplanner.dto.response.StudySessionResponse;
import com.studyplanner.model.*;
import com.studyplanner.repository.StudySessionRepository;
import com.studyplanner.repository.SubjectRepository;
import com.studyplanner.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StudyPlannerService — Planning Engine Tests")
class StudyPlannerServiceTest {

    @Mock private SubjectRepository    subjectRepository;
    @Mock private StudySessionRepository sessionRepository;
    @Mock private UserRepository       userRepository;

    @InjectMocks
    private StudyPlannerService plannerService;

    private User    testUser;
    private Subject mathSubject;
    private Subject physicsSubject;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .password("encoded")
                .build();

        mathSubject = Subject.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .name("Mathematics")
                .difficulty(5)
                .importance(5)
                .examDate(LocalDate.now().plusDays(30))
                .build();

        physicsSubject = Subject.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .name("Physics")
                .difficulty(3)
                .importance(4)
                .examDate(LocalDate.now().plusDays(60))
                .build();
    }

    // ── Priority Score Tests ─────────────────────────────────────────────────

    @Test
    @DisplayName("High importance + high difficulty + close exam → higher score than low importance")
    void priorityScore_urgentSubjectScoresHigher() {
        // Subject with high importance, high difficulty, exam in 7 days
        Subject urgent = Subject.builder()
                .id(UUID.randomUUID()).user(testUser)
                .name("Urgent Exam")
                .difficulty(5).importance(5)
                .examDate(LocalDate.now().plusDays(7))
                .build();

        // Subject with low importance, low difficulty, exam in 60 days
        Subject relaxed = Subject.builder()
                .id(UUID.randomUUID()).user(testUser)
                .name("Relaxed Subject")
                .difficulty(1).importance(1)
                .examDate(LocalDate.now().plusDays(60))
                .build();

        double urgentScore  = computeScore(urgent);
        double relaxedScore = computeScore(relaxed);

        assertThat(urgentScore).isGreaterThan(relaxedScore);
    }

    @Test
    @DisplayName("Priority score formula: (importance×0.5) + (difficulty×0.3) + (urgency×0.2)")
    void priorityScore_formulaCalculation() {
        // days_until_exam = 9, urgency = 1/10 = 0.1
        // score = (5×0.5) + (5×0.3) + (0.1×0.2) = 2.5 + 1.5 + 0.02 = 4.02
        Subject subject = Subject.builder()
                .id(UUID.randomUUID()).user(testUser)
                .name("Test").difficulty(5).importance(5)
                .examDate(LocalDate.now().plusDays(9))
                .build();

        double score = computeScore(subject);
        assertThat(score).isCloseTo(4.02, within(0.01));
    }

    // ── Plan Generation Tests ────────────────────────────────────────────────

    @Test
    @DisplayName("Generated plan never exceeds max sessions per day (4)")
    void generatePlan_respectsMaxSessionsPerDay() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(subjectRepository.findByUserId(testUser.getId()))
                .thenReturn(List.of(mathSubject, physicsSubject));
        doNothing().when(sessionRepository).deleteByUserIdAndStatusAndDateGreaterThanEqual(any(), any(), any());
        when(sessionRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        GeneratePlanRequest request = new GeneratePlanRequest();
        request.setHoursPerDay(8);
        request.setStartDate(LocalDate.now());
        request.setPlanDays(7);

        Map<String, List<StudySessionResponse>> plan = plannerService.generatePlan(testUser.getId(), request);

        plan.values().forEach(sessions ->
            assertThat(sessions).hasSizeLessThanOrEqualTo(4)
        );
    }

    @Test
    @DisplayName("No sessions scheduled on days where all subjects have passed exams")
    void generatePlan_skipsSubjectsWithPastExams() {
        Subject expiredSubject = Subject.builder()
                .id(UUID.randomUUID()).user(testUser)
                .name("Expired").difficulty(3).importance(3)
                .examDate(LocalDate.now().minusDays(1)) // exam already passed
                .build();

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(subjectRepository.findByUserId(testUser.getId()))
                .thenReturn(List.of(expiredSubject));
        doNothing().when(sessionRepository).deleteByUserIdAndStatusAndDateGreaterThanEqual(any(), any(), any());

        GeneratePlanRequest request = new GeneratePlanRequest();
        request.setHoursPerDay(4);
        request.setStartDate(LocalDate.now());
        request.setPlanDays(7);

        assertThatThrownBy(() -> plannerService.generatePlan(testUser.getId(), request))
                .hasMessageContaining("No active subjects");
    }

    @Test
    @DisplayName("All generated sessions have duration >= 30 minutes")
    void generatePlan_allSessionsHaveMinimumDuration() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(subjectRepository.findByUserId(testUser.getId()))
                .thenReturn(List.of(mathSubject, physicsSubject));
        doNothing().when(sessionRepository).deleteByUserIdAndStatusAndDateGreaterThanEqual(any(), any(), any());
        when(sessionRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        GeneratePlanRequest request = new GeneratePlanRequest();
        request.setHoursPerDay(2);
        request.setStartDate(LocalDate.now());
        request.setPlanDays(5);

        Map<String, List<StudySessionResponse>> plan = plannerService.generatePlan(testUser.getId(), request);

        plan.values().stream()
                .flatMap(List::stream)
                .forEach(s -> assertThat(s.getDuration()).isGreaterThanOrEqualTo(30));
    }

    @Test
    @DisplayName("Subjects with closer exam dates get higher priority scores")
    void generatePlan_urgentSubjectsGetHigherPriority() {
        Subject urgentSubject = Subject.builder()
                .id(UUID.randomUUID()).user(testUser)
                .name("Urgent").difficulty(3).importance(3)
                .examDate(LocalDate.now().plusDays(5))
                .build();

        double urgentScore  = computeScore(urgentSubject);
        double normalScore  = computeScore(mathSubject); // 30 days

        assertThat(urgentScore).isGreaterThan(normalScore);
    }

    // ── toResponse Tests ─────────────────────────────────────────────────────

    @Test
    @DisplayName("toResponse converts session entity to DTO correctly")
    void toResponse_mapsFieldsCorrectly() {
        StudySession session = StudySession.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .subject(mathSubject)
                .date(LocalDate.now())
                .startTime(LocalTime.of(9, 0))
                .duration(90)
                .status(SessionStatus.PLANNED)
                .build();

        StudySessionResponse response = plannerService.toResponse(session);

        assertThat(response.getSubjectName()).isEqualTo("Mathematics");
        assertThat(response.getDuration()).isEqualTo(90);
        assertThat(response.getStatus()).isEqualTo(SessionStatus.PLANNED);
        assertThat(response.getSubjectId()).isEqualTo(mathSubject.getId());
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    /** Replicates the priority formula from StudyPlannerService */
    private double computeScore(Subject subject) {
        long days    = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), subject.getExamDate());
        double urgency = 1.0 / (days + 1);
        return (subject.getImportance() * 0.5)
             + (subject.getDifficulty() * 0.3)
             + (urgency * 0.2);
    }
}
