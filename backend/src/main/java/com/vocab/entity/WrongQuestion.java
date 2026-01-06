package com.vocab.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * 错题本实体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "wrong_questions")
public class WrongQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "wrong_id")
    private Long wrongId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "word_id", nullable = false)
    private Long wordId;

    @Column(name = "wrong_count")
    private Integer wrongCount = 1;

    @Column(name = "last_wrong_at")
    private LocalDateTime lastWrongAt;

    @Column(name = "is_mastered")
    private Boolean isMastered = false;

    @Column(name = "mastered_at")
    private LocalDateTime masteredAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    protected void onCreate() {
        lastWrongAt = LocalDateTime.now();
    }
}
