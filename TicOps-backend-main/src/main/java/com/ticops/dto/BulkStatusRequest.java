package com.ticops.dto;

import lombok.Data;
import java.util.List;

@Data
public class BulkStatusRequest {
    private List<Long> ids;
    private String status;
}
