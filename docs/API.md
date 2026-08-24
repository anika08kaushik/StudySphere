# StudySphere API Contract

## Response format

Success responses use `{ success: true, message, data }`.
Error responses use `{ success: false, message }`.

## HTTP status codes

| Status | Meaning |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Not Authenticated |
| 403 | Not Authorized |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

`401` means the caller is not authenticated. `403` means the authenticated caller lacks permission.

## Foundation endpoint

`GET /api/health` returns the server status.
