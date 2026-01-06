package com.vocab.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

/**
 * 添加单词请求
 */
@Data
public class AddWordRequest {

    @NotBlank(message = "单词不能为空")
    private String headWord;

    @NotBlank(message = "释义不能为空")
    private String definition;

    private String pronunciation;

    private List<String> sentences;

    private List<String> synonyms;
}
