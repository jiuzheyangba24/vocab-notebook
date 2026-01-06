package com.vocab.repository;

import com.vocab.entity.WrongQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WrongQuestionRepository extends JpaRepository<WrongQuestion, Long> {

    Optional<WrongQuestion> findByUserIdAndWordId(Long userId, Long wordId);

    long countByUserIdAndIsMasteredFalse(Long userId);
}
