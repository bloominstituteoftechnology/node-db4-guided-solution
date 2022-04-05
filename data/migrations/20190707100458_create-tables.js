
exports.up = function (knex) {
  return knex.schema
    .createTable('zoos', tbl => {
      // it's better if column names are unique
      // for the entire database
      tbl.increments('zoo_id');
      // two different zoos may have the same name
      tbl.string('zoo_name', 128)
        .notNullable();
      tbl.string('address', 128)
        .notNullable()
        .unique();
    })
    // we can chain together createTable
    .createTable('species', tbl => {
      tbl.increments('species_id');
      tbl.string('species_name', 128);
    })
    .createTable('animals', tbl => {
      tbl.increments('animal_id');
      tbl.string('animal_name', 128);
      // must come after species table is created
      tbl.integer('species_id')
        .unsigned() // forces integer to be positive
        .notNullable()
        .references('species_id')
        .inTable('species')
        .onDelete('RESTRICT')
        .onUpdate('RESTRICT');
    })
    .createTable('zoo_animals', tbl => {
      tbl.integer('zoo_id')
        .unsigned()
        .notNullable()
        .references('zoo_id')
        .inTable('zoos')
        .onDelete('RESTRICT')
        .onUpdate('RESTRICT');
      tbl.integer('animal_id')
        .unsigned()
        .notNullable()
        .references('animal_id')
        .inTable('animals')
        .onDelete('RESTRICT')
        .onUpdate('RESTRICT');
      // THIS IS HOW WE WOULD MAKE A COMPOSITE PRIMARY KEY
      // the combination of the two keys becomes our primary key
      // will enforce unique combinations of ids
      tbl.primary(['zoo_id', 'animal_id']);
    });
};

exports.down = function (knex) {
  // drop in the opposite order
  return knex.schema
    .dropTableIfExists('zoo_animals')
    .dropTableIfExists('animals')
    .dropTableIfExists('species')
    .dropTableIfExists('zoos');
};
