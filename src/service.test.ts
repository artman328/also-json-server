import assert from 'node:assert/strict'
import test from 'node:test'

import { Low, Memory } from 'lowdb'

import { Data, Item, PaginatedItems, Service } from './service.js'

const defaultData = { posts: [], comments: [], object: {} }
const adapter = new Memory<Data>()
const db = new Low<Data>(adapter, defaultData)
const service = new Service(db)

const POSTS = 'posts'
const COMMENTS = 'comments'
const OBJECT = 'object'
const CONTACTS = 'contacts'
const GROUPS = 'groups'
const MEMBERS = 'members'
const CLUBS = 'clubs'

const UNKNOWN_RESOURCE = 'xxx'
const UNKNOWN_ID = 'xxx'

const post1 = {
  id: '1',
  title: 'a',
  views: 100,
  author: { name: 'foo' },
  tags: ['foo', 'bar'],
}
const post2 = {
  id: '2',
  title: 'b',
  views: 200,
  author: { name: 'bar' },
  tags: ['bar'],
}
const post3 = {
  id: '3',
  title: 'c',
  views: 300,
  author: { name: 'baz' },
  tags: ['foo'],
}
const comment1 = { id: '1', title: 'a', postId: '1' }
const items = 3

const contact1 = {
  id: '1',
  name: 'Bill',
  mobile: '(555)1234-5678'
}
const contact2 = {
  id: '2',
  name: 'Tracy',
  mobile: '(555)1234-1123'  
}
const contact3 = {
  id: '3',
  name: 'Tina',
  mobile: '(555)1234-9627'  
}
const contact4 = {
  id: '4',
  name: 'Ben',
  mobile: '(555)1234-2389'  
}
const contact5 = {
  id: '5',
  name: 'Jack',
  mobile: '(555)1234-6145'  
}

const group1 = {
  id: '1',
  name: 'Collegue'
}
const group2 = {
  id: '2',
  name: 'Friend'
}
const group3 = {
  id: '3',
  name: 'Family'
}

const member1 = {id: "1", name:"Jackie",clubs:["1","3"]}
const member2 = {id: "2", name:"Lexi",clubs:["2"]}
const member3 = {id: "3", name:"Michael",clubs:["2","3"]}
const member4 = {id: "4", name:"Billy",clubs:["1","2"]}
const member5 = {id: "5", name:"Jane",clubs:["1"]}

const member_1 = {id: "1", name:"Jackie"}
const member_2 = {id: "2", name:"Lexi"}
const member_3 = {id: "3", name:"Michael"}
const member_4 = {id: "4", name:"Billy"}
const member_5 = {id: "5", name:"Jane"}


const club1 = {id: "1", name:"Tennis"}
const club2 = {id: "2", name: "Swiming"}
const club3 = {id: "3", name: "Yuga"}

const obj = {
  f1: 'foo',
}




function reset() {
  db.data = structuredClone({
    posts: [post1, post2, post3],
    comments: [comment1],
    contacts: [contact1,contact2,contact3,contact4,contact5],
    groups: [group1,group2,group3],
    contacts_groups:[
      {id:"1",contactId:"1",groupId:"1"},
      {id:"1",contactId:"1",groupId:"2"},
      {id:"1",contactId:"2",groupId:"2"},
      {id:"1",contactId:"4",groupId:"1"},
      {id:"1",contactId:"5",groupId:"2"},
    ],
    members: [
      member1,
      member2,
      member3,
      member4,
      member5   
    ],
    clubs: [
      club1,
      club2,
      club3
    ],
    object: obj,
  })
}

await test('constructor', () => {
  const defaultData = { posts: [{ id: '1' }, {}], object: {} } satisfies Data
  const db = new Low<Data>(adapter, defaultData)
  new Service(db)
  if (Array.isArray(db.data['posts'])) {
    const id0 = db.data['posts']?.at(0)?.['id']
    const id1 = db.data['posts']?.at(1)?.['id']
    assert.ok(
      typeof id1 === 'string' && id1.length > 0,
      `id should be a non empty string but was: ${String(id1)}`,
    )
    assert.ok(
      typeof id0 === 'string' && id0 === '1',
      `id should not change if already set but was: ${String(id0)}`,
    )
  }
})

await test('findById', () => {
  reset()
  if (!Array.isArray(db.data?.[POSTS]))
    throw new Error('posts should be an array')
  assert.deepEqual(service.findById(POSTS, '1', {}), db.data?.[POSTS]?.[0])
  assert.equal(service.findById(POSTS, UNKNOWN_ID, {}), undefined)
  assert.deepEqual(service.findById(POSTS, '1', { _embed: ['comments'] }), {
    ...post1,
    comments: [comment1],
  })
  assert.deepEqual(service.findById(COMMENTS, '1', { _embed: ['post'] }), {
    ...comment1,
    post: post1,
  })
  assert.equal(service.findById(UNKNOWN_RESOURCE, '1', {}), undefined)
})

