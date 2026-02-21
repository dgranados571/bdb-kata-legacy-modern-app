import axios from 'axios'
import { fetchUtil } from './fetchUtil';

export class AuthServices {

    requestGet(paramsQuery: any, indexUrl: number): Promise<{ data: any, error: any }> {

        const { url } = fetchUtil();
        let urlRq: string;
        let headers: any;

        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };
        urlRq = `${url[indexUrl].urlEntornoLocal}${url[indexUrl].pathLambda}`;
        console.log(urlRq);
        return new Promise((resolve, reject) => {
            axios.get(urlRq, {
                headers: headers,
                params: paramsQuery
            }).then((response: any) => {
                resolve({
                    data: response.data,
                    error: null
                })
            }).catch((error: any) => {
                reject({
                    data: [],
                    error: error
                })
            })
        })
    }

    requestPost(body: any, indexUrl: number): Promise<{ data: any, error: any }> {

        const { url, apiLambda } = fetchUtil();
        const f = new FormData();
        let urlRq: string;
        let headers: any;
        if (apiLambda) {
            headers = {
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data',
            };
            f.append('urlPath', `${url[indexUrl].urlDominioServidor}${url[indexUrl].pathLambda}`);
            f.append('body', JSON.stringify(body))
            urlRq = `${url[indexUrl].urlEntornoLambda}`;
        } else {
            headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };
            urlRq = `${url[indexUrl].urlEntornoLocal}${url[indexUrl].pathLambda}`;
        }
        const rqBody = apiLambda ? f : body;
        return new Promise((resolve, reject) => {
            axios.post(urlRq, rqBody, {
                headers: headers,
            }).then((response: any) => {
                resolve({
                    data: response.data,
                    error: null
                })
            }).catch((error: any) => {
                reject({
                    data: [],
                    error: error
                })
            })
        })
    }


    requestPutFileUrlPresigned(file: File, presignedUrl: string): Promise<{ data: any, error: any }> {
        return new Promise((resolve, reject) => {
            fetch(presignedUrl, {
                method: 'PUT',
                body: file
            })
                .then(async (response) => {
                    if (response.ok) {
                        resolve({ data: 'Upload successful', error: null });
                    } else {
                        const errorText = await response.text();
                        reject({ data: [], error: `S3 Error ${response.status}: ${errorText}` });
                    }
                })
                .catch((error) => {
                    reject({ data: [], error: error });
                });
        });
    }

}
