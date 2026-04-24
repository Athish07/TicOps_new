package com.ticops.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kb_articles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KbArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private String title;

    @Lob
    @Column(nullable = false)
    private String body;

    @Column(length = 500)
    private String tags;
}
