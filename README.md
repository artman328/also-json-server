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
    { "id": "1", "name": "Tracy", "mobile": "(555)1234-1256" },
    { "id": "2", "name": "Tina", "mobile": "(555)2367-1287" },
    { "id": "3", "name": "Bill", "mobile": "(555)2589-1134" },
    { "id": "4", "name": "Michael", "mobile": "(555)3345-2345" },
    { "id": "5", "name": "Jackie", "mobile": "(555)1123-1123" }
  ],
  "groups": [
    { "id": "1", "name": "Colegue" },
    { "id": "2", "name": "Friend" },
    { "id": "3", "name": "Family" },
    { "id": "4", "name": "Business" }
  ],
  "contacts_groups": [
    { "id": "1", "contactId": "1", "groupId": "1" },
    { "id": "2", "contactId": "1", "groupId": "2" },
    { "id": "3", "contactId": "2", "groupId": "1" },
    { "id": "4", "contactId": "2", "groupId": "3" },
    { "id": "5", "contactId": "3", "groupId": "1" },
    { "id": "6", "contactId": "3", "groupId": "2" },
    { "id": "7", "contactId": "3", "groupId": "3" }
  ],
  "members": [
    { "id": "1", "name": "Lexi", "clubs": ["1", "3"] },
    { "id": "2", "name": "Ben", "clubs": ["1"] },
    { "id": "3", "name": "Billy", "clubs": ["2", "3"] },
    { "id": "4", "name": "Jane", "clubs": ["1", "5"] },
    { "id": "5", "name": "Jhon", "clubs": ["2", "5"] },
    { "id": "6", "name": "Mark", "clubs": [] },
    { "id": "7", "name": "Joe", "clubs": ["1", "3"] }
  ],
  "clubs": [
    { "id": "1", "name": "club 1" },
    { "id": "2", "name": "club 2" },
    { "id": "3", "name": "club 3" },
    { "id": "4", "name": "club 4" },
    { "id": "5", "name": "club 5" }
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
    }
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
    { id: "1", name: "Tracy", mobile: "(555)1234-1256" },
    { id: "2", name: "Tina", mobile: "(555)2367-1287" },
    { id: "3", name: "Bill", mobile: "(555)2589-1134" },
    { id: "4", name: "Michael", mobile: "(555)3345-2345" },
    { id: "5", name: "Jackie", mobile: "(555)1123-1123" },
  ],
  groups: [
    { id: "1", name: "Colegue" },
    { id: "2", name: "Friend" },
    { id: "3", name: "Family" },
    { id: "4", name: "Business" },
  ],
  contacts_groups: [
    { id: "1", contactId: "1", groupId: "1" },
    { id: "2", contactId: "1", groupId: "2" },
    { id: "3", contactId: "2", groupId: "1" },
    { id: "4", contactId: "2", groupId: "3" },
    { id: "5", contactId: "3", groupId: "1" },
    { id: "6", contactId: "3", groupId: "2" },
    { id: "7", contactId: "3", groupId: "3" },
  ],
  members: [
    { id: "1", name: "Lexi", clubs: ["1", "3"] },
    { id: "2", name: "Ben", clubs: ["1"] },
    { id: "3", name: "Billy", clubs: ["2", "3"] },
    { id: "4", name: "Jane", clubs: ["1", "5"] },
    { id: "5", name: "Jhon", clubs: ["2", "5"] },
    { id: "6", name: "Mark", clubs: [] },
    { id: "7", name: "Joe", clubs: ["1", "3"] },
  ],
  clubs: [
    { id: "1", name: "club 1" },
    { id: "2", name: "club 2" },
    { id: "3", name: "club 3" },
    { id: "4", name: "club 4" },
    { id: "5", name: "club 5" },
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

## Authorization

Use --auth option to use authorization. You can bear a token with the header field "Authorization",
like `Authorization: Bearer <token>`, or you can just add a query parameter "_token" like `_token=<token>` to send
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

### Embed

```
# one to many: embed "many" side
GET /posts?_embed=comments
GET /posts/1?_embed=comments


# one 2 many: embed "one" side
GET /comments?_embed=post

# many to many: through a list of ids of another side in one side
# (higher priority than an intermediate list)
GET /members?_embed=clubs
GET /members/1?_embed=clubs
GET /clubs?_embed=members
GET /clubs/1?_embed=members

# many to many: through an intermediate list
# name can be "anyside_anyside", like "contacts_groups"
# or "groups_contacts"
GET /contacts?_embed=groups
GET /contacts/1?_embed=groups
GET /groups?_embed=contacts
GET /groups/1?_embed=contacts


```

## Delete

```
DELETE /posts/1

## delete 'many' side of one-to-many
DELETE /posts/1?_dependent=comments

## delete a record of many-to-many on any side
## will remove the relationship automatically
DELETE /contacts/1
DELETE /clubs/2
```

## Serving static files

If you create a `./public` directory, JSON Serve will serve its content in addition to the REST API.

You can also add custom directories using `-s/--static` option.

```sh
also-json-server -s ./static
also-json-server -s ./static -s ./node_modules
```

## Notable differences

- `id` is always a string and will be generated for you if missing
- use `_per_page` with `_page` instead of `_limit`for pagination
- use Chrome's `Network tab > throtling` to delay requests instead of `--delay` CLI option
