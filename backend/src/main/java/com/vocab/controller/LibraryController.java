package com.vocab.controller;

import com.vocab.repository.EcdictRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 词库控制器 - 提供按考试标签查询词汇
 */
@RestController
@RequestMapping("/api/library")
@RequiredArgsConstructor
public class LibraryController {

    private final EntityManager entityManager;

    // 缓存词库数据（5分钟）
    private static final Map<String, List<Map<String, Object>>> cache = new HashMap<>();
    private static final Map<String, Long> cacheTime = new HashMap<>();
    private static final long CACHE_TTL = 5 * 60 * 1000; // 5分钟

    /**
     * 获取词库列表
     */
    @GetMapping("/{tag}")
    public ResponseEntity<?> getLibraryWords(
            @PathVariable String tag,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "500") int limit) {

        // 将简化标签映射到实际数据库标签
        String dbTag = mapTag(tag);

        // 检查缓存
        String cacheKey = dbTag + "_" + offset + "_" + limit;
        if (cache.containsKey(cacheKey) &&
                System.currentTimeMillis() - cacheTime.getOrDefault(cacheKey, 0L) < CACHE_TTL) {
            return ResponseEntity.ok(Map.of(
                    "words", cache.get(cacheKey),
                    "cached", true));
        }

        // 从数据库查询
        String sql = """
                SELECT word, phonetic, translation, pos, collins, exchange
                FROM ecdict
                WHERE tag LIKE :tag
                ORDER BY frq DESC, word ASC
                LIMIT :limit OFFSET :offset
                """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("tag", "%" + dbTag + "%");
        query.setParameter("limit", limit);
        query.setParameter("offset", offset);

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        List<Map<String, Object>> words = results.stream().map(row -> {
            Map<String, Object> word = new HashMap<>();
            word.put("word", row[0]);
            word.put("phonetic", row[1] != null ? row[1] : "");
            word.put("translations", parseTranslation((String) row[2]));
            word.put("pos", row[3] != null ? row[3] : "");
            word.put("collins", row[4]);
            word.put("exchange", row[5] != null ? row[5] : "");
            return word;
        }).collect(Collectors.toList());

        // 存入缓存
        cache.put(cacheKey, words);
        cacheTime.put(cacheKey, System.currentTimeMillis());

        return ResponseEntity.ok(Map.of(
                "words", words,
                "count", words.size(),
                "cached", false));
    }

    /**
     * 获取词库词数
     */
    @GetMapping("/{tag}/count")
    public ResponseEntity<?> getLibraryCount(@PathVariable String tag) {
        String dbTag = mapTag(tag);

        String sql = "SELECT COUNT(*) FROM ecdict WHERE tag LIKE :tag";
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("tag", "%" + dbTag + "%");

        Number count = (Number) query.getSingleResult();

        return ResponseEntity.ok(Map.of("count", count.longValue()));
    }

    /**
     * 批量查询单词详情
     */
    @PostMapping("/batch")
    public ResponseEntity<?> batchLookup(@RequestBody Map<String, List<String>> request) {
        List<String> words = request.get("words");
        if (words == null || words.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "请提供单词列表"));
        }

        // 限制单次查询数量
        if (words.size() > 100) {
            words = words.subList(0, 100);
        }

        String sql = """
                SELECT word, phonetic, translation, definition, pos, collins, tag, exchange
                FROM ecdict
                WHERE word IN :words
                """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("words", words);

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        Map<String, Map<String, Object>> resultMap = new HashMap<>();
        for (Object[] row : results) {
            Map<String, Object> wordData = new HashMap<>();
            wordData.put("word", row[0]);
            wordData.put("phonetic", row[1] != null ? row[1] : "");
            wordData.put("translation", row[2] != null ? row[2] : "");
            wordData.put("definition", row[3] != null ? row[3] : "");
            wordData.put("pos", row[4] != null ? row[4] : "");
            wordData.put("collins", row[5]);
            wordData.put("tag", row[6] != null ? row[6] : "");
            wordData.put("exchange", row[7] != null ? row[7] : "");
            resultMap.put((String) row[0], wordData);
        }

        return ResponseEntity.ok(Map.of("words", resultMap));
    }

    private String mapTag(String tag) {
        return switch (tag.toLowerCase()) {
            case "chuzhong", "junior" -> "zk";
            case "gaozhong", "senior" -> "gk";
            case "cet4" -> "cet4";
            case "cet6" -> "cet6";
            case "kaoyan", "graduate" -> "ky";
            case "toefl" -> "toefl";
            case "ielts" -> "ielts";
            case "gre" -> "gre";
            case "sat" -> "sat";
            default -> tag;
        };
    }

    private List<Map<String, String>> parseTranslation(String translation) {
        if (translation == null || translation.isEmpty()) {
            return Collections.emptyList();
        }

        List<Map<String, String>> result = new ArrayList<>();
        // 按换行分割
        String[] parts = translation.split("\\\\n|\\n");
        for (String part : parts) {
            part = part.trim();
            if (part.isEmpty())
                continue;

            Map<String, String> trans = new HashMap<>();
            // 尝试提取词性
            if (part.matches("^[a-z]+\\..*")) {
                int dotIndex = part.indexOf('.');
                trans.put("type", part.substring(0, dotIndex));
                trans.put("translation", part.substring(dotIndex + 1).trim());
            } else {
                trans.put("type", "");
                trans.put("translation", part);
            }
            result.add(trans);
        }
        return result;
    }
}
