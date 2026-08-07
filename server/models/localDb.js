const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Deep copy helper
function clone(obj) {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
}

// Helper to evaluate a mongoose-like query on an item
function matchesQuery(item, query) {
  if (!query) return true;
  
  for (const key in query) {
    const queryVal = query[key];
    
    // Support regex search
    if (queryVal instanceof RegExp) {
      if (!item[key] || !queryVal.test(item[key].toString())) {
        return false;
      }
      continue;
    }
    
    if (queryVal && typeof queryVal === 'object' && !(queryVal instanceof Date)) {
      // Handle regex passed as query object (e.g. { $regex: 'abc', $options: 'i' })
      if ('$regex' in queryVal) {
        const flags = queryVal.$options || '';
        const regex = new RegExp(queryVal.$regex, flags);
        if (!item[key] || !regex.test(item[key].toString())) {
          return false;
        }
        continue;
      }
      
      // Handle array contains or comparison
      if ('$in' in queryVal) {
        if (!Array.isArray(queryVal.$in) || !queryVal.$in.includes(item[key])) {
          return false;
        }
        continue;
      }
      
      if ('$gte' in queryVal) {
        if (!(item[key] >= queryVal.$gte)) return false;
        continue;
      }
      if ('$lte' in queryVal) {
        if (!(item[key] <= queryVal.$lte)) return false;
        continue;
      }
      if ('$gt' in queryVal) {
        if (!(item[key] > queryVal.$gt)) return false;
        continue;
      }
      if ('$lt' in queryVal) {
        if (!(item[key] < queryVal.$lt)) return false;
        continue;
      }
    }
    
    // Standard direct match
    if (item[key] !== queryVal) {
      return false;
    }
  }
  return true;
}

// Applies updates (supports $set, $inc, $push, or plain object updates)
function applyUpdate(item, update) {
  if (!update) return item;
  
  // Mongoose style update operators
  if (update.$set || update.$inc || update.$push || update.$pull) {
    if (update.$set) {
      for (const k in update.$set) {
        item[k] = update.$set[k];
      }
    }
    if (update.$inc) {
      for (const k in update.$inc) {
        item[k] = (item[k] || 0) + update.$inc[k];
      }
    }
    if (update.$push) {
      for (const k in update.$push) {
        if (!Array.isArray(item[k])) item[k] = [];
        // Handle $each
        if (update.$push[k] && update.$push[k].$each) {
          item[k].push(...update.$push[k].$each);
        } else {
          item[k].push(update.$push[k]);
        }
      }
    }
    if (update.$pull) {
      for (const k in update.$pull) {
        if (Array.isArray(item[k])) {
          item[k] = item[k].filter(v => v !== update.$pull[k]);
        }
      }
    }
  } else {
    // Direct merge for plain objects (excluding _id)
    for (const k in update) {
      if (k !== '_id') {
        item[k] = update[k];
      }
    }
  }
  return item;
}

class LocalQuery {
  constructor(resultsPromise) {
    this.promise = resultsPromise;
    this.sortObj = null;
    this.limitVal = null;
  }

  sort(sortObj) {
    this.sortObj = sortObj;
    return this;
  }

  limit(limitVal) {
    this.limitVal = limitVal;
    return this;
  }

  async exec() {
    let data = await this.promise;
    
    // Sort
    if (this.sortObj) {
      const keys = Object.keys(this.sortObj);
      data.sort((a, b) => {
        for (const key of keys) {
          const dir = this.sortObj[key];
          const valA = a[key];
          const valB = b[key];
          
          if (valA < valB) return dir === -1 ? 1 : -1;
          if (valA > valB) return dir === -1 ? -1 : 1;
        }
        return 0;
      });
    }

    // Limit
    if (this.limitVal !== null) {
      data = data.slice(0, this.limitVal);
    }

    return data;
  }

  // Thenable implementation to support await query
  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }
}

