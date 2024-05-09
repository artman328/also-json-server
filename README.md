# also-json-server

This is a fork of [json-server](https://github.com/typicode/json-server). Thanks to the author of the great project!

This fork can handle many-to-many relationship in data.

## Install

```shell
npm install also-json-server
```

## Usage

Create a `db.json` or `db.json5` file

```json
{
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
    {"id":"1","name":"Lexi","clubs":["1","3"]},
    {"id":"2","name":"Ben","clubs":["1"]},
    {"id":"3","name":"Billy","clubs":["2","3"]},
    {"id":"1","name":"Jane","clubs":["1","5"]},
    {"id":"1","name":"Jhon","clubs":["2","5"]},
    {"id":"1","name":"Mark","clubs":["5"]},
    {"id":"1","name":"Joe","clubs":["1","3"]}
  ],
  "clubs": [
    {"id":"1","name":"club 1"},
    {"id":"2","name":"club 2"},
    {"id":"3","name":"club 3"},
    {"id":"4","name":"club 4"},
    {"id":"5","name":"club 5"}
  ]
}
```

<details>

<summary>View db.json5 example</summary>

```json5
{
  posts: [
    { id: "1", title: "a title", views: 100 },
    { id: "2", title: "another title", views: 200 }
  ],
  comments: [
    { id: "1", text: "a comment about post 1", postId: "1" },
    { id: "2", text: "another comment about post 1", postId: "1" }
  ],
  contacts: [
    { id: "1", name: "Tracy", mobile: "(555)1234-1256" },
    { id: "2", name: "Tina", mobile: "(555)2367-1287" },
    { id: "3", name: "Bill", mobile: "(555)2589-1134" },
    { id: "4", name: "Michael", mobile: "(555)3345-2345" },
    { id: "5", name: "Jackie", mobile: "(555)1123-1123" }
  ],
  groups: [
    { id: "1", name: "Colegue" },
    { id: "2", name: "Friend" },
    { id: "3", name: "Family" },
    { id: "4", name: "Business" }
  ],
  contacts_groups: [
    { id: "1", contactId: "1", groupId: "1" },
    { id: "2", contactId: "1", groupId: "2" },
    { id: "3", contactId: "2", groupId: "1" },
    { id: "4", contactId: "2", groupId: "3" },
    { id: "5", contactId: "3", groupId: "1" },
    { id: "6", contactId: "3", groupId: "2" },
    { id: "7", contactId: "3", groupId: "3" }
  ],
  members: [
    {id:"1",name:"Lexi",clubs:["1","3"]},
    {id:"2",name:"Ben",clubs:["1"]},
    {id:"3",name:"Billy",clubs:["2","3"]},
    {id:"1",name:"Jane",clubs:["1","5"]},
    {id:"1",name:"Jhon",clubs:["2","5"]},
    {id:"1",name:"Mark",clubs:["5"]},
    {id:"1",name:"Joe",clubs:["1","3"]}
  ],
  clubs: [
    {id:"1",name:"club 1"},
    {id:"2",name:"club 2"},
    {id:"3",name:"club 3"},
    {id:"4",name:"club 4"},
    {id:"5",name:"club 5"}
  ]
}
```

You can read more about JSON5 format [here](https://github.com/json5/json5).

</details>

Pass it to JSON Server CLI

```shell
$ npx also-json-server db.json
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


## Routes

Based on the example `db.json`, you'll get the following routes:

```
GET    /posts
GET    /posts/:id
POST   /posts
PUT    /posts/:id
PATCH  /posts/:id
DELETE /posts/:id

# Same for comments
```

```
GET   /profile
PUT   /profile
PATCH /profile
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

# one 2 many: embed "one" side
GET /comments?_embed=post

# many to many: through a list of ids of another side in one side (higher priority than an intermediate list)
GET /members?_embed=clubs
GET /clubs?_embed=members 

# many to many: through an intermediate list
# name can be "anyside_anyside", like "contacts_groups"
# or "groups_contacts"
GET /contacts?_embed=groups
GET /groups?_embed=contacts


```



## Delete

```
DELETE /posts/1
DELETE /posts/1?_dependent=comments
```

## Serving static files

If you create a `./public` directory, JSON Serve will serve its content in addition to the REST API.

You can also add custom directories using `-s/--static` option.

```sh
json-server -s ./static
json-server -s ./static -s ./node_modules
```

## Notable differences with v0.17

- `id` is always a string and will be generated for you if missing
- use `_per_page` with `_page` instead of `_limit`for pagination
- use Chrome's `Network tab > throtling` to delay requests instead of `--delay` CLI option
