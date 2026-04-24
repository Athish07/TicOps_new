package com.ticops.dto;

import lombok.Data;
import java.util.Map;
import java.util.List;

@Data
public class AutoAssignRuleDto {
    private Boolean enabled;
    private String strategy;
    private Map<Long, List<Long>> categoryAgentMap;
}
