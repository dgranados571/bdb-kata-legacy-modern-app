import { useState, type ChangeEvent } from 'react';
import { AuthServices } from '../services/useFetch';


export const FileUpload = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);

    const [appName, setAppName] = useState('');
    const [definitionTemplate, setDefinitionTemplate] = useState('DEFAUT_COBOL_TEMPLATE');
    const [modSuccess, setModSuccess] = useState(false);
    const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setError(null);
            setModSuccess(false);
            setPipelineLogs([]);
            const key = `LEGACY_CODE/${selectedFile.name}`;
            setGeneratedKey(key);
            if (!appName) {
                setAppName(selectedFile.name.split('.')[0]);
            }
        }
    };

    const startModernization = async () => {
        if (!file || !generatedKey) return;
        setLoading(true);
        setError(null);
        setModSuccess(false);
        setPipelineLogs([]);

        try {
            const authServices = new AuthServices();

            const response = await authServices.requestGet({ key: generatedKey }, 1);
            if (response.error) throw response.error;

            await authServices.requestPutFileUrlPresigned(file, response.data);

            const body = {
                cobolPath: generatedKey,
                appName: appName,
                definitionTemplate: definitionTemplate
            }
            const modResponse = await authServices.requestPost(body, 2);

            if (modResponse.error) throw modResponse.error;

            setModSuccess(true);
            setPipelineLogs(modResponse.data || []);
            console.log('Modernization started successfully:', modResponse.data);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error en el proceso de modernización');
            console.error('Modernization flow error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-card" style={{ maxWidth: pipelineLogs.length > 0 ? '800px' : '500px' }}>
            <div className="status-badge">AWS Modernization Stack</div>
            <h2>Modernización de Código</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                Carga tu archivo legacy para iniciar la transformación a la nube.
            </p>
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                <label className="result-label">Nombre de Aplicación</label>
                <input type="text" className="input-modern" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Ej: ProcesoDescuentos" style={{ width: '100%', marginBottom: '1rem', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />

                <label className="result-label">Plantilla de Definición</label>
                <textarea className="input-modern" value={definitionTemplate} onChange={(e) => setDefinitionTemplate(e.target.value)} style={{ width: '100%', minHeight: '80px', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
            </div>

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
                        {file ? file.name : 'Seleccionar Archivo .cbl'}
                    </span>
                </label>
                <input id="file-upload" type="file" onChange={handleFileChange} />
            </div>

            <button className="button-modern" onClick={startModernization} disabled={!file || !appName || loading}>
                {loading ? (
                    <>
                        <span className="spinner"></span>
                        Procesando...
                    </>
                ) : (
                    'Iniciar Modernización'
                )}
            </button>

            {pipelineLogs.length > 0 && (
                <div className="terminal-window">
                    <div className="terminal-header">
                        <div className="terminal-dot" style={{ background: '#ff5f56' }}></div>
                        <div className="terminal-dot" style={{ background: '#ffbd2e' }}></div>
                        <div className="terminal-dot" style={{ background: '#27c93f' }}></div>
                        <span style={{ marginLeft: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>modernization-logs.out</span>
                    </div>
                    <div className="terminal-body">
                        {pipelineLogs.map((log, index) => (
                            <div key={index} className="terminal-line">
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {modSuccess && (
                <div className="result-area" style={{ borderColor: '#22c55e', marginTop: '1rem' }}>
                    <span className="result-label" style={{ color: '#22c55e' }}>¡Éxito!</span>
                    <div className="result-content" style={{ color: 'white' }}>
                        Transformación finalizada correctamente.
                    </div>
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
