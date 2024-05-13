# also-json-server

This is a fork of [json-server](https://github.com/typicode/json-server). Thanks to the author of the great project!

This fork can handle many-to-many relationship in data.

## Install

```shell
npm install -g also-json-server
```

## Try the server

Before you create your data file, you can let the server to generate a data file for you to try the server. The generated file name will be `also-json-server-test-db.json5`.
The generated data will be like the example below.

```
also-json-server --try-server
```

The server will start and you can try any request you want.

Each time you use this option to start the server, you will get a brand new data file to try.

## Usage

Create your data file `<data_file_name>.json` or `<data_file_name>.json5` file like below.
(or you can use `--try-server` option to generate the data to try the server first.)

```json
{
  "users": [
    {
      "id": "1",
      "username": "User1",
      "password": "UserPass1",
      "token": "3604ab439517b1bc0161a8debd461d8461863b99"
    },
    {
      "id": "2",
      "username": "User2",
      "password": "UserPass2",
      "token": "aeabb98dde7f53034dc8946edb0816f3511dedf2"
    }
  ],
  "posts": [
    { "id": "1", "title": "a title", "views": 100 },
    { "id": "2", "title": "another title", "views": 200 }
  ],
  "comments": [
    { "id": "1", "text": "a comment about post 1", "postId": "1" },
    { "id": "2", "text": "another comment about post 1", "postId": "1" }
  ],
  "contacts": [
    {
      "id": "1",
      "name": "Tracy",
      "mobile": "(555)1234-1256",
      "groups": ["1", "2"]
    },
    {
      "id": "2",
      "name": "Tina",
      "mobile": "(555)2367-1287",
      "groups": ["1", "3"]
    },
    {
      "id": "3",
      "name": "Bill",
      "mobile": "(555)2589-1134",
      "groups": ["1", "2", "3"]
    },
    { "id": "4", "name": "Michael", "mobile": "(555)3345-2345", "groups": [] },
    { "id": "5", "name": "Jackie", "mobile": "(555)1123-1123", "groups": [] }
  ],
  "groups": [
    { "id": "1", "name": "Collegue" },
    { "id": "2", "name": "Friend" },
    { "id": "3", "name": "Family" },
    { "id": "4", "name": "Business" }
  ],
  "profile": {
    "name": "typicode"
  }
}
```

<details>

<summary>View db.json5 example</summary>

```json5
{
  users: [
    {
      id: "1",
      username: "User1",
      password: "UserPass1",
      token: "3604ab439517b1bc0161a8debd461d8461863b99",
    },
    {
      id: "2",
      username: "User2",
      password: "UserPass2",
      token: "aeabb98dde7f53034dc8946edb0816f3511dedf2",
    },
  ],
  posts: [
    { id: "1", title: "a title", views: 100 },
    { id: "2", title: "another title", views: 200 },
  ],
  comments: [
    { id: "1", text: "a comment about post 1", postId: "1" },
    { id: "2", text: "another comment about post 1", postId: "1" },
  ],
  contacts: [
    { id: "1", name: "Tracy", mobile: "(555)1234-1256", groups: ["1", "2"] },
    { id: "2", name: "Tina", mobile: "(555)2367-1287", groups: ["1", "3"] },
    {
      id: "3",
      name: "Bill",
      mobile: "(555)2589-1134",
      groups: ["1", "2", "3"],
    },
    { id: "4", name: "Michael", mobile: "(555)3345-2345", groups: [] },
    { id: "5", name: "Jackie", mobile: "(555)1123-1123", groups: [] },
  ],
  groups: [
    { id: "1", name: "Collegue" },
    { id: "2", name: "Friend" },
    { id: "3", name: "Family" },
    { id: "4", name: "Business" },
  ],
  profile: {
    name: "typicode",
  },
}
```

You can read more about JSON5 format [here](https://github.com/json5/json5).

</details>

Pass it to JSON Server CLI

```shell
$ also-json-server <data_file_name>.json
```

Get a REST API

```shell
$ curl http://localhost:3000/posts/1
{
  "id": "1",
  "title": "a title"
}
```

Run `also-json-server --help` for a list of options

```shell
Usage: also-json-server [options] <file>

Options:
  -p, --port <port>      Port (default: 3000)
  -h, --host <host>      Host (default: localhost)
  -s, --static <dir>     Static files directory (multiple allowed)
  -a, --auth             Use authorization to access
  -P, --path <path>      Add partial path to customize url, like /api/v1
  -o, --return-object    Return result as an object with status code, message and data
  -t  --try-server       Generate a data file to try the server
  -d  --delay <auto|ms>  Delay the response for some milliseconds to mimic network latency,
                         "auto" means the time will be in 300~1000 ms randomly for each request.     
  --help                 Show this message
  --version              Show version number
```

## Relationship

You can utilize a specified JSON data structure to establish relationships such as one-to-many and many-to-many.

For a one-to-many relationship, you incorporate a foreign key into the records on the 'many' side, as demonstrated by the sample data provided with posts (representing the one side) and comments (representing the many side). The foreign key should be in lowercase singular form and appended with "Id", representing the referenced collection's name. For instance, you can use "postId" to reference the posts collection.

Regarding many-to-many relationships, you can employ an array property on one side (often associated with the side containing more records) to store the relationships with the other side. For instance, you could use the "groups" array property within the records on the "contacts" side to maintain these relationships.

When adding or modifying records, the specified reference IDs (whether specified using foreign keys or arrays) are automatically checked. If they do not exist, an error message will be returned to notify you of the reason. When deleting records, the 'many' side of a one-to-many relationship can either choose to cascade delete or set the foreign key to null. In the case of many-to-many relationships, they will be automatically removed. Of course, you can also change many-to-many relationships by modifying elements within the array property containing the other 'many' side.

## Authorization

Use --auth option to use authorization. You can bear a token with the header field "Authorization",
like `Authorization: Bearer <token>`, or you can just add a query parameter "\_token" like `_token=<token>` to send
the token. The token can be returned after login successfully.

When use --auth, the json data file should has a collection named "users", a user should has the properties of "id", "username", "password(plain text)" and "token(a string of any length)" .

Use POST "/auth/login" to login to get a user's token.

## Routes

Based on the example `<data_file_name>.json`, you'll get the following routes:

```
GET    /posts
GET    /posts/:id
POST   /posts
PUT    /posts/:id
PATCH  /posts/:id
DELETE /posts/:id

# Same for other collections
```

```
GET   /profile
PUT   /profile
PATCH /profile
```

You can use `--path <path>` to add partial path to customize you url.

```
also-json-server --path /api/v1
```

will generate the routes like:

```
GET    api/v1/posts
GET    api/v1/posts/:id
POST   api/v1/posts
PUT    api/v1/posts/:id
PATCH  api/v1/posts/:id
DELETE api/v1/posts/:id

# Same for other collections
```

## Delay Responses

You can use `--delay <auto|ms>` to delay a response for each request to mimic network letancy.

`auto` will delay each response from 300ms to 1000ms randomly.

## Response format

By default, requests will return just data.

```json
[
  {"id": "1", "name": "Lexi"},
  ...
]
```

You can use `--return-object` to tell the server to return an object with `statusCode`, `message` and the data properties.

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {"id": "1", "name": "Lexi"},
    ...
  ]
}
```

## Params

### Conditions

- ` ` → `==`
- `lt` → `<`
- `lte` → `<=`
- `gt` → `>`
- `gte` → `>=`
- `ne` → `!=`

```
GET /posts?views_gt=9000
```

### Range

- `start`
- `end`
- `limit`

```
GET /posts?_start=10&_end=20
GET /posts?_start=10&_limit=10
```

### Paginate

- `page`
- `per_page` (default = 10)

```
GET /posts?_page=1&_per_page=25
```

### Sort

- `_sort=f1,f2`

```
GET /posts?_sort=id,-views
```

### Nested and array fields

- `x.y.z...`
- `x.y.z[i]...`

```
GET /foo?a.b=bar
GET /foo?x.y_lt=100
GET /foo?arr[0]=bar
```

### Embed Related Records

```
# one to many: embed "many" side
GET /posts?_embed=comments
GET /posts/1?_embed=comments


# one to many: embed "one" side
GET /comments?_embed=post


# many to many
GET /contacts?_embed=groups
GET /contacts/1?_embed=groups
GET /groups?_embed=contacts
GET /groups/1?_embed=contacts


```

## Delete

```
## 'many' side related foreign keys will be set to null
DELETE /posts/1

## cascading delete 'many' side of one-to-many
DELETE /posts/1?_dependent=comments

## delete a record of many-to-many on any side
## will remove the relationship automatically

## groups that contact 1 is in will remain, but the relationship 
## to contact 1 will be removed automatically
DELETE /contacts/1

## contacts that is in the group 2 will remain, but the relationship 
## to the group 2 will be removed automatically
DELETE /group/2
```

## Serving static files

If you create a `./public` directory, JSON Serve will serve its content in addition to the REST API.

You can also add custom directories using `-s/--static` option.

```sh
also-json-server -s ./static
also-json-server -s ./static -s ./node_modules
```

## Notable differences

- `id` is always an integer and will be generated for you if missing
- use `_per_page` with `_page` instead of `_limit`for pagination
- use Chrome's `Network tab > throtling` to delay requests instead of `--delay` CLI option
