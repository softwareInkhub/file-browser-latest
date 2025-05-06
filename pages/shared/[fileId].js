import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function SharedFilePage() {
  const router = useRouter();
  const { fileId } = router.query;
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/files/metadata?fileId=${fileId}`)
      .then(res => {
        if (!res.ok) throw new Error('File not found');
        return res.json();
      })
      .then(data => {
        setFile(data.file);
        setLoading(false);
      })
      .catch(err => {
        setError('File not found or not shared with you.');
        setLoading(false);
      });
  }, [fileId]);

  if (loading) {
    return <div className="flex flex-col items-center justify-center min-h-screen"><p>Loading...</p></div>;
  }

  if (error || !file) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-2">404</h1>
        <p className="text-lg text-gray-600">This file could not be found or is not shared with you.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{file.fileName}</h1>
      <p className="mb-4">Size: {file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown'}</p>
      <a
        href={file.downloadUrl || `/api/files/download?fileId=${file.fileId}`}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        download
      >
        Download
      </a>
    </div>
  );
} 