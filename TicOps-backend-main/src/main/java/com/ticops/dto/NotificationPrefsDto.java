package com.ticops.dto;

import lombok.Data;

@Data
public class NotificationPrefsDto {
    private Boolean emailOnAssign;
    private Boolean emailOnStatusChange;
    private Boolean emailOnComment;
    private Boolean emailOnResolved;
}
