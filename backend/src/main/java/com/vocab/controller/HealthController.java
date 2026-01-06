package com.vocab.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 健康检查控制器
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;

    /**
     * 健康检查
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        String dbStatus = "disconnected";

        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(2)) {
                dbStatus = "connected";
            }
        } catch (Exception e) {
            // 连接失败
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", "ok");
        result.put("database", dbStatus);
        result.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(result);
    }
}
