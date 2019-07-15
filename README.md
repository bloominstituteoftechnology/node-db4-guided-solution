# Web DB III Guided Project Solution

Guided project solution for **Web DB III** Module.

Starter code is here: [Web DB III Guided Project](https://github.com/LambdaSchool/webdb-iii-guided).

## Prerequisites

- [SQLite Studio](https://sqlitestudio.pl/index.rvt?act=download) installed.
- [This Query Tool Loaded in the browser](https://www.w3schools.com/Sql/tryit.asp?filename=trysql_select_top).

## Starter Code

The [Starter Code](https://github.com/LambdaSchool/webdb-iii-guided) for this project is configured to run the server by typing `yarn server` or `npm run server`. The server will restart automatically on changes.

## How to Use this Repository

- clone the [starter code](https://github.com/LambdaSchool/webapi-iii-guided).
- create a solution branch: `git checkout -b solution`.
- add this repository as a remote: `git remote add solution https://github.com/LambdaSchool/webapi-iii-guided-solution`
- pull from this repository's `master` branch into the `solution` branch in your local folder `git pull solution master:solution --force`.

A this point you should have a `master` branch pointing to the student's repository and a `solution` branch with the latest changes added to the solution repository.

When making changes to the `solution` branch, commit the changes and type `git push solution solution:master` to push them to this repository.

When making changes to the `master` branch, commit the changes and use `git push origin master` to push them to the student's repository.

## Introduce Module Challenge

Introduce the project for the afternoon. If they are done early, encourage them to study tomorrow's content and follow the tutorials on TK.

## Data Normalization

Review data normalization, redundancy, and anomalies in TK.

## Table Relationships

Review 1-to-1, 1-to-many, and many-to-many relationships in TK.

### You Do (Estimated 5 minutes)

Paste the following requirements into `notes.md`:

```
### Problem
A client has hired you to track zoo animals.
For each animal, you must track that their name, species,
and all zoos in which they have resided (including zoo name and address).

Determine the database tables necessary to track this information.
Label any relationships between table.
```

Possible answer:

```
### Solution
Tables: Zoos, Species, Animals

Zoos <=> Animals : Many to many
Species <=> Animals: 1 to many
```

Discuss why Zoos <=> Animals must be many to many, versus if the requirements had called for tracking the current location of each animal.

**wait for students to catch up, use a `yes/no` poll to let students tell you when they are done**

### Schema Design

Break down each the design of each table in `notes.md`

```
### Tables

Zoos:
- id
- zoo_name
- address
```

Mention that we could choose to create a seperate address table with a 1 to 1 relationship with zoos, but unless we had some specific reason to, that is an unnecessary step.

```
Species:
- id
- species_name

Animals:
- id
- animal_name
- species_id
```

There are many animals for one species. In a many-to-one relationship, the foreign key goes in the "many" table. Thus `species_id`, the foreign key, will link each animal to its species.

Finally, we will need to link animals and zoos. Explore why we cannot have a `zoo_id` in `animals` nor can we have a `animal_id` in `zoos`. Instead, we'll need an intermediary table

```
zoo_animals:
- zoo_id
- animal_id
```

The naming convention for link tables in table1_table2plural. Mention that this type of table does not actually require its own id. We'll see why later.

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
