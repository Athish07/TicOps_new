package com.ticops.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class KbArticleDto {
    private Long id;
    private Long categoryId;
    private String title;
    private String body;
    private List<String> tags;
}
