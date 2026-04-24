package com.ticops.repository;

import com.ticops.entity.KbArticle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KbArticleRepository extends JpaRepository<KbArticle, Long> {
}
