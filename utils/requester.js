const _request = require('request');

class RequestClient {
    constructor(client) {
        this.client = client;
        this.options = client.options;
    }

    request(method, endpoint = " ", opts) {
        return new Promise(resolve => {
            _request({method, url: this.options.url + endpoint, headers: {'Cookie': this.options.cookie}}, (error, response, body) => {
                if(error || response.statusCode === 500) {
                    this.client.emit('error', {error, code: response.statusCode});
                    resolve(false);
                }
                resolve(response, body);
            })
        });
    }
}

module.exports = { RequestClient };
