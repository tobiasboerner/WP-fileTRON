# WP fileTRON REST API Documentation

Version: 1.0.0
Base URL: `/wp-json/wft/v1`

## Authentication

All endpoints require authentication. Use WordPress Nonce for AJAX requests:

```javascript
fetch('/wp-json/wft/v1/folders', {
    headers: {
        'X-WP-Nonce': wpApiSettings.nonce
    }
});
```

**Required Capability:** `upload_files`

---

## Response Format

### Success Response
```json
{
    "success": true,
    "message": "Operation successful",
    "data": { ... }
}
```

### Error Response
```json
{
    "code": "error_code",
    "message": "Error description",
    "data": {
        "status": 400
    }
}
```

---

## Endpoints

### 📁 Folders

#### Get All Folders
```
GET /folders
```

**Query Parameters:**
- `parent_id` (optional, integer) - Filter by parent folder

**Example:**
```bash
GET /wp-json/wft/v1/folders?parent_id=0
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Images",
            "slug": "images",
            "parent_id": 0,
            "color": "#FF5733",
            "order_index": 0,
            "created_at": "2025-01-15 10:00:00",
            "updated_at": "2025-01-15 10:00:00"
        }
    ]
}
```

---

#### Create Folder
```
POST /folders
```

**Body:**
```json
{
    "name": "My Folder",
    "parent_id": 0,
    "color": "#FF5733"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Folder created successfully.",
    "data": {
        "id": 2,
        "name": "My Folder",
        ...
    }
}
```

---

#### Update Folder
```
PUT /folders/{id}
```

**Body:**
```json
{
    "name": "Updated Name",
    "color": "#00FF00",
    "order_index": 5
}
```

---

#### Delete Folder
```
DELETE /folders/{id}
```

**Response:**
```json
{
    "success": true,
    "message": "Folder deleted successfully."
}
```

---

### 🏷️ Tags

#### Get All Tags
```
GET /tags
```

**Query Parameters:**
- `search` (optional, string) - Search tags by name

**Example:**
```bash
GET /wp-json/wft/v1/tags?search=important
```

---

#### Create Tag
```
POST /tags
```

**Body:**
```json
{
    "name": "Important",
    "description": "Important files"
}
```

---

#### Update Tag
```
PUT /tags/{id}
```

**Body:**
```json
{
    "name": "Very Important",
    "description": "Very important files"
}
```

---

#### Delete Tag
```
DELETE /tags/{id}
```

---

#### Add Tags to Media
```
POST /media/{id}/tags
```

**Body:**
```json
{
    "tag_ids": [1, 2, 3]
}
```

**Response:**
```json
{
    "success": true,
    "message": "Tags added successfully.",
    "data": [
        {
            "id": 1,
            "name": "Important",
            "slug": "important",
            ...
        }
    ]
}
```

---

#### Get Media Tags
```
GET /media/{id}/tags
```

**Response:** Array of tags assigned to the media item.

---

### 📷 Media

#### Get All Media
```
GET /media
```

**Query Parameters:**
- `folder_id` (optional, integer) - Filter by folder
- `per_page` (optional, integer, default: 50) - Items per page
- `page` (optional, integer, default: 1) - Page number

**Example:**
```bash
GET /wp-json/wft/v1/media?per_page=20&page=1
```

**Response:**
```json
{
    "success": true,
    "data": {
        "items": [
            {
                "id": 123,
                "title": "My Image",
                "description": "",
                "alt_text": "Image alt text",
                "url": "https://example.com/wp-content/uploads/2025/01/image.jpg",
                "thumbnail": "https://...",
                "medium": "https://...",
                "mime_type": "image/jpeg",
                "file_size": 245678,
                "width": 1920,
                "height": 1080,
                "uploaded": "2025-01-15 10:00:00",
                "folder_id": 3
            }
        ],
        "total": 150,
        "total_pages": 8,
        "current_page": 1
    }
}
```

---

#### Upload Media
```
POST /media/upload
```

**Form Data (multipart/form-data):**
- `file` (required, file) – Binary file upload field
- `title` (optional, string)
- `description` (optional, string)
- `alt_text` (optional, string)
- `folder_id` (optional, integer) – Assign uploaded file to a folder
- `tag_ids` (optional, array<int>) – Assign existing tags on upload

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder_id', 3);

