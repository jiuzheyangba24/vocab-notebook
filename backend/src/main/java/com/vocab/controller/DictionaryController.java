package com.vocab.controller;

import com.vocab.entity.Ecdict;
import com.vocab.repository.EcdictRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 词典查询控制器 - 带缓存优化
 */
@RestController
@RequestMapping("/api/dictionary")
@RequiredArgsConstructor
public class DictionaryController {

    private final EcdictRepository ecdictRepository;

    // LRU 缓存：最多缓存 10000 个单词，快速响应常用词汇
    private static final int CACHE_SIZE = 10000;
    private static final Map<String, Map<String, Object>> cache = Collections
            .synchronizedMap(new LinkedHashMap<String, Map<String, Object>>(CACHE_SIZE, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, Map<String, Object>> eldest) {
                    return size() > CACHE_SIZE;
                }
            });

    /**
     * 查询单词详情（带缓存）
     */
    @GetMapping("/{word}")
    public ResponseEntity<?> lookup(@PathVariable String word) {
        if (word == null || word.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "请输入要查询的单词"));
        }

        String key = word.toLowerCase().trim();

        // 1. 先查缓存
        if (cache.containsKey(key)) {
            Map<String, Object> cached = new HashMap<>(cache.get(key));
            cached.put("cached", true);
            return ResponseEntity.ok(cached);
        }

        // 2. 从本地 ECDICT 数据库查询
        Optional<Ecdict> localResult = ecdictRepository.findByWord(key);

        if (localResult.isPresent()) {
            Map<String, Object> result = buildResult(localResult.get());
            result.put("source", "local");
            cache.put(key, result); // 存入缓存
            return ResponseEntity.ok(result);
        }

        // 3. 本地无结果，尝试第三方 API
        try {
            RestTemplate restTemplate = new RestTemplate();
            String apiUrl = "https://v2.xxapi.cn/api/englishwords?word=" + word;
            @SuppressWarnings("unchecked")
            Map<String, Object> apiResponse = restTemplate.getForObject(apiUrl, Map.class);

            if (apiResponse != null && Integer.valueOf(200).equals(apiResponse.get("code"))) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) apiResponse.get("data");
                if (data != null && data.get("word") != null) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("word", data.get("word"));
                    result.put("pronunciation", data.get("ukphone") != null ? data.get("ukphone")
                            : (data.get("usphone") != null ? data.get("usphone") : ""));

                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> translations = (List<Map<String, Object>>) data.get("translations");
                    if (translations != null && !translations.isEmpty()) {
                        result.put("definition", translations.get(0).get("tran_cn"));
                    } else {
                        result.put("definition", "无释义");
                    }

                    result.put("sentences", Collections.emptyList());
                    result.put("synonyms", Collections.emptyList());
                    result.put("source", "api");

                    cache.put(key, result); // 存入缓存
                    return ResponseEntity.ok(result);
                }
            }
        } catch (Exception e) {
            // API 调用失败
        }

        return ResponseEntity.notFound().build();
    }

    /**
     * 获取缓存统计
     */
    @GetMapping("/cache/stats")
    public ResponseEntity<?> cacheStats() {
        return ResponseEntity.ok(Map.of(
                "size", cache.size(),
                "maxSize", CACHE_SIZE));
    }

    /**
     * 清空缓存
     */
    @DeleteMapping("/cache")
    public ResponseEntity<?> clearCache() {
        cache.clear();
        return ResponseEntity.ok(Map.of("message", "缓存已清空"));
    }

    private Map<String, Object> buildResult(Ecdict dict) {
        Map<String, String> exchanges = new HashMap<>();
        if (dict.getExchange() != null && !dict.getExchange().isEmpty()) {
            for (String item : dict.getExchange().split("/")) {
                String[] parts = item.split(":");
                if (parts.length == 2) {
                    exchanges.put(parts[0], parts[1]);
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("word", dict.getWord());
        result.put("pronunciation", dict.getPhonetic() != null ? dict.getPhonetic() : "");
        result.put("definition", dict.getTranslation() != null ? dict.getTranslation()
                : (dict.getDefinition() != null ? dict.getDefinition() : "无释义"));
        result.put("englishDefinition", dict.getDefinition() != null ? dict.getDefinition() : "");
        result.put("pos", dict.getPos() != null ? dict.getPos() : "");
        result.put("collins", dict.getCollins());
        result.put("tag", dict.getTag() != null ? dict.getTag() : "");
        result.put("exchanges", exchanges);
        result.put("sentences", Collections.emptyList());
        result.put("synonyms", Collections.emptyList());

        return result;
    }
}
