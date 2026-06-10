package com.resourcesharing.forum.controller;

import com.resourcesharing.forum.common.ApiResponse;
import com.resourcesharing.forum.common.PageResult;
import com.resourcesharing.forum.service.DesignSpecForumService;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/requests", "/api/v1/requests"})
public class RequestResourceController {
    private final DesignSpecForumService forumService;

    public RequestResourceController(DesignSpecForumService forumService) {
        this.forumService = forumService;
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(@RequestBody Map<String, Object> request, Authentication authentication) {
        return ApiResponse.created(forumService.createRequest(accountId(authentication), request));
    }

    @GetMapping
    public ApiResponse<PageResult<Map<String, Object>>> list(@RequestParam Map<String, String> params) {
        return ApiResponse.success(forumService.listRequests(params));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> detail(@PathVariable Long id, Authentication authentication) {
        return ApiResponse.success(forumService.requestDetail(id, accountId(authentication)));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<Void> cancel(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> request, Authentication authentication) {
        forumService.cancelRequest(id, accountId(authentication), request == null ? Map.of() : request);
        return ApiResponse.success();
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

    @PostMapping("/{id}/settle")
    public ApiResponse<Map<String, Object>> settle(@PathVariable Long id, @RequestBody Map<String, Object> request, Authentication authentication) {
        return ApiResponse.success(forumService.settleRequest(id, accountId(authentication), request));
    }

    @PostMapping("/{id}/answers/{answerId}/accept")
    public ApiResponse<Map<String, Object>> accept(@PathVariable Long id, @PathVariable Long answerId, Authentication authentication) {
        return ApiResponse.success(forumService.settleRequest(id, accountId(authentication), Map.of("replyId", answerId)));
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

    private static Map<String, Object> requestBody(String content, Long resourceId, String externalUrl) {
        return Map.of(
                "content", content == null ? "" : content,
                "resourceId", resourceId == null ? 0L : resourceId,
                "externalUrl", externalUrl == null ? "" : externalUrl
        );
    }
}

