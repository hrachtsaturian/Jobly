const { BadRequestError } = require("../expressError");

/**
 * Given a JS object, tranform it into SQL query substring for an update operation
 * Example:
 * 
 * dataToUpdate: {
 *  name: "name",
 *  description: "descr",
 *  numEmployees: 1500
 * }
 * 
 * jsToSql: {
 *  numEmployees: "num_employees"
 * }
 * 
 * @param {Object} dataToUpdate - data to update, must contain at least one prop
 * @param {Object} jsToSql - will map JS camel case into sql snake case
 * @returns {Object} { setCols, values }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql={}) {
  const keys = Object.keys(dataToUpdate);

  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) => 
      `"${jsToSql?.[colName] || colName}"=$${idx + 1}`,
  );

  // cols=[`"name"=$1`, `"num_employees"=$2`]
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
