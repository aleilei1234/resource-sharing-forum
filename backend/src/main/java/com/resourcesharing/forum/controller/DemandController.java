package com.resourcesharing.forum.controller;

import com.resourcesharing.forum.common.ApiResponse;
import com.resourcesharing.forum.common.PageResult;
import com.resourcesharing.forum.service.DesignSpecForumService;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/demands")
public class DemandController {
    private final DesignSpecForumService forumService;

    public DemandController(DesignSpecForumService forumService) {
        this.forumService = forumService;
    }

    @GetMapping
    public ApiResponse<PageResult<Map<String, Object>>> list(@RequestParam Map<String, String> params) {
        return ApiResponse.success(forumService.listRequests(params));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> detail(@PathVariable Long id, Authentication authentication) {
        Map<String, Object> detail = new LinkedHashMap<>(forumService.requestDetail(id, accountId(authentication)));
        detail.putIfAbsent("demand", detail.get("request"));
        detail.putIfAbsent("answers", detail.get("replies"));
        return ApiResponse.success(detail);
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> publish(@RequestBody Map<String, Object> request, Authentication authentication) {
        return ApiResponse.created(forumService.createRequest(accountId(authentication), request));
    }

    @PostMapping("/{id}/comments")
    public ApiResponse<Map<String, Object>> comment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            Authentication authentication
    ) {
        return ApiResponse.created(forumService.addComment("REQUEST_POST", id, value(request, "content"), accountId(authentication)));
    }

    @GetMapping("/{id}/replies")
    public ApiResponse<PageResult<Map<String, Object>>> replies(@PathVariable Long id, @RequestParam Map<String, String> params) {
        return ApiResponse.success(forumService.listReplies(id, params));
    }

    @PostMapping(value = "/{id}/replies", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<Map<String, Object>> reply(@PathVariable Long id, @RequestBody Map<String, Object> request, Authentication authentication) {
        return ApiResponse.created(forumService.replyRequest(id, accountId(authentication), request));
    }

    @PostMapping(value = "/{id}/replies", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, Object>> replyWithFiles(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "") String content,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) String externalUrl,
            @RequestParam(required = false) List<MultipartFile> files,
            Authentication authentication
    ) {
        return ApiResponse.created(forumService.replyRequest(id, accountId(authentication), requestBody(content, resourceId, externalUrl), files));
    }

    @PostMapping(value = "/{id}/answers", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<Map<String, Object>> answer(@PathVariable Long id, @RequestBody Map<String, Object> request, Authentication authentication) {
        return reply(id, request, authentication);
    }

    @PostMapping(value = "/{id}/answers", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, Object>> answerWithFiles(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "") String content,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) String externalUrl,
            @RequestParam(required = false) List<MultipartFile> files,
            Authentication authentication
    ) {
        return replyWithFiles(id, content, resourceId, externalUrl, files, authentication);
    }

    private static Long accountId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        try {
            return Long.parseLong(authentication.getName());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static String value(Map<String, Object> request, String key) {
        Object value = request == null ? null : request.get(key);
        return value == null ? "" : String.valueOf(value);
    }

    private static Map<String, Object> requestBody(String content, Long resourceId, String externalUrl) {
        return Map.of(
                "content", content == null ? "" : content,
                "resourceId", resourceId == null ? 0L : resourceId,
                "externalUrl", externalUrl == null ? "" : externalUrl
        );
    }
}
