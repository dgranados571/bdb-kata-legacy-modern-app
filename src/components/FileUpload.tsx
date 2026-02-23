import { useState, type ChangeEvent } from 'react';
import { AuthServices } from '../services/useFetch';

export const FileUpload = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);

    const [appName, setAppName] = useState('');
    const [definitionTemplate, setDefinitionTemplate] = useState('');
    const [modSuccess, setModSuccess] = useState(false);
    const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
    const [appliedRules, setAppliedRules] = useState<string[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [targetKey, setTargetKey] = useState<string | null>(null);
    const [executing, setExecuting] = useState(false);
    const [execOutput, setExecOutput] = useState<string[]>([]);
    const [execError, setExecError] = useState<string | null>(null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
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
            try {
                const content = await selectedFile.text();
                setDefinitionTemplate(content);
            } catch (err) {
                console.error("Error reading file:", err);
                setError("No se pudo leer el contenido del archivo.");
            }
        }
    };

    const startModernization = async () => {
        if (!file || !generatedKey) return;
        setLoading(true);
        setError(null);
        setModSuccess(false);
        setPipelineLogs([]);
        setAppliedRules([]);
        setWarnings([]);
        setTargetKey(null);

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
            setPipelineLogs(modResponse.data.logs || []);
            setAppliedRules(modResponse.data.appliedRules || []);
            setWarnings(modResponse.data.warnings || []);
            setTargetKey(modResponse.data.targetKey || null);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error en el proceso de modernización');
            console.error('Modernization flow error:', err);
        } finally {
            setLoading(false);
        }
    };

    const executeApplication = async () => {
        if (!targetKey) return;
        setExecuting(true);
        setExecOutput([]);
        setExecError(null);
        try {
            const authServices = new AuthServices();
            const response = await authServices.requestGet({ key: targetKey }, 3);
            if (response.error) throw response.error;
            setExecOutput(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setExecError(err instanceof Error ? err.message : 'Error al ejecutar la aplicación');
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className="upload-card" style={{ maxWidth: pipelineLogs.length > 0 ? '900px' : '500px' }}>
            <div className="status-badge">AWS Modernization Stack</div>
            <h2>Modernización de Código</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                Carga tu archivo legacy para iniciar la transformación a la nube.
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
                        {file ? file.name : 'Seleccionar Archivo .cbl'}
                    </span>
                </label>
                <input id="file-upload" type="file" onChange={handleFileChange} />
            </div>
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                {
                    /*
                    <label className="result-label">Nombre de Aplicación</label>
                    <input type="text" className="input-modern" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Ej: ProcesoDescuentos" style={{ width: '100%', marginBottom: '1rem', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                    */
                }
                <label className="result-label">Legacy Code</label>
                <textarea disabled className="input-modern" value={definitionTemplate} placeholder=""
                    style={{ width: '100%', height: '20rem', minHeight: '80px', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />

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

            {appliedRules.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#22c55e', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Applied Rules</span>
                        <span style={{ marginLeft: 'auto', background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: '99px', padding: '0.1rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>{appliedRules.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {appliedRules.map((rule, i) => (
                            <span key={i} style={{
                                background: 'rgba(34,197,94,0.1)',
                                border: '1px solid rgba(34,197,94,0.3)',
                                color: '#86efac',
                                borderRadius: '8px',
                                padding: '0.3rem 0.75rem',
                                fontSize: '0.8rem',
                                fontFamily: 'monospace'
                            }}>
                                {rule}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {warnings.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f59e0b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Warnings</span>
                        <span style={{ marginLeft: 'auto', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: '99px', padding: '0.1rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>{warnings.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {warnings.map((warn, i) => (
                            <div key={i} style={{
                                background: 'rgba(245,158,11,0.08)',
                                border: '1px solid rgba(245,158,11,0.25)',
                                borderLeft: '3px solid #f59e0b',
                                color: '#fde68a',
                                borderRadius: '8px',
                                padding: '0.4rem 0.75rem',
                                fontSize: '0.82rem',
                                fontFamily: 'monospace'
                            }}>
                                ⚠ {warn}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {modSuccess && (
                <div className="result-area" style={{ borderColor: '#22c55e', marginTop: '1rem' }}>
                    <span className="result-label" style={{ color: '#22c55e' }}>¡Éxito!</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="result-content" style={{ color: 'white', margin: 0 }}>
                            Transformación finalizada correctamente.
                        </div>
                        <button
                            onClick={executeApplication}
                            disabled={executing || !targetKey}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                background: executing ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.15)',
                                border: '1px solid rgba(99,102,241,0.5)',
                                color: '#a5b4fc',
                                borderRadius: '8px',
                                padding: '0.4rem 0.9rem',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                cursor: executing || !targetKey ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {executing ? (
                                <><span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></span> Ejecutando...</>
                            ) : (
                                <>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                    Ejecutar Aplicación
                                </>
                            )}
                        </button>
                    </div>
                    {execOutput.length > 0 && (
                        <div className="terminal-window" style={{ marginTop: '1rem' }}>
                            <div className="terminal-header">
                                <div className="terminal-dot" style={{ background: '#ff5f56' }}></div>
                                <div className="terminal-dot" style={{ background: '#ffbd2e' }}></div>
                                <div className="terminal-dot" style={{ background: '#27c93f' }}></div>
                                <span style={{ marginLeft: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>metadatos-cobol.out</span>
                            </div>
                            <div className="terminal-body">
                                {execOutput.map((line, i) => (
                                    <div key={i} className="terminal-line">{line}</div>
                                ))}
                            </div>
                        </div>
                    )}
                    {execError && (
                        <div style={{ marginTop: '0.5rem', color: '#fca5a5', fontSize: '0.82rem' }}>
                            ⚠ {execError}
                        </div>
                    )}
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
