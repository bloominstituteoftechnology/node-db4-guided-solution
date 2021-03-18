# Node DB 4 Guided Project Solution

Guided project solution for **Node DB 4** Module.

Starter code is here: [Node DB 4 Guided Project](https://github.com/LambdaSchool/node-db4-guided).

## Prerequisites

- [SQLite Studio](https://sqlitestudio.pl/index.rvt?act=download) installed.
- [This Query Tool Loaded in the browser](https://www.w3schools.com/Sql/tryit.asp?filename=trysql_select_top).

## Starter Code

The [Starter Code](https://github.com/LambdaSchool/node-db4-guided) for this project is configured to run the server by typing `npm run server`. The server will restart automatically on changes.

## Introduce Module Challenge

Introduce the project for the afternoon. If they are done early, they can use the extra time to continue to practice the sprint's content and build fron end for their APIs.

## Data Normalization

Review data normalization, redundancy, and anomalies in Canvas. Explain that we'll take a pragmatic approach to data normalization. We'll follow a process and a set of _mantras_ that will produce a _normallized enough_ model for most use cases.

## Table Relationships

Review 1-to-1, 1-to-many, and many-to-many relationships in Canvas. Don't spend too much time here, we'll see them in action when we get to the Data Modeling section below.

**wait for students to catch up, use a `yes/no` poll to let students tell you when they are done**

## Schema Design

Introduce the requirements listed in `notes.md`.

### Requirements

A client has hired you to build an API for managing `zoos` and the `animals` kept at each `zoo`. The API will be use for `zoos` in the _United States of America_, no need to worry about addresses in other countries.

For the `zoos` the client wants to record:

- name.
- address.

For the `animals` the client wants to record:

- name.
- species.
- list of all the zoos where they have resided.

Determine the database tables necessary to track this information.
Label any relationships between table.

Possible solution:

<img src="images/zoosmodel.png">

Walk through the steps necessary to arrive at the solution depicted above.

Mention that we could choose to create a seperate address table with a 1 to 1 relationship with zoos, but unless we had some specific reason to, that is an unnecessary step.

There are many animals for one species. In a many-to-one relationship, the foreign key goes in the "many" table. Thus `species_id`, the foreign key, will link each animal to its species.

Finally, we will need to link animals and zoos. Explore why we cannot have a `zoo_id` in `animals` nor can we have a `animal_id` in `zoos`. Instead, we'll need an intermediary table

The naming convention for link tables in table1_table2plural. Mention that this type of table does not actually require its own id, but we may opt to add one. We'll see why later.

### A good data model

- captures ALL the information the system needs.
- captures ONLY the information the system needs <--- Abstraction.
- reflects reality (from the point of view of the system).
- is flexible, can evolve with the system.
- guarantees data integrity, without sacrificing performance. <-- using constraints.
- is driven by the way we access the data.

### Components

- entities (nouns: zoo, animal, species), like a resource --> tables.
- properties --> columns or fields.
- relationships --> Foreign Keys

### Workflow

- identify entities.
- identify properties.
- identify relationships.

### Relationships

- one to one: rare.
- one to many: this is it!
- many to many: a trick!!

### Mantras

- every table must have a `Primary Key`.
- work on **two or three entities at at time**.
- _one to many_ relationship requires a `Foreign Key`.
- the `Foreign Key` goes on the **Many** side.
- _many to many_ requires a **third table**.
- the third table could include other columns.
  **wait for students to catch up, use a `yes/no` poll to let students tell you when they are done**

**Take a break if it's a good time**

## Multi Table Schemas in Knex

We now want to build these tables using a knex migration. Confirm that our `knexfile` is setup properly. Then run:

`knex migrate:make create-tables`

We can create all tables in the same knex file. Start with `zoos` and `species`

```js
exports.up = function(knex, Promise) {
  return (
    knex.schema
      .createTable('zoos', tbl => {
        tbl.increments();
        // two different zoos may have the same name
        tbl.string('zoo_name', 128).notNullable();
        tbl
          .string('address', 128)
          .notNullable()
          .unique();
      })
      // we can chain together createTable
      .createTable('species', tbl => {
        tbl.increments();
        tbl.string('species_name', 128);
      })
  );
};
```

Now let's add a table with a foreign key

```js
.createTable('species', tbl => {
  tbl.increments();
  tbl.string('species_name', 128);
})
.createTable('animals', tbl => {
  tbl.increments();
  tbl.string('animal_name', 128);
  tbl.integer('species_id')
    // forces integer to be positive
    .unsigned()
    .notNullable()
    .references('id')
    // this table must exist already
    .inTable('species')
})
```

Finally, let's add the intermediary table for our many-to-many relationship

```js
.createTable('zoo_animals', tbl => {
  tbl.integer('zoo_id')
    .unsigned()
    .notNullable()
    .references('id')
    // this table must exist already
    .inTable('zoos')
  tbl.integer('animal_id')
    .unsigned()
    .notNullable()
    .references('id')
    // this table must exist already
    .inTable('animals')
  // the combination of the two keys becomes our primary key
  // will enforce unique combinations of ids
  tbl.primary(['zoo_id', 'animal_id']);
});
```

Explain that two columns can be a primary key, as long as the combinations are unique. This is a common practice in an intermediary table.

**wait for students to catch up, use a `yes/no` poll to let students tell you when they are done**

### You do (Estimated 3 minutes)

Write a `down` function.

Possible solution:

```js
exports.down = function(knex, Promise) {
  // drop in the opposite order
  return knex.schema
    .dropTableIfExists('zoo_animals')
    .dropTableIfExists('animals')
    .dropTableIfExists('species')
    .dropTableIfExists('zoos');
};
```

Note that tables must be dropped in reverse order.

Run `knex migrate:latest` to assure there are no typos.

### Seed Data

The seeds for this data already exist. Look through the seed files. Note how the foreign keys match existing data. Run `knex seed:run`.

Start the server with `npm run server`. Hit the `api/animals` and `/api/species` to confirm that the data has been entered.

Note that the truncate portion of the seeds are missing. That's because when foreign keys are involve, it's not always so simple to drop an entire table. We can instead use a library called `knex-cleaner`. Show them the `00-cleanup` seed, which will remove all data before seeding.

### Foreign Key Restrictions

Let's test that our foreign key restriction is working properly. Comment in the entry in the `03-animals` seed file with an invalid `species_id`:

```js
{ animal_name: "Bellatrix", species_id: 19 }
```

When we run `knex seed:run`, there is no error. And if we hit `api/animals` we can see that bad data has gotten in. There's something extra we need in our `knexfile` to enforce foreign keys

```js
development: {
  client: 'sqlite3',
  useNullAsDefault: true, // needed for sqlite
  connection: {
    filename: './data/zoos.db3',
  },
  migrations: {
    directory: './data/migrations'
  },
  seeds: {
    directory: './data/seeds'
  },
  // add the following
  pool: {
    afterCreate: (conn, done) => {
      // runs after a connection is made to the sqlite engine
      conn.run('PRAGMA foreign_keys = ON', done); // turn on FK enforcement
    },
  },
},
```

Try `knex seed:run` again and see it now errors out. The restriction is properly being enforced. Comment out the bad data point in seeds.

### Cascading (Optional - 10 minutes remaining)

Example that another issue to consider with foreign keys is updating and remove data. Try removing `raccoon` from the `species` table by hitting `DELETE /api/species/8` in `postman`.

This is not allowed, because `raccoon` is linked to the animal `rocky` which is in turn linked to an entry in the `zoo_animals` table. Sometimes we want this behavior, but other times we might want a deleted record to cascade. In other words, delete all related records.

Rollback the schema with `knex migrate:rollback`. Then add the following:

```js
.createTable('animals', tbl => {
  tbl.increments();
  tbl.string('animal_name', 128);
  // must come after species table is created
  tbl.integer('species_id')
    .unsigned()
    .notNullable()
    .references('id')
    .inTable('species')
    // add CASCADE HERE
    .onDelete('CASCADE')
    .onUpdate('CASCADE');
})
.createTable('zoo_animals', tbl => {
  tbl.integer('zoo_id')
    .unsigned()
    .notNullable()
    .references('id')
    .inTable('zoos')
    // AND HERE
    .onDelete('CASCADE')
    .onUpdate('CASCADE');
  tbl.integer('animal_id')
    .unsigned()
    .notNullable()
    .references('id')
    .inTable('animals')
    // AND HERE
    .onDelete('CASCADE')
    .onUpdate('CASCADE');
  // the combination of the two keys becomes our primary key
  // will enforce unique combinations of ids
  tbl.primary(['zoo_id', 'animal_id']);
});
```

Re-run the schema and seeds with

```
knex migrate:latest
knex seed:run
```

Now once again try hitting `DELETE /api/species/8` in `postman`. It no longer fails. If we `GET /api/species` and `GET api/animals` we can see both the `raccoon` and `rocky` data points have been deleted.