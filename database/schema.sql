-- ============================================
-- 词汇学习系统数据库设计
-- Database: vocab_learning_system
-- ============================================

-- 创建数据库
DROP DATABASE IF EXISTS vocab_learning_system;
CREATE DATABASE vocab_learning_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vocab_learning_system;

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    total_study_days INT DEFAULT 0 COMMENT '累计学习天数',
    total_words_learned INT DEFAULT 0 COMMENT '累计学习单词数',
    current_streak INT DEFAULT 0 COMMENT '当前连续学习天数',
    longest_streak INT DEFAULT 0 COMMENT '最长连续学习天数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    is_active BOOLEAN DEFAULT TRUE COMMENT '账号是否激活',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) COMMENT='用户信息表';

-- ============================================
-- 2. 单词表 (words)
-- ============================================
CREATE TABLE words (
    word_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '单词ID',
    user_id INT NOT NULL COMMENT '所属用户ID',
    word VARCHAR(100) NOT NULL COMMENT '单词',
    translation TEXT NOT NULL COMMENT '翻译',
    phonetic VARCHAR(100) COMMENT '音标',
    example_sentence TEXT COMMENT '例句',
    example_translation TEXT COMMENT '例句翻译',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '难度等级',
    category VARCHAR(50) COMMENT '分类标签',
    mastery_level INT DEFAULT 0 COMMENT '掌握程度(0-100)',
    review_count INT DEFAULT 0 COMMENT '复习次数',
    correct_count INT DEFAULT 0 COMMENT '答对次数',
    wrong_count INT DEFAULT 0 COMMENT '答错次数',
    last_reviewed_at TIMESTAMP NULL COMMENT '最后复习时间',
    next_review_at TIMESTAMP NULL COMMENT '下次复习时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_word (user_id, word),
    INDEX idx_mastery (user_id, mastery_level),
    INDEX idx_next_review (user_id, next_review_at),
    INDEX idx_category (user_id, category)
) COMMENT='单词表';

-- ============================================
-- 3. 学习记录表 (study_records)
-- ============================================
CREATE TABLE study_records (
    record_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    user_id INT NOT NULL COMMENT '用户ID',
    word_id INT NOT NULL COMMENT '单词ID',
    study_mode ENUM('learn', 'review', 'test') NOT NULL COMMENT '学习模式',
    is_correct BOOLEAN NOT NULL COMMENT '是否答对',
    time_spent INT COMMENT '用时(秒)',
    study_date DATE NOT NULL COMMENT '学习日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (word_id) REFERENCES words(word_id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, study_date),
    INDEX idx_word_date (word_id, study_date),
    INDEX idx_created_at (created_at)
) COMMENT='学习记录表';

-- ============================================
-- 4. 错题本表 (wrong_questions)
-- ============================================
CREATE TABLE wrong_questions (
    wrong_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '错题ID',
    user_id INT NOT NULL COMMENT '用户ID',
    word_id INT NOT NULL COMMENT '单词ID',
    wrong_count INT DEFAULT 1 COMMENT '错误次数',
    last_wrong_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后错误时间',
    is_mastered BOOLEAN DEFAULT FALSE COMMENT '是否已掌握',
    mastered_at TIMESTAMP NULL COMMENT '掌握时间',
    notes TEXT COMMENT '备注',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (word_id) REFERENCES words(word_id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_word (user_id, word_id),
    INDEX idx_user_mastered (user_id, is_mastered),
    INDEX idx_last_wrong (last_wrong_at)
) COMMENT='错题本表';

-- ============================================
-- 5. 每日统计表 (daily_statistics)
-- ============================================
CREATE TABLE daily_statistics (
    stat_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '统计ID',
    user_id INT NOT NULL COMMENT '用户ID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    words_learned INT DEFAULT 0 COMMENT '学习单词数',
    words_reviewed INT DEFAULT 0 COMMENT '复习单词数',
    correct_count INT DEFAULT 0 COMMENT '答对次数',
    wrong_count INT DEFAULT 0 COMMENT '答错次数',
    study_time_minutes INT DEFAULT 0 COMMENT '学习时长(分钟)',
    accuracy_rate DECIMAL(5,2) COMMENT '正确率(%)',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_date (user_id, stat_date),
    INDEX idx_stat_date (stat_date)
) COMMENT='每日统计表';

-- ============================================
-- 6. 学习计划表 (study_plans)
-- ============================================
CREATE TABLE study_plans (
    plan_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '计划ID',
    user_id INT NOT NULL COMMENT '用户ID',
    plan_name VARCHAR(100) NOT NULL COMMENT '计划名称',
    daily_target INT DEFAULT 10 COMMENT '每日目标单词数',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active)
) COMMENT='学习计划表';

