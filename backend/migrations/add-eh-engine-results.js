'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('prescriptions');

    const addIfMissing = async (col, def) => {
      if (!table[col]) {
        await queryInterface.addColumn('prescriptions', col, def);
        console.log(`Added column: ${col}`);
      }
    };

    await addIfMissing('eh_prakriti',     { type: Sequelize.STRING(20) });
    await addIfMissing('eh_polarity',     { type: Sequelize.STRING(20) });
    await addIfMissing('eh_potency',      { type: Sequelize.STRING(15) });
    await addIfMissing('eh_formula_a',    { type: Sequelize.TEXT });
    await addIfMissing('eh_formula_b',    { type: Sequelize.TEXT });
    await addIfMissing('eh_systems',      { type: Sequelize.TEXT });
    await addIfMissing('eh_safety',       { type: Sequelize.STRING(10) });
    await addIfMissing('eh_parcha',       { type: Sequelize.TEXT });
    await addIfMissing('eh_engine_used',  { type: Sequelize.BOOLEAN,
                                            defaultValue: false });
  },
  down: async (queryInterface) => {
    const cols = ['eh_prakriti','eh_polarity','eh_potency',
                  'eh_formula_a','eh_formula_b','eh_systems',
                  'eh_safety','eh_parcha','eh_engine_used'];
    for (const col of cols) {
      await queryInterface.removeColumn('Consultations', col)
        .catch(() => {});
    }
  }
};