class LocalModel {
  constructor(modelName, defaultSchema = {}) {
    this.modelName = modelName;
    this.filePath = path.join(DATA_DIR, `${modelName}.json`);
    this.defaultSchema = defaultSchema;
  }

  _read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
        return [];
      }
      const raw = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(raw || '[]');
    } catch (e) {
      console.error(`Error reading database file: ${this.filePath}`, e);
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`Error writing database file: ${this.filePath}`, e);
    }
  }

  async find(query = {}) {
    const list = this._read();
    const filtered = list.filter(item => matchesQuery(item, query)).map(item => this._wrapInstance(item));
    return new LocalQuery(Promise.resolve(filtered));
  }

  async findOne(query = {}) {
    const list = this._read();
    const found = list.find(item => matchesQuery(item, query));
    return found ? this._wrapInstance(found) : null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(docData) {
    const list = this._read();
    const newDoc = {
      _id: generateId(),
      ...this._applyDefaults(),
      ...clone(docData),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.push(newDoc);
    this._write(list);
    return this._wrapInstance(newDoc);
  }

  async insertMany(docsArray) {
    const list = this._read();
    const createdDocs = docsArray.map(doc => ({
      _id: generateId(),
      ...this._applyDefaults(),
      ...clone(doc),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    list.push(...createdDocs);
    this._write(list);
    return createdDocs.map(doc => this._wrapInstance(doc));
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    return this.findOneAndUpdate({ _id: id }, update, options);
  }

  async findOneAndUpdate(query, update, options = { new: true }) {
    const list = this._read();
    const index = list.findIndex(item => matchesQuery(item, query));
    if (index === -1) {
      if (options.upsert) {
        // Handle simple upsert
        const created = await this.create(applyUpdate({ _id: generateId() }, update));
        return created;
      }
      return null;
    }
    
    let updatedItem = list[index];
    updatedItem = applyUpdate(updatedItem, update);
    updatedItem.updatedAt = new Date().toISOString();
    
    list[index] = updatedItem;
    this._write(list);
    return this._wrapInstance(updatedItem);
  }

  async updateOne(query, update) {
    const res = await this.findOneAndUpdate(query, update);
    return { modifiedCount: res ? 1 : 0 };
  }

  async deleteOne(query) {
    const list = this._read();
    const index = list.findIndex(item => matchesQuery(item, query));
    if (index === -1) return { deletedCount: 0 };
    list.splice(index, 1);
    this._write(list);
    return { deletedCount: 1 };
  }

  async deleteMany(query = {}) {
    const list = this._read();
    const initialLen = list.length;
    const remaining = list.filter(item => !matchesQuery(item, query));
    this._write(remaining);
    return { deletedCount: initialLen - remaining.length };
  }

  async countDocuments(query = {}) {
    const list = this._read();
    return list.filter(item => matchesQuery(item, query)).length;
  }

  _applyDefaults() {
    const defaults = {};
    for (const key in this.defaultSchema) {
      if (this.defaultSchema[key].default !== undefined) {
        defaults[key] = typeof this.defaultSchema[key].default === 'function'
          ? this.defaultSchema[key].default()
          : this.defaultSchema[key].default;
      }
    }
    return defaults;
  }

  _wrapInstance(item) {
    const modelInstance = clone(item);
    const self = this;
    
    // Add mongoose-like instance methods
    Object.defineProperty(modelInstance, 'save', {
      value: async function() {
        const list = self._read();
        const idx = list.findIndex(i => i._id === this._id);
        this.updatedAt = new Date().toISOString();
        const cleanData = { ...this };
        
        if (idx !== -1) {
          list[idx] = cleanData;
        } else {
          list.push(cleanData);
        }
        self._write(list);
        return self._wrapInstance(cleanData);
      },
      enumerable: false
    });
    
    return modelInstance;
  }
}

module.exports = { LocalModel };
