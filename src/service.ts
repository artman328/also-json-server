import { randomBytes } from "node:crypto";

import { getProperty } from "dot-prop";
import inflection from "inflection";
import { Low } from "lowdb";
import sortOn from "sort-on";

export type Item = Record<string, unknown>;

export type Data = Record<string, Item[] | Item>;

export function isItem(obj: unknown): obj is Item {
  return typeof obj === "object" && obj !== null;
}

export function isData(obj: unknown): obj is Record<string, Item[]> {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const data = obj as Record<string, unknown>;
  return Object.values(data).every(
    (value) => Array.isArray(value) && value.every(isItem)
  );
}

enum Condition {
  lt = "lt",
  lte = "lte",
  gt = "gt",
  gte = "gte",
  ne = "ne",
  default = "",
}

function isCondition(value: string): value is Condition {
  return Object.values<string>(Condition).includes(value);
}

export type PaginatedItems = {
  first: number;
  prev: number | null;
  next: number | null;
  last: number;
  pages: number;
  items: number;
  data: Item[];
};

function ensureArray(arg: string | string[] = []): string[] {
  return Array.isArray(arg) ? arg : [arg];
}

// function embed(db: Low<Data>, name: string, item: Item, related: string): Item {
//   if (inflection.singularize(related) === related) {
//     const relatedData = db.data[inflection.pluralize(related)] as Item[]
//     if (!relatedData) {
//       return item
//     }
//     const foreignKey = `${related}Id`
//     const relatedItem = relatedData.find((relatedItem: Item) => {
//       return relatedItem['id'] === item[foreignKey]
//     })
//     return { ...item, [related]: relatedItem }
//   }
//   const relatedData: Item[] = db.data[related] as Item[]

//   if (!relatedData) {
//     return item
//   }

//   const foreignKey = `${inflection.singularize(name)}Id`
//   const relatedItems = relatedData.filter(
//     (relatedItem: Item) => relatedItem[foreignKey] === item['id'],
//   )

//   return { ...item, [related]: relatedItems }
// }
//clubs?_embed=members
//  name         related [clubs]

function embed(db: Low<Data>, name: string, item: Item, related: string): Item {
  if (inflection.singularize(related) === related) {
    const relatedData = db.data[inflection.pluralize(related)] as Item[];
    if (!relatedData) {
      return item;
    }
    const foreignKey = `${related}Id`;
    const relatedItem = relatedData.find((relatedItem: Item) => {
      return relatedItem["id"] === item[foreignKey];
    });
    return { ...item, [related]: relatedItem };
  }
  // many-2-many: Try to get ${related} property in ${name}
  const relatedProperty = `${related}`;
  if (item[relatedProperty] && Array.isArray(item[relatedProperty])) {
    // If the ${name} object has a property named ${related}, which should be an array of IDs
    const relatedIds = new Set(item[relatedProperty] as string[]);
    const relatedItems = (db.data[related] as Item[]).filter(
      (relatedItem: Item) => relatedIds.has(relatedItem["id"] as string)
    );
    return { ...item, [related]: relatedItems };
  }
  // many-2-many: Try to find ${name} property in ${related}
  const _relatedItems = db.data[related] as Item[];
  if (_relatedItems) {
    let relatedItems: (Item | undefined)[] = [];
    _relatedItems.forEach((e) => {
      if (
        e[name] &&
        (e[name] as Array<string>).includes(item["id"] as string)
      ) {
        relatedItems.push(e);
      }
    });
    if (relatedItems.length > 0) {
      let _items = structuredClone(relatedItems);
      _items.forEach((e) => {
        if (e) delete e[name];
      });
      return { ...item, [related]: _items };
    }
  }

  // Check if there is an intermediate table named like primary_related
  const intermediateTable1 = `${name}_${related}`;
  const intermediateTable2 = `${related}_${name}`;

  let intermediateData = db.data[intermediateTable1] as Item[];
  if (!intermediateData) {
    intermediateData = db.data[intermediateTable2] as Item[];
  }
  if (intermediateData) {
    // Get related items through the intermediate table
    const relatedItems = intermediateData
      .filter(
        (intermediateItem: Item) =>
          intermediateItem[`${inflection.singularize(name)}Id`] === item["id"]
      )
      .map((intermediateItem: Item) => {
        // Find related item using related ID
        const relatedItem = (db.data[related] as Item[]).find(
          (relatedItem: Item) =>
            relatedItem["id"] ===
            intermediateItem[`${inflection.singularize(related)}Id`]
        );
        return relatedItem;
      });
    return { ...item, [related]: relatedItems };
  }

  // If there is no intermediate table, proceed with original logic
  const relatedData = db.data[related] as Item[];
  if (!relatedData) {
    return item;
  }

  const foreignKey = `${inflection.singularize(name)}Id`;
  const relatedItems = relatedData.filter(
    (relatedItem: Item) => relatedItem[foreignKey] === item["id"]
  );

  return { ...item, [related]: relatedItems };
}

