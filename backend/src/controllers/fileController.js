const path = require('path');
const fs = require('fs');

// POST /api/files/:entity/:entityId
const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Файлы не загружены' });
    }

    const files = req.files.map((f) => ({
      originalName: f.originalname,
      filename: f.filename,
      path: `/uploads/${req.params.entity}/${f.filename}`,
      size: f.size,
      mimetype: f.mimetype,
      uploadedAt: new Date().toISOString(),
    }));

    res.json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка загрузки' });
  }
};

// DELETE /api/files/:entity/:filename
const deleteFile = async (req, res) => {
  try {
    const { entity, filename } = req.params;
    const filePath = path.join(__dirname, '..', '..', 'uploads', entity, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Файл удалён' });
    } else {
      res.status(404).json({ error: 'Файл не найден' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
};

module.exports = { uploadFiles, deleteFile };
