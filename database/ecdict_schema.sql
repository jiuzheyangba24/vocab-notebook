-- ============================================
-- ECDICT 词典数据表
-- 存储开源英汉词典数据，替代外部 API 调用
-- ============================================

USE vocab_learning_system;

-- ============================================
-- 词典表 (ecdict)
-- ============================================
CREATE TABLE IF NOT EXISTS ecdict (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '自增ID',
    word VARCHAR(255) NOT NULL COMMENT '单词',
    phonetic VARCHAR(255) COMMENT '音标（英式为主）',
    definition TEXT COMMENT '英文释义',
    translation TEXT COMMENT '中文翻译',
    pos VARCHAR(100) COMMENT '词性',
    collins TINYINT COMMENT '柯林斯星级（1-5）',
    oxford TINYINT COMMENT '是否牛津3000核心词（0/1）',
    tag VARCHAR(255) COMMENT '考试标签：zk/gk/cet4/cet6/ky/gre/toefl等',
    bnc INT COMMENT '英国国家语料库词频',
    frq INT COMMENT '当代语料库词频',
    exchange VARCHAR(500) COMMENT '词形变化：p:过去式/d:过去分词/i:现在分词等',
    detail TEXT COMMENT 'JSON扩展信息',
    audio VARCHAR(255) COMMENT '发音音频URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    -- 索引优化查询性能
    UNIQUE KEY uk_word (word),
    INDEX idx_word_prefix (word(10)),
    INDEX idx_tag (tag(50)),
    INDEX idx_collins (collins),
    INDEX idx_bnc (bnc),
    INDEX idx_frq (frq)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ECDICT英汉词典表';

-- ============================================
-- 查询示例
-- ============================================
-- 精确查询：SELECT * FROM ecdict WHERE word = 'apple';
-- 前缀查询：SELECT * FROM ecdict WHERE word LIKE 'app%' LIMIT 10;
-- 按词频排序：SELECT * FROM ecdict WHERE bnc IS NOT NULL ORDER BY bnc LIMIT 100;
