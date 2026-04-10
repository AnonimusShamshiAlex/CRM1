import { useState, useRef } from 'react';
import { Upload, X, FileText, Image, File } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const fileIcons = {
  'image/': Image,
  'application/pdf': FileText,
};

function getIcon(mimetype) {
  for (const [key, Icon] of Object.entries(fileIcons)) {
    if (mimetype.startsWith(key)) return Icon;
  }
  return File;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({ entity, entityId, files = [], onFilesChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    setUploading(true);
    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append('files', file);
    }

    try {
      const { data } = await api.post(`/files/${entity}/${entityId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = [...files, ...data.files];
      onFilesChange(updated);
      toast.success(`${data.files.length} файл(ов) загружено`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка загрузки');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (file, index) => {
    try {
      await api.delete(`/files/${entity}/${file.filename}`);
      const updated = files.filter((_, i) => i !== index);
      onFilesChange(updated);
      toast.success('Файл удалён');
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Загрузка...' : 'Загрузить файлы'}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleUpload}
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,.csv"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const Icon = getIcon(file.mimetype || '');
            return (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group">
                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                <a
                  href={file.path}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-sm text-gray-700 hover:text-primary-600 truncate"
                >
                  {file.originalName || file.filename}
                </a>
                {file.size && (
                  <span className="text-xs text-gray-400 shrink-0">{formatSize(file.size)}</span>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(file, index)}
                  className="p-1 text-gray-300 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
