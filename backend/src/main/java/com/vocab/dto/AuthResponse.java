package com.vocab.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 认证响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String message;
    private UserDto user;
    private String token;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private Long userId;
        private String username;
        private String email;
        private String nickname;
    }
}
