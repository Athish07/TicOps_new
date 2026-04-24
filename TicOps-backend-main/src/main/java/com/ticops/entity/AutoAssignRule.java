package com.ticops.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "auto_assign_rules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AutoAssignRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default
    private Boolean enabled = false;

    @Column(length = 20)
    @Builder.Default
    private String strategy = "ROUND_ROBIN";

    @Column(columnDefinition = "JSON")
    private String categoryAgentMapJson;

    @Column(columnDefinition = "JSON")
    private String roundRobinIndexJson;
}
