package com.vocab.controller;

import com.vocab.dto.AddWordRequest;
import com.vocab.dto.StudyRequest;
import com.vocab.entity.StudyRecord;
import com.vocab.entity.Word;
import com.vocab.entity.WrongQuestion;
import com.vocab.repository.StudyRecordRepository;
import com.vocab.repository.WordRepository;
import com.vocab.repository.WrongQuestionRepository;
import com.vocab.security.JwtUserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 单词管理控制器
 */
@RestController
@RequestMapping("/api/words")
@RequiredArgsConstructor
public class WordController {

    private static final Long DEFAULT_USER_ID = 1L;

    private final WordRepository wordRepository;
    private final StudyRecordRepository studyRecordRepository;
    private final WrongQuestionRepository wrongQuestionRepository;

    private Long getCurrentUserId(JwtUserPrincipal principal) {
        return principal != null ? principal.getUserId() : DEFAULT_USER_ID;
    }

    /**
     * 获取用户的所有单词
     */
    @GetMapping
    public ResponseEntity<?> getWords(@AuthenticationPrincipal JwtUserPrincipal principal) {
        Long userId = getCurrentUserId(principal);
        List<Word> words = wordRepository.findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(userId);

        List<Map<String, Object>> result = words.stream().map(word -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", word.getWordId());
            map.put("headWord", word.getWord());
            map.put("definition", word.getTranslation());
            map.put("pronunciation", word.getPhonetic());
            map.put("sentences", word.getExampleSentence() != null
                    ? Arrays.stream(word.getExampleSentence().split("\n"))
                            .filter(s -> !s.trim().isEmpty())
                            .collect(Collectors.toList())
                    : Collections.emptyList());
            map.put("mastery_level", word.getMasteryLevel());
            map.put("review_count", word.getReviewCount());
            map.put("correct_count", word.getCorrectCount());
            map.put("wrong_count", word.getWrongCount());
            map.put("createdAt", word.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * 添加新单词
     */
    @PostMapping
    public ResponseEntity<?> addWord(@AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody AddWordRequest request) {
        Long userId = getCurrentUserId(principal);

        // 检查单词是否已存在
        if (wordRepository.findByUserIdAndWordAndIsDeletedFalse(userId, request.getHeadWord().toLowerCase())
                .isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "该单词已存在"));
        }

        Word word = new Word();
        word.setUserId(userId);
        word.setWord(request.getHeadWord());
        word.setTranslation(request.getDefinition());
        word.setPhonetic(request.getPronunciation() != null ? request.getPronunciation() : "");
        word.setExampleSentence(request.getSentences() != null ? String.join("\n", request.getSentences()) : "");

        word = wordRepository.save(word);

        Map<String, Object> result = new HashMap<>();
        result.put("id", word.getWordId());
        result.put("headWord", word.getWord());
        result.put("pronunciation", word.getPhonetic());
        result.put("definition", word.getTranslation());
        result.put("sentences", request.getSentences() != null ? request.getSentences() : Collections.emptyList());
        result.put("synonyms", request.getSynonyms() != null ? request.getSynonyms() : Collections.emptyList());
        result.put("createdAt", word.getCreatedAt());

        return ResponseEntity.ok(result);
    }

    /**
     * 删除单词（软删除）
     */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteWord(@AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long id) {
        Long userId = getCurrentUserId(principal);

        int affected = wordRepository.softDelete(id, userId);
        if (affected == 0) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of("message", "单词删除成功"));
    }

    /**
     * 获取单词总数
     */
    @GetMapping("/count")
    public ResponseEntity<?> getWordCount(@AuthenticationPrincipal JwtUserPrincipal principal) {
        Long userId = getCurrentUserId(principal);
        long count = wordRepository.countByUserIdAndIsDeletedFalse(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * 记录学习结果
     */
    @PostMapping("/{id}/study")
    @Transactional
    public ResponseEntity<?> recordStudy(@AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long id,
            @RequestBody StudyRequest request) {
        Long userId = getCurrentUserId(principal);

        // 保存学习记录
        StudyRecord record = new StudyRecord();
        record.setUserId(userId);
        record.setWordId(id);
        record.setStudyMode(StudyRecord.StudyMode.review);
        record.setIsCorrect(request.getIsCorrect());
        record.setTimeSpent(request.getTimeSpent() != null ? request.getTimeSpent() : 0);
        record.setStudyDate(LocalDate.now());

        studyRecordRepository.save(record);

        // 更新单词统计
        Word word = wordRepository.findById(id).orElse(null);
        if (word != null) {
            word.setReviewCount(word.getReviewCount() + 1);
            word.setLastReviewedAt(LocalDateTime.now());

            if (request.getIsCorrect()) {
                word.setCorrectCount(word.getCorrectCount() + 1);
                word.setMasteryLevel(Math.min(100, word.getMasteryLevel() + 5));
            } else {
                word.setWrongCount(word.getWrongCount() + 1);
                word.setMasteryLevel(Math.max(0, word.getMasteryLevel() - 3));

                // 添加到错题本
                WrongQuestion wq = wrongQuestionRepository.findByUserIdAndWordId(userId, id)
                        .orElse(new WrongQuestion());
                if (wq.getWrongId() == null) {
                    wq.setUserId(userId);
                    wq.setWordId(id);
                    wq.setWrongCount(1);
                } else {
                    wq.setWrongCount(wq.getWrongCount() + 1);
                }
                wq.setLastWrongAt(LocalDateTime.now());
                wrongQuestionRepository.save(wq);
            }
            wordRepository.save(word);
        }

        return ResponseEntity.ok(Map.of("message", "学习记录已保存"));
    }
}
