package com.ticops.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_preferences")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationPreference {

    @Id
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Builder.Default
    private Boolean emailOnAssign = true;

    @Builder.Default
    private Boolean emailOnStatusChange = true;

    @Builder.Default
    private Boolean emailOnComment = true;

    @Builder.Default
    private Boolean emailOnResolved = true;
}
