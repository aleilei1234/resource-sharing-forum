package com.resourcesharing.forum.service.interaction;

import com.resourcesharing.forum.common.PageResult;
import com.resourcesharing.forum.service.support.MappingSupport;
import com.resourcesharing.forum.service.support.TxSupport;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CommentTreeService {
    private final TxSupport txSupport;
    private final MappingSupport mappings;

    public CommentTreeService(TxSupport txSupport, MappingSupport mappings) {
        this.txSupport = txSupport;
        this.mappings = mappings;
    }

    public PageResult<Map<String, Object>> tree(String targetType, Long targetId, Long accountId, int page, int size) {
        JdbcTemplate jdbc = txSupport.jdbc();
        if (jdbc == null) {
            return new PageResult<>(0, List.of(), page, size);
        }
        try {
            long total = jdbc.queryForObject("""
                    SELECT COUNT(*)
                    FROM comment_info
                    WHERE target_type = ? AND target_id = ? AND status = 'ACTIVE'
                      AND parent_id IS NULL AND deleted_at IS NULL
                    """, Long.class, targetType, targetId);
            List<Map<String, Object>> allComments = jdbc.query("""
                    SELECT ci.id, ci.target_type, ci.target_id, ci.content, ci.created_at, ci.member_id, ci.parent_id, mp.nickname,
                           (SELECT COUNT(*) FROM user_interaction ui
                            WHERE ui.target_type = 'COMMENT' AND ui.target_id = ci.id
                              AND ui.action_type = 'LIKE' AND ui.status = 'ACTIVE' AND ui.deleted_at IS NULL) AS like_count
                    FROM comment_info ci
                    JOIN member_profile mp ON mp.id = ci.member_id
                    WHERE ci.target_type = ? AND ci.target_id = ? AND ci.status = 'ACTIVE' AND ci.deleted_at IS NULL
                    ORDER BY ci.created_at ASC, ci.id ASC
                    """, mappings.commentMapper(accountId), targetType, targetId);
            return new PageResult<>(total, buildTree(allComments, page, size), page, size);
        } catch (DataAccessException ignored) {
            return new PageResult<>(0, List.of(), page, size);
        }
    }

    private List<Map<String, Object>> buildTree(List<Map<String, Object>> allComments, int page, int size) {
        Map<Long, Map<String, Object>> byId = new LinkedHashMap<>();
        List<Map<String, Object>> roots = new ArrayList<>();
        for (Map<String, Object> comment : allComments) {
            comment.put("replies", new ArrayList<Map<String, Object>>());
            byId.put(number(comment.get("id")), comment);
        }
        for (Map<String, Object> comment : allComments) {
            Long parentId = number(comment.get("parentId"));
            if (parentId == null || parentId == 0 || !byId.containsKey(parentId)) {
                roots.add(comment);
                continue;
            }
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> replies = (List<Map<String, Object>>) byId.get(parentId).get("replies");
            replies.add(comment);
        }
        roots.sort((left, right) -> Long.compare(number(right.get("id")), number(left.get("id"))));
        int from = Math.min((page - 1) * size, roots.size());
        int to = Math.min(from + size, roots.size());
        return roots.subList(from, to);
    }

    private static Long number(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value == null || String.valueOf(value).isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
