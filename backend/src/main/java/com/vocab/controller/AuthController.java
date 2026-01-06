package com.vocab.controller;

import com.vocab.dto.*;
import com.vocab.entity.User;
import com.vocab.repository.UserRepository;
import com.vocab.security.JwtTokenProvider;
import com.vocab.security.JwtUserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 认证控制器
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    /**
     * 注册
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        // 检查用户名或邮箱是否已存在
        if (userRepository.existsByUsernameOrEmail(request.getUsername(), request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "用户已存在", "message", "用户名或邮箱已被注册"));
        }

        // 创建用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname() != null ? request.getNickname() : request.getUsername());

        user = userRepository.save(user);

        // 生成 Token
        String token = tokenProvider.generateToken(user.getUserId(), user.getUsername(), user.getEmail());

        AuthResponse response = new AuthResponse(
                "注册成功",
                new AuthResponse.UserDto(user.getUserId(), user.getUsername(), user.getEmail(), user.getNickname()),
                token);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 登录
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        // 查找用户（支持用户名或邮箱登录）
        User user = userRepository.findByUsernameOrEmail(request.getUsername(), request.getUsername())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "登录失败", "message", "用户名或密码错误"));
        }

        // 检查账号是否激活
        if (!user.getIsActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "账号已禁用", "message", "您的账号已被禁用，请联系管理员"));
        }

        // 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "登录失败", "message", "用户名或密码错误"));
        }

        // 更新最后登录时间
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // 生成 Token
        String token = tokenProvider.generateToken(user.getUserId(), user.getUsername(), user.getEmail());

        AuthResponse response = new AuthResponse(
                "登录成功",
                new AuthResponse.UserDto(user.getUserId(), user.getUsername(), user.getEmail(), user.getNickname()),
                token);

        return ResponseEntity.ok(response);
    }

    /**
     * 获取当前用户信息
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal JwtUserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "未授权", "message", "请先登录"));
        }

        User user = userRepository.findById(principal.getUserId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "用户不存在"));
        }

        Map<String, Object> response = new HashMap<>();
        Map<String, Object> userDto = new HashMap<>();
        userDto.put("user_id", user.getUserId());
        userDto.put("username", user.getUsername());
        userDto.put("email", user.getEmail());
        userDto.put("nickname", user.getNickname());
        userDto.put("avatar_url", user.getAvatarUrl());
        userDto.put("total_study_days", user.getTotalStudyDays());
        userDto.put("total_words_learned", user.getTotalWordsLearned());
        userDto.put("current_streak", user.getCurrentStreak());
        userDto.put("longest_streak", user.getLongestStreak());
        userDto.put("created_at", user.getCreatedAt());
        userDto.put("last_login_at", user.getLastLoginAt());

        response.put("user", userDto);
        return ResponseEntity.ok(response);
    }

    /**
     * 登出
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "登出成功"));
    }
}
