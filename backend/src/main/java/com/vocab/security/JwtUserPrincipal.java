package com.vocab.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * JWT 用户主体
 */
@Getter
@AllArgsConstructor
public class JwtUserPrincipal {
    private Long userId;
    private String username;
}