await apiFetch({
    path: 'wft/v1/media/upload',
    method: 'POST',
    body: formData,
});
```

**Response:**
```json
{
    "success": true,
    "message": "Media uploaded successfully.",
    "data": {
        "id": 201,
        "title": "hero-image",
        "description": "",
        "alt_text": "",
        "url": "https://example.com/wp-content/uploads/2025/01/hero-image.jpg",
        "thumbnail": "https://example.com/wp-content/uploads/2025/01/hero-image-150x150.jpg",
        "medium": "https://example.com/wp-content/uploads/2025/01/hero-image-300x200.jpg",
        "mime_type": "image/jpeg",
        "file_size": 245678,
        "width": 1920,
        "height": 1080,
        "uploaded": "2025-01-20 12:30:00",
        "folder_id": 3
    }
}
```

---

#### Get Single Media
```
GET /media/{id}
```

**Response:** Single media object with all metadata.

---

#### Update Media Metadata
```
PUT /media/{id}
```

**Body:**
```json
{
    "title": "New Title",
    "alt_text": "New alt text",
    "description": "New description",
    "folder_id": 2
}
```

---

#### Get Media Usage
```
GET /media/{id}/usage
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "media_id": 123,
            "post_id": 456,
            "post_title": "My Blog Post",
            "post_type": "post",
            "post_status": "publish",
            "usage_type": "post_content",
            "context": "{}",
            "last_checked": "2025-01-15 10:00:00"
        }
    ]
}
```

---

#### Bulk Operations
```
POST /media/bulk
```

**Body for Bulk Delete:**
```json
{
    "media_ids": [123, 124, 125],
    "action": "delete"
}
```

**Body for Bulk Tag:**
```json
{
    "media_ids": [123, 124, 125],
    "action": "tag",
    "tag_ids": [1, 2]
}
```

**Response:**
```json
{
    "success": true,
    "message": "Bulk operation completed. Success: 3, Failed: 0",
    "data": {
        "success": 3,
        "failed": 0
    }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `invalid_folder_name` | Folder name validation failed |
| `folder_not_found` | Folder ID doesn't exist |
| `folder_creation_failed` | Database insert failed |
| `folder_update_failed` | Database update failed |
| `folder_delete_failed` | Database delete failed |
| `invalid_tag_name` | Tag name validation failed |
| `tag_not_found` | Tag ID doesn't exist |
| `tag_creation_failed` | Database insert failed |
| `tag_update_failed` | Database update failed |
| `tag_delete_failed` | Database delete failed |
| `media_not_found` | Media ID doesn't exist |
| `media_delete_forbidden` | User lacks capability to delete one or more files |
| `media_move_forbidden` | User lacks capability to move one or more files |
| `missing_tag_ids` | Tag IDs required but not provided |
| `missing_folder_id` | Folder ID required for move action |
| `folder_assignment_failed` | Moving file into folder failed |
| `invalid_action` | Bulk action not recognized |
| `missing_file` | No upload file supplied |
| `upload_failed` | WordPress upload handler returned an error |
| `attachment_failed` | Attachment record could not be created |
| `file_too_large` | Uploaded file exceeds size limits |
| `invalid_file_type` | File extension or MIME type not permitted |

---

## Testing with Postman

1. **Import Collection:**
   - Open Postman
   - File → Import
   - Select `WP-fileTRON-API.postman_collection.json`

2. **Set Variables:**
   - Click on Collection → Variables
   - Set `base_url` to your WordPress URL + `/wp-json/wft/v1`
   - Example: `http://localhost/wordpress/wp-json/wft/v1`

3. **Get Nonce:**
   - Log into WordPress Admin
   - Open Browser DevTools → Console
   - Run: `console.log(wpApiSettings.nonce)`
   - Copy the nonce value
   - In Postman: Set `wp_nonce` variable

4. **Test Endpoints:**
   - Start with "Get All Folders" (should return empty array initially)
   - Create a folder with "Create Folder"
   - Test other endpoints

---

## Testing with cURL

### Create a Folder
```bash
curl -X POST 'http://localhost/wp-json/wft/v1/folders' \
  -H 'X-WP-Nonce: YOUR_NONCE_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test Folder",
    "color": "#FF5733"
  }'
```

### Get All Folders
```bash
curl -X GET 'http://localhost/wp-json/wft/v1/folders' \
  -H 'X-WP-Nonce: YOUR_NONCE_HERE'
```

### Create a Tag
```bash
curl -X POST 'http://localhost/wp-json/wft/v1/tags' \
  -H 'X-WP-Nonce: YOUR_NONCE_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Important",
    "description": "Important files"
  }'
```

---

## Rate Limiting

Currently no rate limiting implemented. May be added in future versions.

---

## Pagination

For endpoints that return lists (like `/media`), pagination is supported:

- Default: 50 items per page
- Max: 100 items per page
- Use `per_page` and `page` parameters

---

## CORS

CORS is handled by WordPress. If you need cross-origin requests, configure WordPress CORS headers.

---

## Changelog

### Version 1.0.0
- Initial release
- Folder CRUD operations
- Tag CRUD operations
- Media listing and metadata updates
- Media usage tracking
- Bulk operations (delete, tag)

---

**Need Help?** Check the [GitHub Issues](https://github.com/yourusername/wp-filetron/issues)
