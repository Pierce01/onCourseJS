# onCourseJS
The following is a really simple wrapper for the undocumented OnCourse Connect's API that I'll be using for simple projects in the future. It's pretty messy right now since I just wanted to add all of the endpoints I needed then work out the looks later down the road.

## How to use
### Installing
Well, this isn't on NPM yet so download the zip and run `npm i` to download all the dependencies.

### Logging in
You'll only need to provide your username and password, then onCourseJS will handle everything else.
```js
const OCJ  =  require('onCourseJS');
const Client = new OCJ.Client({
    username: "username",
    password: "password"
});
Client.watchForUpdates();

Client.on('update', async (e) => { console.log(e) });
```

## Documentation 
### Client
Client is a constructor that requires the following information to start properly.
| Parameter             | Type    | Description                                                                                           |
|-----------------------|---------|-------------------------------------------------------------------------------------------------------|
| `options.username`      | String  | Username for the OnCourse Connect account.                                                            |
| `options.password`      | String  | Password for the OnCourse Connect account.                                                            |
| `options.autoReconnect `| Boolean | If the cookie becomes invalid and this is set to true, onCourseJS will attempt to get the new cookie. |

### watchForUpdates()
```js
Client.watchForUpdates();
```
Returns nothing, however it will emit an `update` event when it makes a successful request.

### async request()
This will allow you to send a request that has the correct headers and cookies to get information from OnCourse Connect's API or website (In case you want to scrape the HTML).
```js
Client.request('Method', '/endpoint', {options}, params)
```
| Parameter | Type   | Description                                                                                     |
|-----------|--------|-------------------------------------------------------------------------------------------------|
| method    | String | A request method like `POST` or `GET`.                                                          |
| Endpoint  | String | Endpoint you're targeting.                                                                      |
| options      | Object | Other options you want to add to the request object, like adding `formData`. Can be left empty. |
| params    | String | The parameters at the end of the url like `?date=x/x/x&id=12332`.                            |

### async getIds()
Returns a JSON Object with user and school specific ids. 
```js 
console.log(await Client.getIds());
```

### async getCookie()
Returns the formatted cookie (a string) if you need it for something.
```js
console.log(await Client.getCookie());
```

### async getMessages()
Returns an array/JSON Object with messages from OnCourse Connect's announcements.
```js
console.log(await Client.getMessages());
```

### async getAttendence()
Returns a JSON Object with your attendance from every class.
```js
console.log(await Client.getAttendence());
```

### async getCalanders()
Returns class and school calendars in a JSON Object.
```js
console.log(await Client.getCalanders());
```

### async getCalander()
Returns a JSON Object with a specific calendar
| Parameter | Type   | Description                                         |
|-----------|--------|-----------------------------------------------------|
| date      | String | Date for the specific calendar. Date is an integer. if none is provided, will default on today|

```js
console.log(await Client.getCalander(new  Date().getTime()));
```

### async getGrades()
Returns your grades in a JSON Object.
```js
console.log(await Client.getGrades());
```

### async getRecentGrades()
Returns your recent grades in a JSON Object.
```js
console.log(await Client.getRecentGrades());
```

### async getBellHeaders()
Returns bell headers in a JSON Object. What are bell headers? It's how OnCourse formats their schedules for a half day, snow day, or a normal day.
```js
console.log(await Client.getBellHeaders());
```

### async getScheduleMatrix()
Returns JSON Object with a schedule matrix depending on the type.
| Paramater | Type     | Description                                                                       |
|-----------|----------|-----------------------------------------------------------------------------------|
| type      | interger | which matrix you want. (Half day schedule or full day). Review `getBellHeaders`. |

```js
console.log(await Client.getScheduleMatrix(0));
```

### async getSchedule()
Returns JSON Object with a schedule for the day depending on the type.
| Paramater | Type     | Description                                                                       |
|-----------|----------|-----------------------------------------------------------------------------------|
| type      | interger | which schedule you want. (Half day or full day). Review `getBellHeaders`. |

```js
console.log(await Client.getSchedule(0));
```

## Any questions?
DM me on Twitter (@YasuoPierce) or create an issue on the repo.