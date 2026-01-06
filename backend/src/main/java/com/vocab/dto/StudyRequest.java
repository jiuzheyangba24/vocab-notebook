package com.vocab.dto;

import lombok.Data;

/**
 * 学习记录请求
 */
@Data
public class StudyRequest {
    private Boolean isCorrect;
    private Integer timeSpent;
}
