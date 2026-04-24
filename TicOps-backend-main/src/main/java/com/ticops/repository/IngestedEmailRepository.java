package com.ticops.repository;

import com.ticops.entity.IngestedEmail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IngestedEmailRepository extends JpaRepository<IngestedEmail, Long> {

    boolean existsByMessageUid(String messageUid);

    Optional<IngestedEmail> findByMessageUid(String messageUid);

    List<IngestedEmail> findByStatusOrderByReceivedAtDesc(String status);

    List<IngestedEmail> findAllByOrderByReceivedAtDesc();
}
