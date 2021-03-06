import axios from 'axios';
import livingApi from './modules/livingapi';
import { ul4 } from './modules/ul4';
import * as https from 'https';
let commonjs = (typeof module === 'object' && module.exports);
export class LivingSDK {
    constructor(options = {}, username, password) {
        this._password = password || '';
        this._userName = username || '';
        this._options = {
            url: options.url || 'https://my.living-apps.de',
            loginRequired: options.loginRequired !== undefined ? options.loginRequired : true
        };
        this._options.url = this._options.url.lastIndexOf('/') === this._options.url.length - 1 ? this._options.url : `${this._options.url}/`;
        this.hostName = this._options.url.split('//')[1].substr(0, this._options.url.split('//')[1].length - 1);
        if (this._options.loginRequired && !this._userName) {
            throw new Error('[LivingSDK] You want to login without a username');
        }
        this.session = this.login();
    }
    login() {
        if (!this._options.loginRequired) {
            return Promise.resolve(undefined);
        }
        let url = `https://${this.hostName}/gateway/login`;
        return axios.post(url, {
            username: this._userName,
            password: this._password
        }, {
            httpsAgent: commonjs ? new https.Agent({
                ecdhCurve: 'auto'
            }) : undefined,
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then((a) => a.data.auth_token);
    }
    get(appId, templateName) {
        return this.session.then((auth_token) => {
            return axios.get(`https://${this.hostName}/gateway/apps/${appId}${templateName !== undefined ? '?template=' + templateName : ''}`, {
                httpsAgent: commonjs ? new https.Agent({
                    ecdhCurve: 'auto'
                }) : undefined,
                headers: {
                    'X-La-Auth-Token': auth_token !== undefined ? auth_token : '',
                    Accept: 'application/la-ul4on'
                }
            })
                .then((res) => {
                let dump;
                dump = ul4.loads(res.data);
                dump.get('globals').Login = this;
                return dump;
            });
        });
    }
    _insert(app, values) {
        return this.session.then((auth_token) => {
            let fields = {};
            for (let ident in values) {
                if (!app.controls.has(ident)) {
                    throw new Error(`insert() got an unexpected keyword argument ${ident}`);
                }
                fields[ident] = app.controls.get(ident).asjson(values[ident]);
            }
            let data = {};
            {
            }
            data.id = app.id;
            data.data = [{ 'fields': fields }];
            return axios.post(`https://${this.hostName}/gateway/v1/appdd/${app.id}.json`, {
                appdd: data
            }, {
                httpsAgent: commonjs ? new https.Agent({
                    ecdhCurve: 'auto'
                }) : undefined,
                headers: {
                    'X-La-Auth-Token': auth_token !== undefined ? auth_token : '',
                }
            })
                .then((res) => {
                return {
                    HTTPstatusCode: res.status,
                    recordid: res.data.id,
                    Record: new livingApi.Record({
                        id: res.data.id,
                        createdat: new Date(Date.now()),
                        updatedat: null,
                        updatedby: null,
                        updatecount: 0
                    })
                };
            });
        });
    }
    _update(record, values) {
        return this.session.then((auth_token) => {
            let fields = {};
            let app = record.app;
            for (let ident in values) {
                if (!app.controls.has(ident)) {
                    throw new Error(`update() got an unexpected keyword argument ${ident}`);
                }
                fields[ident] = values[ident];
            }
            let data = {};
            data.id = app.id;
            data.data = [{ 'id': record.id, 'fields': fields }];
            console.log(`https://${this.hostName}/gateway/v1/appdd/${app.id}.json`);
            return axios.post(`https://${this.hostName}/gateway/v1/appdd/${app.id}.json`, {
                appdd: data
            }, {
                httpsAgent: commonjs ? new https.Agent({
                    ecdhCurve: 'auto'
                }) : undefined,
                headers: {
                    'X-La-Auth-Token': auth_token !== undefined ? auth_token : '',
                    'Content-Type': 'application/json'
                }
            })
                .then((res) => {
                let body = res.data;
                for (let ident in values)
                    record.fields.get(ident).value = values[ident];
                let returnObj = {
                    HTTPstatusCode: res.status,
                    recordid: body.id,
                    Record: record
                };
                return returnObj;
            });
        });
    }
    _delete(record) {
        let app = record.app;
        return this.session.then((auth_token) => {
            return axios.delete(`https://${this.hostName}/gateway/v1/appdd/${app.id}/${record.id}.json`, {
                httpsAgent: commonjs ? new https.Agent({
                    ecdhCurve: 'auto'
                }) : undefined,
                headers: {
                    'X-La-Auth-Token': auth_token !== undefined ? auth_token : '',
                }
            });
        });
    }
}
export default LivingSDK;
//# sourceMappingURL=livingsdk.js.map