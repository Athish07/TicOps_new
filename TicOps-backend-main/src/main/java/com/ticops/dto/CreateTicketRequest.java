package com.ticops.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateTicketRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String description;
    private String source;
    @NotBlank
    private String requesterName;
    @NotBlank
    private String requesterEmail;
    private String status;
    private String priority;
    private Long categoryId;
    private Long assignedTo;
}
