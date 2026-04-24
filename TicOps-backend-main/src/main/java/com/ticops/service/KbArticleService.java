package com.ticops.service;

import com.ticops.dto.KbArticleDto;
import com.ticops.entity.Category;
import com.ticops.entity.KbArticle;
import com.ticops.repository.CategoryRepository;
import com.ticops.repository.KbArticleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KbArticleService {

    private final KbArticleRepository kbArticleRepository;
    private final CategoryRepository categoryRepository;
    private final DtoMapper mapper;

    public List<KbArticleDto> getAll() {
        return kbArticleRepository.findAll().stream()
                .map(mapper::toKbArticleDto)
                .toList();
    }

    public KbArticleDto create(KbArticleDto dto) {
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        String tags = (dto.getTags() != null && !dto.getTags().isEmpty())
                ? String.join(",", dto.getTags())
                : "";

        KbArticle article = KbArticle.builder()
                .category(category)
                .title(dto.getTitle())
                .body(dto.getBody())
                .tags(tags)
                .build();

        KbArticle saved = kbArticleRepository.save(article);
        return mapper.toKbArticleDto(saved);
    }
}