await test('find', async (t) => {
  const arr: {
    data?: Data
    name: string
    params?: Parameters<Service["find"]>[1]
    res: Item | Item[] | PaginatedItems | undefined
    error?: Error
  }[] = [
      {
        name: POSTS,
        res: [post1, post2, post3],
      },
      {
        name: POSTS,
        params: { id: post1.id },
        res: [post1],
      },
      {
        name: POSTS,
        params: { id: UNKNOWN_ID },
        res: [],
      },
      {
        name: POSTS,
        params: { views: post1.views.toString() },
        res: [post1],
      },
      {
        name: POSTS,
        params: { 'author.name': post1.author.name },
        res: [post1],
      },
      {
        name: POSTS,
        params: { 'tags[0]': 'foo' },
        res: [post1, post3],
      },
      {
        name: POSTS,
        params: { id: UNKNOWN_ID, views: post1.views.toString() },
        res: [],
      },
      {
        name: POSTS,
        params: { views_ne: post1.views.toString() },
        res: [post2, post3],
      },
      {
        name: POSTS,
        params: { views_lt: (post1.views + 1).toString() },
        res: [post1],
      },
      {
        name: POSTS,
        params: { views_lt: post1.views.toString() },
        res: [],
      },
      {
        name: POSTS,
        params: { views_lte: post1.views.toString() },
        res: [post1],
      },
      {
        name: POSTS,
        params: { views_gt: post1.views.toString() },
        res: [post2, post3],
      },
      {
        name: POSTS,
        params: { views_gt: (post1.views - 1).toString() },
        res: [post1, post2, post3],
      },
      {
        name: POSTS,
        params: { views_gte: post1.views.toString() },
        res: [post1, post2, post3],
      },
      {
        data: { posts: [post3, post1, post2] },
        name: POSTS,
        params: { _sort: 'views' },
        res: [post1, post2, post3],
      },
      {
        data: { posts: [post3, post1, post2] },
        name: POSTS,
        params: { _sort: '-views' },
        res: [post3, post2, post1],
      },
      {
        data: { posts: [post3, post1, post2] },
        name: POSTS,
        params: { _sort: '-views,id' },
        res: [post3, post2, post1],
      },

      {
        name: POSTS,
        params: { _start: 0, _end: 2 },
        res: [post1, post2],
      },
      {
        name: POSTS,
        params: { _start: 1, _end: 3 },
        res: [post2, post3],
      },
      {
        name: POSTS,
        params: { _start: 0, _limit: 2 },
        res: [post1, post2],
      },
      {
        name: POSTS,
        params: { _start: 1, _limit: 2 },
        res: [post2, post3],
      },
      {
        name: POSTS,
        params: { _page: 1, _per_page: 2 },
        res: {
          code: 200,
          message: "Success",
          first: 1,
          last: 2,
          prev: null,
          next: 2,
          pages: 2,
          items,
          data: [post1, post2],
        },
      },
      {
        name: POSTS,
        params: { _page: 2, _per_page: 2 },
        res: {
          code: 200,
          message: "Success",
          first: 1,
          last: 2,
          prev: 1,
          next: null,
          pages: 2,
          items,
          data: [post3],
        },
      },
      {
        name: POSTS,
        params: { _page: 3, _per_page: 2 },
        res: {
          code: 200,
          message: "Success",
          first: 1,
          last: 2,
          prev: 1,
          next: null,
          pages: 2,
          items,
          data: [post3],
        },
      },
      {
        name: POSTS,
        params: { _page: 2, _per_page: 1 },
        res: {
          code: 200,
          message: "Success",
          first: 1,
          last: 3,
          prev: 1,
          next: 3,
          pages: 3,
          items,
          data: [post2],
        },
      },
      {
        name: POSTS,
        params: { _embed: ['comments'] },
        res: [
          { ...post1, comments: [comment1] },
          { ...post2, comments: [] },
          { ...post3, comments: [] },
        ],
      },
      {
        name: COMMENTS,
        params: { _embed: ['post'] },
        res: [{ ...comment1, post: post1 }],
      },
      {
        name: UNKNOWN_RESOURCE,
        res: undefined,
      },
      {
        name: OBJECT,
        res: obj,
      },
      {
        name: CONTACTS,
        params: {_embed: "groups"},
        res: [
          {...contact1,groups:[group1,group2]},
          {...contact2,groups:[group2]},
          {...contact3,groups:[]},
          {...contact4,groups:[group1]},
          {...contact5,groups:[group2]},
        ]
      },
      {
        name: GROUPS,
        params: {_embed: "contacts"},
        res: [
          {...group1,contacts:[contact1,contact4]},
          {...group2,contacts:[contact1,contact2,contact5]},
          {...group3,contacts:[]},
        ]
      },
      {
        name: MEMBERS,
        params: {_embed: 'clubs'},
        res:[
          {...member1,clubs:[club1,club3]},
          {...member2,clubs:[club2]},
          {...member3,clubs:[club2,club3]},
          {...member4,clubs:[club1,club2]},
          {...member5,clubs:[club1]},
        ]
      },
      {
        name: CLUBS,
        params: {_embed: 'members'},
        res:[
          {...club1,members:[member_1,member_4,member_5]},
          {...club2,members:[member_2,member_3,member_4]},
          {...club3,members:[member_1,member_3]},          
        ]
      }
    ]
  for (const tc of arr) {
    await t.test(`${tc.name} ${JSON.stringify(tc.params)}`, () => {
      if (tc.data) {
        db.data = tc.data
      } else {
        reset()
      }

      assert.deepEqual(service.find(tc.name, tc.params), tc.res)
    })
  }
})

