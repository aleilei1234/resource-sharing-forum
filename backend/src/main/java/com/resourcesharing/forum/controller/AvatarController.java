package com.resourcesharing.forum.controller;

import com.resourcesharing.forum.common.ApiResponse;
import com.resourcesharing.forum.service.FileService;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
public class AvatarController {
    private final FileService fileService;

    public AvatarController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping({"/api/me/avatar", "/api/v1/user/avatar", "/api/v1/user/profile/avatar"})
    public ApiResponse<Map<String, Object>> upload(
            @RequestParam MultipartFile file,
            Authentication authentication
    ) {
        return ApiResponse.success(fileService.uploadAvatar(file, accountId(authentication)));
    }

    @GetMapping("/api/public/avatars/{accountId}/{fileName:.+}")
    public ResponseEntity<org.springframework.core.io.Resource> publicAvatar(
            @PathVariable Long accountId,
            @PathVariable String fileName
    ) throws Exception {
        FileService.AvatarStream stream = fileService.publicAvatar(accountId, fileName);
        UrlResource resource = new UrlResource(stream.path().toUri());
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                .contentType(MediaType.parseMediaType(stream.mimeType()))
                .contentLength(stream.fileSize())
                .body(resource);
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
}
