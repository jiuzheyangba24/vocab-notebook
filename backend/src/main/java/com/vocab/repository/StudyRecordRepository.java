package com.vocab.repository;

import com.vocab.entity.StudyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudyRecordRepository extends JpaRepository<StudyRecord, Long> {
}
