package com.ticops.dto;

import lombok.Data;
import java.util.List;

@Data
public class SendChatRequest {
    private String text;
    private List<AttachmentDto> attachments;
}
