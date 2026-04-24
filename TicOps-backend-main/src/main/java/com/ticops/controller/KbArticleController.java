package com.ticops.controller;

import com.ticops.dto.KbArticleDto;
import com.ticops.service.KbArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/kb")
@RequiredArgsConstructor
public class KbArticleController {

    private final KbArticleService kbArticleService;

    @GetMapping("/articles")
    public ResponseEntity<List<KbArticleDto>> getAll() {
        return ResponseEntity.ok(kbArticleService.getAll());
    }

    @PostMapping("/articles")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
    public ResponseEntity<KbArticleDto> create(@RequestBody KbArticleDto dto) {
        return ResponseEntity.ok(kbArticleService.create(dto));
    }
}
