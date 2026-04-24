package com.ticops.dto;

import lombok.Data;
import java.util.List;

@Data
public class BulkAssignRequest {
    private List<Long> ids;
    private Long assignedTo;
}
