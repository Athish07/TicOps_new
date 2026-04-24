package com.ticops.controller;

import com.ticops.dto.CategoryDto;
import com.ticops.dto.CategoryRequest;
import com.ticops.entity.Category;
import com.ticops.repository.CategoryRepository;
import com.ticops.service.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final DtoMapper mapper;

    @GetMapping
    public ResponseEntity<List<CategoryDto>> getAll() {
        List<CategoryDto> categories = categoryRepository.findAll().stream()
                .map(mapper::toCategoryDto)
                .toList();
        return ResponseEntity.ok(categories);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> create(@RequestBody CategoryRequest req) {
        if (req.getName() == null || req.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Category name is required");
        }
        if (categoryRepository.findByNameIgnoreCase(req.getName().trim()).isPresent()) {
            return ResponseEntity.badRequest().body("Category with this name already exists");
        }
        Category cat = Category.builder()
                .name(req.getName().trim())
                .description(req.getDescription() != null ? req.getDescription().trim() : null)
                .build();
        cat = categoryRepository.save(cat);
        return ResponseEntity.ok(mapper.toCategoryDto(cat));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody CategoryRequest req) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        if (req.getName() != null && !req.getName().isBlank()) {
            categoryRepository.findByNameIgnoreCase(req.getName().trim()).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new RuntimeException("Category with this name already exists");
                }
            });
            cat.setName(req.getName().trim());
        }
        if (req.getDescription() != null) {
            cat.setDescription(req.getDescription().trim());
        }
        cat = categoryRepository.save(cat);
        return ResponseEntity.ok(mapper.toCategoryDto(cat));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        categoryRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
