package com.studyplanner.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "subjects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    /** Difficulty rating 1 (easy) – 5 (very hard) */
    @Column(nullable = false)
    private Integer difficulty;

    /** Importance rating 1 (low) – 5 (critical) */
    @Column(nullable = false)
    private Integer importance;

    @Column(nullable = false)
    private LocalDate examDate;

    /** Computed priority score — not persisted */
    @Transient
    private Double priorityScore;
}
