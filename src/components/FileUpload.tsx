import { useState, type ChangeEvent } from 'react';
import { AuthServices } from '../services/useFetch';


export const FileUpload = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setError(null);
            const key = `apps_modern/${selectedFile.name}`;
            setGeneratedKey(key);
        }
    };

    const getPresignedUrl = async () => {
        if (!file || !generatedKey) return;
        setLoading(true);
        setError(null);
        try {
            const authServices = new AuthServices();
            const response = await authServices.requestGet({ key: generatedKey }, 1);
            console.log('Response', response);
            const response2 = await authServices.requestPutFileUrlPresigned(file, response.data);
            console.log('Response2', response2);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener la URL prefirmada');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-card">
            <div className="status-badge">AWS Modernization Stack</div>
            <h2>Subir Archivo Legacy</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                Selecciona un archivo COBOL u otro recurso para iniciar el proceso.
            </p>

            <div className="file-input-wrapper">
                <label htmlFor="file-upload" className="file-input-label">
                    <div className="file-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <span style={{ fontWeight: 500 }}>
                        {file ? file.name : 'Haz clic para seleccionar un archivo'}
                    </span>
                    {file && (
                        <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                            {(file.size / 1024).toFixed(2)} KB
                        </span>
                    )}
                </label>
                <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                />
            </div>

            <button className="button-modern" onClick={getPresignedUrl} disabled={!file || loading}>
                {loading ? (
                    <>
                        <span className="spinner"></span>
                        Obteniendo URL...
                    </>
                ) : (
                    'Obtener URL Prefirmada'
                )}
            </button>

            {generatedKey && (
                <div className="result-area">
                    <span className="result-label">Generated S3 Key</span>
                    <div className="result-content">{generatedKey}</div>
                </div>
            )}

            {error && (
                <div className="error-message">
                    <strong>Error:</strong> {error}
                </div>
            )}
        </div>
    );
};
