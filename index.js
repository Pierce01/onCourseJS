const EventEmitter = require('events').EventEmitter;
const _request = require('request');

class Client extends EventEmitter {
    constructor(options) {
        super();

        this.options = Object.assign({
            autoReconnect: true,
            url: "https://www.oncourseconnect.com"
        }, options);
        if (!this.options.username || !this.options.password) throw Error('Username or password not provided.');
        this.options.cookie = this.getCookie();
    }

    watchForUpdates() {
        setInterval(async () => {
            const response = await this.request('POST', '/api/classroom/notifications/check_updates');
            if(!response) throw Error('Unable to get update!');
            this.emit('update', JSON.parse(response.body));
        }, 3000)
    }

    request(method, endpoint = " ", opts) {
        return new Promise(async resolve => {
            _request({method, url: this.options.url + endpoint, headers: {'Cookie': await Promise.resolve(this.options.cookie)}, ...opts}, (error, response, body) => {
                if(error || response.statusCode === 500) {
                    this.emit('error', {error, code: response.statusCode});
                    resolve(false);
                }
                resolve(response, body);
            })
        });
    }

    getIds() {
        return new Promise(async resolve => {
            const response = await this.request('POST');
            if(!response.body) resolve(null);
            this.options.ids = {
                user: (new RegExp("\"id\":[0-9]+").exec(response.body))[0].split(':')[1],
                schoolyear: (new RegExp("\"schoolYearId\":[0-9]+").exec(response.body))[0].split(':')[1],
                school: (new RegExp("\"schoolId\":[0-9]+").exec(response.body))[0].split(':')[1]
            }
            resolve(this.options.ids);
        })
    }

    async getCookie() {
        const response = await this.request('POST', '/account/login', {
            formData: { username: this.options.username, password: this.options.password }
        });
        if(!response || response.statusCode ===! 302) throw Error('Login failed.')
        return parseCookie(response.headers['set-cookie']);;
    }

    async getMessages() {
        const response = await this.request('GET', '/json.axd/classroom/messages/get_messages');
        if(!response) return null;
        return JSON.parse(response.body);
    }

    async getAttendence() {
        const ids = await this.getIds();
        const response = await this.request('GET', `/api/classroom/attendance/attendance_summary?schoolID=${ids.school}&schoolYearID=${ids.schoolyear}&studentID=${ids.user}`);
        if(!response) return null;
        return JSON.parse(response.body)
    }
}

function parseCookie(cookies) {
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

module.exports = { Client };
