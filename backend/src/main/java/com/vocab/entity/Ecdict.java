package com.vocab.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * ECDICT 词典实体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ecdict")
public class Ecdict {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String word;

    private String phonetic;

    @Column(columnDefinition = "TEXT")
    private String definition;

    @Column(columnDefinition = "TEXT")
    private String translation;

    @Column(length = 100)
    private String pos;

    private Integer collins;

    private Integer oxford;

    private String tag;

    private Integer bnc;

    private Integer frq;

    @Column(length = 500)
    private String exchange;

    @Column(columnDefinition = "TEXT")
    private String detail;

    private String audio;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
