import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

import getPort from 'get-port'
import { Low, Memory } from 'lowdb'
import { temporaryDirectory } from 'tempy'

import { createApp } from './app.js'
import { Data } from './service.js'

type Test = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  method: HTTPMethods
  url: string,
  body?: object, 
  statusCode: number
}

type HTTPMethods =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'OPTIONS'

const port = await getPort()

// Create custom static dir with an html file
const tmpDir = temporaryDirectory()
const file = 'file.html'
writeFileSync(join(tmpDir, file), 'utf-8')

// Create app
const db = new Low<Data>(new Memory<Data>(), {})
db.data = {
  posts: [{ id: '1', title: 'foo' }],
  comments: [{ id: '1', postId: '1' }],
  object: { f1: 'foo' },
  contacts: [{id:"1",name:"Tracy",mobile:"(555)5417-0987"}],
  groups:[{id:"1",name:"collegue"}],
  contacts_groups:[{id:"1",contactId:"1",groupId:"1"}],
}
const app = createApp(db, { static: [tmpDir] },false,'',false,"")

await new Promise<void>((resolve, reject) => {
  try {
    const server = app.listen(port, () => resolve())
    test.after(() => server.close())
  } catch (err) {
    reject(err)
  }
})

await test('createApp', async (t) => {
  // URLs
  const POSTS = '/posts'
  const POSTS_WITH_COMMENTS = '/posts?_embed=comments'
  const POST_1 = '/posts/1'
  const POST_NOT_FOUND = '/posts/-1'
  const POST_WITH_COMMENTS = '/posts/1?_embed=comments'
  const COMMENTS = '/comments'
  const POST_COMMENTS = '/comments?postId=1'
  const NOT_FOUND = '/not-found'
  const OBJECT = '/object'
  const OBJECT_1 = '/object/1'

  const CONTACTS = '/contacts'
  const GROUPS = '/groups'
  const CONTACTS_WITH_GROUPS = '/contacts?_embed=groups'
  const GROUPS_WITH_CONTACTS = '/groups?_embed=contacts'
  const CONTACT_WITH_GROUPS = '/contacts/1?_embed=groups'
  const GROUP_WITH_CONTACTS = '/groups/1?_embed=contacts'


  const arr: Test[] = [
    // Static
    { method: 'GET', url: '/', statusCode: 200 },
    { method: 'GET', url: '/test.html', statusCode: 200 },
    { method: 'GET', url: `/${file}`, statusCode: 200 },

    // CORS
    { method: 'OPTIONS', url: POSTS, statusCode: 204 },

    // API
    { method: 'GET', url: POSTS, statusCode: 200 },
    { method: 'GET', url: POSTS_WITH_COMMENTS, statusCode: 200 },
    { method: 'GET', url: POST_1, statusCode: 200 },
    { method: 'GET', url: POST_NOT_FOUND, statusCode: 404 },
    { method: 'GET', url: POST_WITH_COMMENTS, statusCode: 200 },
    { method: 'GET', url: COMMENTS, statusCode: 200 },
    { method: 'GET', url: POST_COMMENTS, statusCode: 200 },
    { method: 'GET', url: OBJECT, statusCode: 200 },
    { method: 'GET', url: OBJECT_1, statusCode: 404 },
    { method: 'GET', url: NOT_FOUND, statusCode: 404 },
    { method: 'GET', url: CONTACTS, statusCode: 200},
    { method: 'GET', url: GROUPS, statusCode: 200},
    { method: 'GET', url: CONTACTS_WITH_GROUPS, statusCode: 200},
    { method: 'GET', url: GROUPS_WITH_CONTACTS, statusCode: 200},
    { method: 'GET', url: CONTACT_WITH_GROUPS, statusCode: 200},
    { method: 'GET', url: GROUP_WITH_CONTACTS, statusCode: 200},
  


    { method: 'POST', url: POSTS, body:{title:"post title"}, statusCode: 201 },
    { method: 'POST', url: POSTS, body:{}, statusCode: 400 },
    { method: 'POST', url: POSTS, statusCode: 400 },
    { method: 'POST', url: POST_1, body:{title:"post title"}, statusCode: 404 },
    { method: 'POST', url: POST_NOT_FOUND, body:{title:"post title"}, statusCode: 404 },
    { method: 'POST', url: OBJECT, body:{title:"post title"}, statusCode: 400 },
    { method: 'POST', url: OBJECT_1, body:{title:"post title"}, statusCode: 404 },
    { method: 'POST', url: NOT_FOUND, body:{title:"post title"}, statusCode: 404 },

    { method: 'PUT', url: POSTS, body:{title:"post title"}, statusCode: 404 },
    { method: 'PUT', url: POSTS, body:{}, statusCode: 400 },
    { method: 'PUT', url: POSTS, statusCode: 400 },
    { method: 'PUT', url: POST_1, body:{title:"post title"}, statusCode: 200 },
    { method: 'PUT', url: OBJECT, body:{title:"post title"}, statusCode: 200 },
    { method: 'PUT', url: OBJECT_1, body:{title:"post title"}, statusCode: 404 },
    { method: 'PUT', url: POST_NOT_FOUND, body:{title:"post title"}, statusCode: 404 },
    { method: 'PUT', url: NOT_FOUND, body:{title:"post title"}, statusCode: 404 },

    { method: 'PATCH', url: POSTS, body:{title:"post title"}, statusCode: 404 },
    { method: 'PATCH', url: POSTS, body:{}, statusCode: 400 },
    { method: 'PATCH', url: POSTS, statusCode: 400 },
    { method: 'PATCH', url: POST_1, body:{title:"post title"}, statusCode: 200 },
    { method: 'PATCH', url: OBJECT, body:{title:"post title"}, statusCode: 200 },
    { method: 'PATCH', url: OBJECT_1, body:{title:"post title"}, statusCode: 404 },
    { method: 'PATCH', url: POST_NOT_FOUND, body:{title:"post title"}, statusCode: 404 },
    { method: 'PATCH', url: NOT_FOUND, body:{title:"post title"}, statusCode: 404 },

    { method: 'DELETE', url: POSTS, statusCode: 404 },
    { method: 'DELETE', url: POST_1, statusCode: 200 },
    { method: 'DELETE', url: OBJECT, statusCode: 200 },
    { method: 'DELETE', url: OBJECT_1, statusCode: 404 },
    { method: 'DELETE', url: POST_NOT_FOUND, statusCode: 404 },
    { method: 'DELETE', url: NOT_FOUND, statusCode: 404 },
  ]

  for (const tc of arr) {
    await t.test(`${tc.method} ${tc.url}`, async () => {
      let response:Response
      if(tc.method==="GET"){
        response = await fetch(`http://localhost:${port}${tc.url}`, {
          method: tc.method,
        })        
      }else{
        response = await fetch(`http://localhost:${port}${tc.url}`, {
          method: tc.method,
          headers:{'Content-type':"application/json"},
          body: JSON.stringify(tc.body)
        })       
      }      
      assert.equal(
        response.status,
        tc.statusCode,
        `${response.status} !== ${tc.statusCode} ${tc.method} ${tc.url} failed`,
      )
    })
  }
})
