package com.vocab.repository;

import com.vocab.entity.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WordRepository extends JpaRepository<Word, Long> {

    List<Word> findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(Long userId);

    Optional<Word> findByUserIdAndWordAndIsDeletedFalse(Long userId, String word);

    long countByUserIdAndIsDeletedFalse(Long userId);

    @Query("SELECT COUNT(w) FROM Word w WHERE w.userId = :userId AND w.isDeleted = false AND w.masteryLevel >= 80")
    long countMasteredWords(@Param("userId") Long userId);

    @Query("SELECT AVG(w.masteryLevel) FROM Word w WHERE w.userId = :userId AND w.isDeleted = false")
    Double getAverageMastery(@Param("userId") Long userId);

    @Query("SELECT SUM(w.reviewCount) FROM Word w WHERE w.userId = :userId AND w.isDeleted = false")
    Long getTotalReviews(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Word w SET w.isDeleted = true WHERE w.wordId = :wordId AND w.userId = :userId")
    int softDelete(@Param("wordId") Long wordId, @Param("userId") Long userId);
}
