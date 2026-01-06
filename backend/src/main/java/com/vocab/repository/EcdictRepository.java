package com.vocab.repository;

import com.vocab.entity.Ecdict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EcdictRepository extends JpaRepository<Ecdict, Long> {

    Optional<Ecdict> findByWord(String word);
}