function nullifyForeignKey(db: Low<Data>, name: string, id: string) {
  const foreignKey = `${inflection.singularize(name)}Id`;

  Object.entries(db.data).forEach(([key, items]) => {
    // Skip
    if (key === name) return;

    // Nullify
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (item[foreignKey] === id) {
          item[foreignKey] = null;
        }
      });
    }
  });
}

function deleteManyToManyRel(db: Low<Data>, name: string, id: string) {
  Object.entries(db.data).forEach(([key, items]) => {
    // through intermediate list
    if (key.indexOf(`_${name}`) !== -1 || key.indexOf(`${name}_`) !== -1) {
      if (Array.isArray(items)) {
        db.data[key] = items.filter(
          (item) => item[`${inflection.singularize(name)}Id`] !== null
        );
      }
    }
    // through embeded list
    else {
      if (Array.isArray(items)) {
        let _ids: string[] = [];
        items.forEach((e: Item) => {
          if (e[name] && Array.isArray(e[name])) {
            _ids = (e[name] as Array<string>).filter((_id) => _id !== id);
            e[name] = _ids;
          }
        });
      }
    }
  });
}

function deleteDependents(db: Low<Data>, name: string, dependents: string[]) {
  const foreignKey = `${inflection.singularize(name)}Id`;

  Object.entries(db.data).forEach(([key, items]) => {
    // Skip
    if (key === name || !dependents.includes(key)) return;

    // Delete if foreign key is null
    if (Array.isArray(items)) {
      db.data[key] = items.filter((item) => item[foreignKey] !== null);
    }
  });
  // todo: delete records from intermediate list (many-2-many)
}

function randomId(): string {
  return randomBytes(2).toString("hex");
}

function fixItemsIds(items: Item[]) {
  items.forEach((item) => {
    if (typeof item["id"] === "number") {
      item["id"] = item["id"].toString();
    }
    if (item["id"] === undefined) {
      item["id"] = randomId();
    }
  });
}

// Ensure all items have an id
function fixAllItemsIds(data: Data) {
  Object.values(data).forEach((value) => {
    if (Array.isArray(value)) {
      fixItemsIds(value);
    }
  });
}

export class Service {
  #db: Low<Data>;

  user: Item | undefined = undefined;
  return_object: boolean = false;

  constructor(db: Low<Data>) {
    fixAllItemsIds(db.data);
    this.#db = db;
  }