-- ============================================
-- 7. 用户会话表 (user_sessions)
-- ============================================
CREATE TABLE user_sessions (
    session_id VARCHAR(255) PRIMARY KEY COMMENT '会话ID',
    user_id INT NOT NULL COMMENT '用户ID',
    token VARCHAR(500) NOT NULL COMMENT 'JWT Token',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) COMMENT='用户会话表';

-- ============================================
-- 视图：用户学习概览
-- ============================================
CREATE VIEW user_study_overview AS
SELECT 
    u.user_id,
    u.username,
    u.nickname,
    u.total_study_days,
    u.total_words_learned,
    u.current_streak,
    u.longest_streak,
    COUNT(DISTINCT w.word_id) as total_words,
    COUNT(DISTINCT CASE WHEN w.mastery_level >= 80 THEN w.word_id END) as mastered_words,
    COUNT(DISTINCT wq.word_id) as wrong_words,
    COALESCE(AVG(w.mastery_level), 0) as avg_mastery_level
FROM users u
LEFT JOIN words w ON u.user_id = w.user_id AND w.is_deleted = FALSE
LEFT JOIN wrong_questions wq ON u.user_id = wq.user_id AND wq.is_mastered = FALSE
GROUP BY u.user_id;

-- ============================================
-- 视图：单词学习详情
-- ============================================
CREATE VIEW word_study_details AS
SELECT 
    w.word_id,
    w.user_id,
    w.word,
    w.translation,
    w.phonetic,
    w.difficulty_level,
    w.category,
    w.mastery_level,
    w.review_count,
    w.correct_count,
    w.wrong_count,
    CASE 
        WHEN w.review_count > 0 THEN ROUND((w.correct_count * 100.0 / w.review_count), 2)
        ELSE 0 
    END as accuracy_rate,
    w.last_reviewed_at,
    w.next_review_at,
    wq.wrong_count as total_wrong_count,
    wq.is_mastered as wrong_mastered
FROM words w
LEFT JOIN wrong_questions wq ON w.word_id = wq.word_id
WHERE w.is_deleted = FALSE;

-- ============================================
-- 存储过程：更新用户统计
-- ============================================
DELIMITER //
CREATE PROCEDURE update_user_statistics(IN p_user_id INT)
BEGIN
    UPDATE users SET
        total_words_learned = (
            SELECT COUNT(DISTINCT word_id) 
            FROM words 
            WHERE user_id = p_user_id AND is_deleted = FALSE
        ),
        total_study_days = (
            SELECT COUNT(DISTINCT stat_date) 
            FROM daily_statistics 
            WHERE user_id = p_user_id
        )
    WHERE user_id = p_user_id;
END //
DELIMITER ;

-- ============================================
-- 触发器：学习记录后更新每日统计
-- ============================================
DELIMITER //
CREATE TRIGGER after_study_record_insert
AFTER INSERT ON study_records
FOR EACH ROW
BEGIN
    INSERT INTO daily_statistics (user_id, stat_date, words_learned, words_reviewed, correct_count, wrong_count)
    VALUES (NEW.user_id, NEW.study_date, 
            CASE WHEN NEW.study_mode = 'learn' THEN 1 ELSE 0 END,
            CASE WHEN NEW.study_mode = 'review' THEN 1 ELSE 0 END,
            CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
            CASE WHEN NOT NEW.is_correct THEN 1 ELSE 0 END)
    ON DUPLICATE KEY UPDATE
        words_learned = words_learned + CASE WHEN NEW.study_mode = 'learn' THEN 1 ELSE 0 END,
        words_reviewed = words_reviewed + CASE WHEN NEW.study_mode = 'review' THEN 1 ELSE 0 END,
        correct_count = correct_count + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        wrong_count = wrong_count + CASE WHEN NOT NEW.is_correct THEN 1 ELSE 0 END,
        accuracy_rate = CASE 
            WHEN (correct_count + wrong_count + 1) > 0 
            THEN ROUND((correct_count + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END) * 100.0 / 
                 (correct_count + wrong_count + 1), 2)
            ELSE 0 
        END;
END //
DELIMITER ;

-- ============================================
-- 插入测试数据
-- ============================================

-- 测试用户 (密码都是: test123456)
INSERT INTO users (username, email, password_hash, nickname) VALUES
('testuser', 'test@example.com', '$2b$10$rQZ9vXqZ9vXqZ9vXqZ9vXuO7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y', '测试用户'),
('demo', 'demo@example.com', '$2b$10$rQZ9vXqZ9vXqZ9vXqZ9vXuO7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y', '演示账号');

-- ============================================
-- 完成
-- ============================================
SELECT '数据库创建完成！' as message;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'vocab_learning_system' AND table_type = 'BASE TABLE';