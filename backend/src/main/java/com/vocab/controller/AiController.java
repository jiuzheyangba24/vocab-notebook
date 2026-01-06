package com.vocab.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * AI 助手控制器
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    @Value("${ai.api-key}")
    private String apiKey;

    @Value("${ai.api-url}")
    private String apiUrl;

    private static final String SYSTEM_PROMPT = """
            你是一个专业的英语词汇学习助手。你的主要功能包括：
            1. 解释英语单词的含义、用法、例句
            2. 帮助用户制定背诵计划
            3. 提供学习建议和技巧
            4. 回答英语学习相关问题

            请用简洁友好的中文回答用户问题。如果用户询问单词，请提供：
            - 音标
            - 中文释义
            - 词性
            - 例句（中英对照）
            - 相关词汇
            """;

    /**
     * AI 对话
     */
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Map<String, String>> messages = (List<Map<String, String>>) request.get("messages");

        if (messages == null || messages.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "请提供对话消息"));
        }

        try {
            String reply = callAiApi(messages);
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "AI 服务暂时不可用", "message", e.getMessage()));
        }
    }

    /**
     * AI 单词查询
     */
    @PostMapping("/lookup")
    public ResponseEntity<?> lookup(@RequestBody Map<String, String> request) {
        String word = request.get("word");

        if (word == null || word.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "请提供要查询的单词"));
        }

        try {
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "user", "content", "请详细解释单词 \"" + word + "\" 的含义和用法"));

            String explanation = callAiApi(messages);
            return ResponseEntity.ok(Map.of("explanation", explanation));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "AI 服务暂时不可用", "message", e.getMessage()));
        }
    }

    private String callAiApi(List<Map<String, String>> userMessages) {
        RestTemplate restTemplate = new RestTemplate();

        // 构建请求体
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        messages.addAll(userMessages);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "qwen-turbo");
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 1000);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(apiUrl, entity, Map.class);

        if (response != null) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices != null && !choices.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, String> message = (Map<String, String>) choices.get(0).get("message");
                if (message != null) {
                    return message.get("content");
                }
            }
        }

        throw new RuntimeException("AI 响应解析失败");
    }
}
