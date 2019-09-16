const EventEmitter = require('events').EventEmitter;
const request = require('request');
const requestHandle = require('./utils/requester').RequestClient;

class Client extends EventEmitter {
    constructor(options) {
        super();

        this.options = Object.assign({
            cache: true,
            autoReconnect: true,
            login: null,
            url: "https://www.oncourseconnect.com"
        }, options);
        if (!this.options.login) throw Error('No login types provided');
        this.getCookie();
        this.requestHandle = new requestHandle(this);
    }

    getCookie() {
        request({
            method: "POST",
            url: `${this.options.url}/account/login`,
            formData: this.options.login
        }, async (err, httpResponse, body) => {
            if (err || httpResponse ===! 302) throw Error('Login failed.');
            this.options.cookie = Client.parseCookie(httpResponse.headers['set-cookie']);
        })
    }

    async login() {
        await this.getCookie();
        this.startCheck();
    }

    static parseCookie(cookies) {
        const required = ['_occauth', 'visid_incap', 'incap_ses'];
        let cookieJson = {};
        for (let i in cookies) {
            const name = (cookies[i].split(';')[0]).split('=');
            for (let e in required) {
                if (name[0].includes(required[e])) cookieJson[name[0]] = name[1];
            }
        }

        let string = "";
        const keys = Object.keys(cookieJson);
        for (let cookie of keys) {
            string += `${cookie}=${cookieJson[cookie]}; `
        }
        return string
    }

    getUserId() {
        return new Promise(async resolve => {
            const response = await this.requestHandle.request('POST');
            if(!response.body) resolve(null);
            const match = new RegExp("\"id\":[0-9]+").exec(response.body);
            this.options.userId = match ? match[0].split(':')[1] : match;
            resolve(this.options.userId);
        })
    }

    startCheck () {
        setInterval(() => {
            request({
                method: "POST",
                url: `${this.options.url}/api/classroom/notifications/check_updates`,
                headers: {
                    'Cookie': this.options.cookie
                }
            }, (err, httpResponse, body) => {
                if (err || !body || httpResponse.statusCode === 500) {
                    this.emit('update', null);
                    return;
                }
                this.emit('update', JSON.parse(body));
            });
        }, 3000)
    }
}

module.exports = { Client };
