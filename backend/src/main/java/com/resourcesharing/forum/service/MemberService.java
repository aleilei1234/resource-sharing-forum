package com.resourcesharing.forum.service;

import com.resourcesharing.forum.common.PageResult;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MemberService {
    private final DesignSpecForumService forumService;
    private final ObjectProvider<JdbcTemplate> jdbcProvider;

    public MemberService(DesignSpecForumService forumService, ObjectProvider<JdbcTemplate> jdbcProvider) {
        this.forumService = forumService;
        this.jdbcProvider = jdbcProvider;
    }

    public Map<String, Object> currentMember() {
        return forumService.userProfile(1L);
    }

    public PageResult<Map<String, Object>> pointFlows() {
        JdbcTemplate jdbc = jdbcProvider.getIfAvailable();
        if (jdbc == null) {
            return new PageResult<>(0, List.of(), 1, 20);
        }
        Long memberId = jdbc.queryForObject("SELECT id FROM member_profile WHERE account_id = 1 AND deleted_at IS NULL", Long.class);
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM point_flow WHERE member_id = ?", Long.class, memberId);
        List<Map<String, Object>> list = jdbc.query("""
                SELECT id, flow_type, scene, points_change, frozen_change, before_points, after_points,
                       before_frozen_points, after_frozen_points, related_type, related_id, description, create_time
                FROM point_flow
                WHERE member_id = ?
                ORDER BY create_time DESC, id DESC
                LIMIT 20
                """, (rs, rowNum) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getLong("id"));
            row.put("flowType", rs.getString("flow_type"));
            row.put("scene", rs.getString("scene"));
            row.put("pointsChange", rs.getInt("points_change"));
            row.put("frozenChange", rs.getInt("frozen_change"));
            row.put("beforePoints", rs.getInt("before_points"));
            row.put("afterPoints", rs.getInt("after_points"));
            row.put("beforeFrozenPoints", rs.getInt("before_frozen_points"));
            row.put("afterFrozenPoints", rs.getInt("after_frozen_points"));
            row.put("relatedType", rs.getString("related_type") == null ? "" : rs.getString("related_type"));
            row.put("relatedId", rs.getObject("related_id") == null ? 0L : rs.getLong("related_id"));
            row.put("description", rs.getString("description") == null ? "" : rs.getString("description"));
            row.put("createTime", String.valueOf(rs.getObject("create_time", LocalDateTime.class)));
            return row;
        }, memberId);
        return new PageResult<>(total == null ? 0 : total, list, 1, 20);
    }
}
