
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('zoos', tbl => {
      tbl.increments();
      // two different zoos may have the same name
      tbl.string('zoo_name', 128)
        .notNullable();
      tbl.string('address', 128)
        .notNullable()
        .unique();
    })
    // we can chain together createTable
    .createTable('species', tbl => {
      tbl.increments();
      tbl.string('species_name', 128);
    })
    .createTable('animals', tbl => {
      tbl.increments();
      tbl.string('animal_name', 128);
      // must come after species table is created
      tbl.integer('species_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('species')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
    })
    .createTable('zoo_animals', tbl => {
      tbl.integer('zoo_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('zoos')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
      tbl.integer('animal_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('animals')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
      // the combination of the two keys becomes our primary key
      // will enforce unique combinations of ids
      tbl.primary(['zoo_id', 'animal_id']);
    });
};

exports.down = function(knex, Promise) {
  // drop in the opposite order
  return knex.schema
    .dropTableIfExists('zoo_animals')
    .dropTableIfExists('animals')
    .dropTableIfExists('species')
    .dropTableIfExists('zoos');
};
