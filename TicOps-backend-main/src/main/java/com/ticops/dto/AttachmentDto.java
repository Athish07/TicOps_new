package com.ticops.dto;

import lombok.Data;

@Data
public class AttachmentDto {
    private String id;
    private String name;
    private Long size;
    private String type;
    private String url;
}
