import File from "../models/file.js";
import Folder from "../models/Folder.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const readSearchQuery = (request, response) => {
  const rawQuery = request.query.q;
  if (typeof rawQuery !== "string" || !rawQuery.trim() || rawQuery.trim().length > 100) {
    response.status(400).json({
      success: false,
      message: "Search query must contain 1 to 100 characters",
    });
    return null;
  }
  return new RegExp(escapeRegex(rawQuery.trim()), "i");
};

const fileVisibilityFilter = (request) => {
  const filter = { groupId: request.authorizedGroupId };
  if (["leader", "admin"].includes(request.authorizedMembership?.role)) {
    return filter;
  }

  filter.$and = [
    {
      $or: [
        { permissions: "view" },
        { permissions: { $exists: false } },
        { uploadedBy: request.user.userId || request.user.id },
      ],
    },
    {
      $or: [
        { sharedWith: { $exists: false } },
        { sharedWith: { $size: 0 } },
        { sharedWith: request.user.userId || request.user.id },
        { uploadedBy: request.user.userId || request.user.id },
      ],
    },
  ];
  return filter;
};

const searchService = {
  async searchFiles(request, response) {
    try {
      const searchRegex = readSearchQuery(request, response);
      if (!searchRegex) return;

      const fileFilter = {
        ...fileVisibilityFilter(request),
        $or: [
          { name: searchRegex },
          { originalName: searchRegex },
          { mimeType: searchRegex },
        ],
      };

      const [files, folders] = await Promise.all([
        File.find(fileFilter)
          .populate("uploadedBy", "name email")
          .populate("folderId", "name")
          .sort({ createdAt: -1 })
          .limit(100),
        Folder.find({
          name: searchRegex,
          groupId: request.authorizedGroupId,
        })
          .populate("createdBy", "name email")
          .sort({ name: 1 })
          .limit(100),
      ]);

      return response.status(200).json({
        success: true,
        data: { files, folders },
      });
    } catch (error) {
      console.error("Search resource error:", error);
      return response.status(500).json({
        success: false,
        message: "Failed to search resources",
      });
    }
  },

  async getSuggestions(request, response) {
    try {
      const searchRegex = readSearchQuery(request, response);
      if (!searchRegex) return;
      const startsWithRegex = new RegExp(
        `^${escapeRegex(request.query.q.trim())}`,
        "i",
      );

      const [files, folders] = await Promise.all([
        File.find({
          ...fileVisibilityFilter(request),
          $or: [{ name: startsWithRegex }, { originalName: startsWithRegex }],
        })
          .select("name originalName")
          .limit(5),
        Folder.find({
          name: startsWithRegex,
          groupId: request.authorizedGroupId,
        })
          .select("name")
          .limit(5),
      ]);

      return response.status(200).json({
        success: true,
        data: {
          files: files.map((file) => ({
            label: file.name,
            value: file.originalName || file.name,
            type: "file",
          })),
          folders: folders.map((folder) => ({
            label: folder.name,
            value: folder.name,
            type: "folder",
          })),
        },
      });
    } catch (error) {
      console.error("Resource suggestions error:", error);
      return response.status(500).json({
        success: false,
        message: "Failed to retrieve resource suggestions",
      });
    }
  },
};

export default searchService;