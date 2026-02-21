export interface UrlConfig {
    urlEntornoLocal: string;
    urlEntornoLambda: string;
    pathLambda: string;
    urlDominioServidor: string;
}

export interface UrlMap {
    [key: number]: UrlConfig;
}

export const fetchUtil = () => {

    const urlEntornoLocal = 'http://localhost:8080';
    const urlEntornoLambda = 'https://cgmoazbtxd.execute-api.us-east-1.amazonaws.com/Stage/unadmin';
    const urlDominioServidor = 'http://54.234.101.68:8080';

    const url: UrlMap = {
        1: {
            urlEntornoLocal,
            urlEntornoLambda,
            pathLambda: '/api/modernization/aws/presigned-url',
            urlDominioServidor
        },
        2: {
            urlEntornoLocal,
            urlEntornoLambda,
            pathLambda: '/api/modernization/full-pipeline',
            urlDominioServidor
        }
    }

    return {
        apiLambda: false,
        url
    }

}