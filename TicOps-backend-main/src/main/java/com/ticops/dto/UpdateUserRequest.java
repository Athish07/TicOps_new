package com.ticops.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String name;
    private String email;
    private String password;  // optional — only update if provided
    private String role;
    private String team;
    private Boolean isActive;
}