  #get(name: string): Item[] | Item | undefined {
    return this.#db.data[name];
  }

  has(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.#db?.data, name);
  }

  login(username: string, password: string): Record<string, any> {
    let result = false;
    let user: Item = {};
    const users = this.#db.data["users"] as Item[];
    if (users) {
      const q_users = users.filter(
        (u) => u["username"] == username && u["password"] == password
      );
      console.log("Q_Users:", q_users);
      if (q_users.length > 0) {
        result = true;
        user = q_users[0] as Item;
      }
    }
    return {
      result,
      user,
    };
  }

  checkToken(token: string): Record<string, any> {
    let result = false;
    let user: Item = {};
    const users = this.#db.data["users"] as Item[];
    console.log("Users:", users);

    if (users) {
      const q_users = users.filter((u) => u["token"] === token);
      // console.log("Q_Users:",q_users);
      if (q_users.length > 0) {
        result = true;
        user = q_users[0] as Item;
      }
    }
    return {
      result,
      user,
    };
  }

  findById(
    name: string,
    id: string,
    query: { _embed?: string[] | string }
  ): Item | undefined {
    const value = this.#get(name);

    if (Array.isArray(value)) {
      let item = value.find((item) => item["id"] === id);
      ensureArray(query._embed).forEach((related) => {
        if (item !== undefined) item = embed(this.#db, name, item, related);
      });
      if (item)
        return this.return_object
          ? { code: 200, message: "Found", data: item }
          : item;
    }

    return this.return_object
      ? { code: 404, message: "Not found", data: null }
      : undefined;
  }

  find(
    name: string,
    query: {
      [key: string]: unknown;
      _embed?: string | string[];
      _sort?: string;
      _start?: number;
      _end?: number;
      _limit?: number;
      _page?: number;
      _per_page?: number;
    } = {}
  ): Item[] | PaginatedItems | Item | undefined {
    let items = this.#get(name);

    if (!Array.isArray(items)) {
      return items;
    }

    if(items.length===0 || items===undefined){
      return items;
    }

    // Include
    ensureArray(query._embed).forEach((related) => {
      if (items !== undefined && Array.isArray(items)) {
        items = items.map((item) => embed(this.#db, name, item, related));
      }
    });

    // Return list if no query params
    if (Object.keys(query).length === 0) {
      return items;
    }


    // const foreignKey = (Object.keys(query).filter(k=>k.endsWith("Id"))||[])[0]
    // if(foreignKey){
    //   if(getProperty((items as Item[]||[])[0],foreignKey)===undefined){
    //     const _name = inflection.pluralize(foreignKey.replace("Id",""))
    //     console.log(_name,query[foreignKey],items,(items as Item[])[0]);
    //     if(getProperty((items as Item[])[0],_name)!==undefined){
    //       return (items as Item[])?.filter(item=>
    //         (item[_name] as Array<string>).indexOf(query[foreignKey] as string)!==-1
    //       )
    //     }             
    //   }
    // }
    
  

    // Convert query params to conditions
    const conds: Record<string, [Condition, string | string[]]> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || typeof value !== "string") {
        continue;
      }
      const re = /_(lt|lte|gt|gte|ne)$/;
      const reArr = re.exec(key);
      const op = reArr?.at(1);
      if (op && isCondition(op)) {
        const field = key.replace(re, "");
        conds[field] = [op, value];
        continue;
      }
      if (
        [
          "_embed",
          "_sort",
          "_start",
          "_end",
          "_limit",
          "_page",
          "_per_page",
        ].includes(key)
      ) {
        continue;
      }
      conds[key] = [Condition.default, value];
    }

    // Loop through conditions and filter items
    const res = items.filter((item: Item) => {
      for (const [key, [op, paramValue]] of Object.entries(conds)) {
        if (paramValue && !Array.isArray(paramValue)) {
          // https://github.com/sindresorhus/dot-prop/issues/95
          const itemValue: unknown = getProperty(item, key);
          switch (op) {
            // item_gt=value
            case Condition.gt: {
              if (
                !(
                  typeof itemValue === "number" &&
                  itemValue > parseInt(paramValue)
                )
              ) {
                return false;
              }
              break;
            }
            // item_gte=value
            case Condition.gte: {
              if (
                !(
                  typeof itemValue === "number" &&
                  itemValue >= parseInt(paramValue)
                )
              ) {
                return false;
              }
              break;
            }
            // item_lt=value
            case Condition.lt: {
              if (
                !(
                  typeof itemValue === "number" &&
                  itemValue < parseInt(paramValue)
                )
              ) {
                return false;
              }
              break;
            }
            // item_lte=value
            case Condition.lte: {
              if (
                !(
                  typeof itemValue === "number" &&
                  itemValue <= parseInt(paramValue)
                )
              ) {
                return false;
              }
              break;
            }
            // item_ne=value
            case Condition.ne: {
              if (!(itemValue != paramValue)) return false;
              break;
            }
            // item=value
            case Condition.default: {
              if (!(itemValue == paramValue)) return false;
            }
          }
        }
      }
      return true;
    });

    // Sort
    const sort = query._sort || "";
    const sorted = sortOn(res, sort.split(","));

    // Slice
    const start = query._start;
    const end = query._end;
    const limit = query._limit;
    if (start !== undefined) {
      if (end !== undefined) {
        return sorted.slice(start, end);
      }
      return sorted.slice(start, start + (limit || 0));
    }
    if (limit !== undefined) {
      return this.return_object
        ? { code: 200, message: "Success", data: sorted.slice(0, limit) }
        : sorted.slice(0, limit);
    }

    // Paginate
    let page = query._page;
    const perPage = query._per_page || 10;
    if (page) {
      const items = sorted.length;
      const pages = Math.ceil(items / perPage);

      // Ensure page is within the valid range
      page = Math.max(1, Math.min(page, pages));

      const first = 1;
      const prev = page > 1 ? page - 1 : null;
      const next = page < pages ? page + 1 : null;
      const last = pages;

      const start = (page - 1) * perPage;
      const end = start + perPage;
      const data = sorted.slice(start, end);

      return {
        code: 200,
        message: "Success",
        first,
        prev,
        next,
        last,
        pages,
        items,
        data,
      };
    }

    return this.return_object
      ? { code: 200, message: "Success", data: sorted.slice(start, end) }
      : sorted.slice(start, end);
  }

  async create(
    name: string,
    data: Omit<Item, "id"> = {}
  ): Promise<Item | undefined> {
    const items = this.#get(name);
    if (items === undefined || !Array.isArray(items)) return;

    const item = { id: randomId(), ...data };
    items.push(item);

    await this.#db.write();
    return this.return_object
      ? { code: 201, message: "Record created.", data: item }
      : item;
  }

  async #updateOrPatch(
    name: string,
    body: Item = {},
    isPatch: boolean
  ): Promise<Item | undefined> {
    const item = this.#get(name);
    // only for an object, not for a list
    if (item === undefined || Array.isArray(item)) return;

    const nextItem = (this.#db.data[name] = isPatch ? { item, ...body } : body);

    await this.#db.write();
    return this.return_object
      ? { code: 200, message: "Update success", data: nextItem }
      : nextItem;
  }

  async #updateOrPatchById(
    name: string,
    id: string,
    body: Item = {},
    isPatch: boolean
  ): Promise<Item | undefined> {
    const items = this.#get(name);
    if (items === undefined || !Array.isArray(items)) return;

    const item = items.find((item) => item["id"] === id);
    if (!item) return;

    // Object.entries(body).forEach((k,v)=>{
    //   if(Array.isArray(v)){
    //     Object.entries(this.#db.data).forEach((name,_items)=>{
    //       if(name===k){

    //       }
    //     })
    //   }
    // })

    const nextItem = isPatch ? { ...item, ...body, id } : { ...body, id };
    const index = items.indexOf(item);
    items.splice(index, 1, nextItem);

    await this.#db.write();
    return this.return_object
      ? { code: 200, message: "Update success", data: nextItem }
      : nextItem;
  }

  async update(name: string, body: Item = {}): Promise<Item | undefined> {
    return this.#updateOrPatch(name, body, false);
  }

  async patch(name: string, body: Item = {}): Promise<Item | undefined> {
    return this.#updateOrPatch(name, body, true);
  }

  async updateById(
    name: string,
    id: string,
    body: Item = {}
  ): Promise<Item | undefined> {
    return this.#updateOrPatchById(name, id, body, false);
  }

  async patchById(
    name: string,
    id: string,
    body: Item = {}
  ): Promise<Item | undefined> {
    return this.#updateOrPatchById(name, id, body, true);
  }

  async destroyById(
    name: string,
    id: string,
    dependent?: string | string[]
  ): Promise<Item | undefined> {
    const items = this.#get(name);
    if (items === undefined || !Array.isArray(items)) return;

    const item = items.find((item) => item["id"] === id);
    if (item === undefined) return;
    const index = items.indexOf(item);
    items.splice(index, 1)[0];

    // for one-to-many
    nullifyForeignKey(this.#db, name, id);
    const dependents = ensureArray(dependent);
    deleteDependents(this.#db, name, dependents);

    // for many-to-many
    deleteManyToManyRel(this.#db, name, id);

    await this.#db.write();
    return this.return_object
      ? { code: 200, message: "Delete success", data: item }
      : item;
  }
}
