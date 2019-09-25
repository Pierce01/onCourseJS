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
            if(!response) {
                if(!this.options.autoReconnect) {
                    throw Error("Couldn't get updates")
                }
                this.options.cookie = this.getCookie();
            };
            this.emit('update', JSON.parse(response.body));
        }, 3000)
    }

    request(method, endpoint = "", opts, params = "") {
        return new Promise(async resolve => {
            _request({method, url: `${this.options.url}${endpoint}${params}`, headers: {'Cookie': await Promise.resolve(this.options.cookie)}, ...opts}, (error, response, body) => {
                if(error || response.statusCode === 500) {
                    this.emit('error', {error, code: (response ? response.statusCode: null)});
                    resolve(false);
                }
                resolve(response, body);
            })
        });
    }

    async getIds() {
        if(this.options.ids) return this.options.ids;
        const response = await this.request('POST');
        if(!response.body) return null;
        this.options.ids = {
            studentID: (new RegExp("\"id\":[0-9]+").exec(response.body))[0].split(':')[1],
            schoolYearID: (new RegExp("\"schoolYearId\":[0-9]+").exec(response.body))[0].split(':')[1],
            schoolID: (new RegExp("\"schoolId\":[0-9]+").exec(response.body))[0].split(':')[1]
        }
        return this.options.ids
    }

    async getCookie() {
        const response = await this.request('POST', '/account/login', {
            formData: { username: this.options.username, password: this.options.password }
        });
        if(!response || response.statusCode ===! 302) throw Error('Login failed.');
        this.options.cookie = parseCookie(response.headers['set-cookie']);
        return this.options.cookie;
    }

    async getMessages() {
        const response = await this.request('GET', '/json.axd/classroom/messages/get_messages');
        if(!response) return null;
        return JSON.parse(response.body);
    }

    async getAttendence() {
        const ids = await this.getIds();
        const response = await this.request('GET', '/api/classroom/attendance/attendance_summary', {}, parseParams(ids));
        if(!response) return null;
        return JSON.parse(response.body)
    }

    async getCalanders() {
        const ids = await this.getIds();
        const response = await this.request('GET', '/api/classroom/calendar/get_student_calendars', {}, parseParams(ids));
        if(!response) return null;
        return JSON.parse(response.body)
    }

    async getCalander(date) {
        const response = await this.request('GET', '/api/classroom/calendar/calendar', {}, parseParams({
            ids: (await this.getIds()).studentID,
            start: 1568865600,
            end: 1568952000,
            _: date || new Date().getTime()
        }));
        if(!response) return null;
        return JSON.parse(response.body);
    }

    async getGrades() {
        const response = await this.request('GET', '/api/classroom/grades/report_cards', {}, parseParams(await this.getIds()));
        if(!response) return null;
        return JSON.parse(response.body);
    }

    async getRecentGrades() {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);
        const response = await this.request('GET', '/api/classroom/dashboard/recent_grades', {}, parseParams({
            endDate: formatDate(new Date()),
            startDate: formatDate(startDate),
            studentId: (await this.getIds()).studentID
        }));
        if(!response) return null;
        return JSON.parse(response.body)
    }

    async getBellHeaders() {
        if(this.options.bellHeaders) return this.options.bellHeaders;

        const ids = await this.getIds();
        const response = await this.request('GET', '/api/classroom/schedule/get_bell_schedule_headers', {}, parseParams({
            schoolYearID: ids.schoolYearID,
            studentID: ids.studentID
        }));
        if(!response) return null;
        this.options.bellHeaders = JSON.parse(response.body);
        return this.options.bellHeaders;
    }

    async getScheduleMatrix(type) {
        const ids = await this.getIds();
        const headerType = await this.getBellHeaders();
        const response = await this.request('GET', '/api/classroom/schedule/get_schedule_matrix', {}, parseParams({
            bellHeaderID: headerType.ReturnValue[type].id, schoolID: ids.schoolID, schoolYearID: ids.schoolYearID, studentID: ids.studentID
        }));
        if(!response) return null;
        return JSON.parse(response.body);
    }

    async getSchedule(type) {
        const ids = await this.getIds();
        const headerType = await this.getBellHeaders();
        const response = await this.request('GET', '/api/classroom/schedule/get_student_schedule_on_date', {}, parseParams({
            bellHeaderId: headerType.ReturnValue[type].id, selectedDate: new Date().toISOString(), studentID: ids.studentID
        }));
        if(!response) return null;
        return JSON.parse(response.body);
    }
}

function parseCookie(cookies) {
    const required = ['_occauth', 'visid_incap', 'incap_ses'];
    let string = "";
    for (let i in cookies) {
        const name = (cookies[i].split(';')[0]).split('=');
        for (let e in required) {
            if (name[0].includes(required[e])) string += `${name[0]}=${name[1]};`;
        }
    }
    return string;
}

function parseParams(params) {
    return '?' + Object.keys(params).map(function(key) {
        return key + '=' + params[key]
    }).join('&');
}

// Stackoverflow
function formatDate(date) {
    const d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
    return [month, day, year].join('/');
}

module.exports = { Client };