await test('create', async () => {
  reset()
  const post = { title: 'new post' }
  const res = await service.create(POSTS, post)
  assert.equal(res?.['title'], post.title)
  assert.equal(typeof res?.['id'], 'string', 'id should be a string')

  assert.equal(await service.create(UNKNOWN_RESOURCE, post), undefined)
})

await test('update', async () => {
  reset()
  const obj = { f1: 'bar' }
  const res = await service.update(OBJECT, obj)
  assert.equal(res, obj)

  assert.equal(
    await service.update(UNKNOWN_RESOURCE, obj),
    undefined,
    'should ignore unknown resources',
  )
  assert.equal(
    await service.update(POSTS, {}),
    undefined,
    'should ignore arrays',
  )
})

await test('updateById', async () => {
  reset()
  const post = { id: 'xxx', title: 'updated post' }
  const res = await service.updateById(POSTS, post1.id, post)
  assert.equal(res?.['id'], post1.id, 'id should not change')
  assert.equal(res?.['title'], post.title)

  assert.equal(
    await service.updateById(UNKNOWN_RESOURCE, post1.id, post),
    undefined,
  )
  assert.equal(await service.updateById(POSTS, UNKNOWN_ID, post), undefined)
})

await test('patchById', async () => {
  reset()
  const post = { id: 'xxx', title: 'updated post' }
  const res = await service.patchById(POSTS, post1.id, post)
  assert.notEqual(res, undefined)
  assert.equal(res?.['id'], post1.id)
  assert.equal(res?.['title'], post.title)

  assert.equal(
    await service.patchById(UNKNOWN_RESOURCE, post1.id, post),
    undefined,
  )
  assert.equal(await service.patchById(POSTS, UNKNOWN_ID, post), undefined)
})

await test('destroy', async () => {
  reset()
  let prevLength = Number(db.data?.[POSTS]?.length) || 0
  await service.destroyById(POSTS, post1.id)
  assert.equal(db.data?.[POSTS]?.length, prevLength - 1)
  assert.deepEqual(db.data?.[COMMENTS], [{ ...comment1, postId: null }])

  reset()
  prevLength = db.data?.[POSTS]?.length || 0
  await service.destroyById(POSTS, post1.id, [COMMENTS])
  assert.equal(db.data[POSTS].length, prevLength - 1)
  assert.equal(db.data[COMMENTS].length, 0)

  assert.equal(await service.destroyById(UNKNOWN_RESOURCE, post1.id), undefined)
  assert.equal(await service.destroyById(POSTS, UNKNOWN_ID), undefined)

  // test destory one side (contatcs) of many-to-many rel will automatically 
  // remove the related records
  // from intermediate list
  reset()
  prevLength = Number(db.data?.[CONTACTS]?.length) || 0
  await service.destroyById(CONTACTS,contact1.id)
  assert.equal(db.data[CONTACTS].length, prevLength - 1)
  assert.equal((db.data['contacts_groups'] as Item[]).filter(e=>e.contactId===contact1.id).length,0)

  // test destory another side (groups) of many-to-many rel will automatically 
  // remove the related records
  // from intermediate list
  reset()
  prevLength = Number(db.data?.[GROUPS]?.length) || 0
  await service.destroyById(GROUPS,group1.id)
  assert.equal(db.data[GROUPS].length, prevLength - 1)
  assert.equal((db.data['contacts_groups'] as Item[]).filter(e=>e.groupId===group1.id).length,0)

  reset()
  prevLength = Number(db.data?.[MEMBERS]?.length) || 0
  await service.destroyById(MEMBERS,member1.id)
  assert.equal(db.data[MEMBERS].length, prevLength - 1)
  
  
  // test destory a many-to-many side will automatically remove the destoryed item id
  // from another side's id collection
  // members contains a property of clubs (list) to establish 
  // members to clubs' many-to-many rel.
  reset()
  prevLength = Number(db.data?.[CLUBS]?.length) || 0
  await service.destroyById(CLUBS,club1.id)
  assert.equal(db.data[CLUBS].length, prevLength - 1)
  let has_id = false;
  (db.data[MEMBERS] as Item[]).forEach(m=>{
    if((m['clubs'] as string[]).indexOf(club1.id)!==-1) has_id = true;
  })
  assert.equal(has_id,false)
})
