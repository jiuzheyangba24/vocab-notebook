package com.vocab.controller;

import com.vocab.repository.WordRepository;
import com.vocab.repository.WrongQuestionRepository;
import com.vocab.security.JwtUserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 统计数据控制器
 */
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private static final Long DEFAULT_USER_ID = 1L;

    private final WordRepository wordRepository;
    private final WrongQuestionRepository wrongQuestionRepository;

    private Long getCurrentUserId(JwtUserPrincipal principal) {
        return principal != null ? principal.getUserId() : DEFAULT_USER_ID;
    }

    /**
     * 获取学习统计数据
     */
    @GetMapping
    public ResponseEntity<?> getStats(@AuthenticationPrincipal JwtUserPrincipal principal) {
        Long userId = getCurrentUserId(principal);

        long totalWords = wordRepository.countByUserIdAndIsDeletedFalse(userId);
        long masteredWords = wordRepository.countMasteredWords(userId);
        Double avgMastery = wordRepository.getAverageMastery(userId);
        Long totalReviews = wordRepository.getTotalReviews(userId);
        long wrongWords = wrongQuestionRepository.countByUserIdAndIsMasteredFalse(userId);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalWords", totalWords);
        stats.put("masteredWords", masteredWords);
        stats.put("avgMastery", avgMastery != null ? Math.round(avgMastery) : 0);
        stats.put("totalReviews", totalReviews != null ? totalReviews : 0);
        stats.put("wrongWords", wrongWords);

        return ResponseEntity.ok(stats);
    }
}
